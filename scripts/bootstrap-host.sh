#!/usr/bin/env bash
# Bootstrap a Linux host for VersionGate (Ubuntu/Debian).
#
# Installs / configures:
#   - git, curl, ca-certificates
#   - Bun (if missing)
#   - Docker Engine + compose plugin
#   - docker network versiongate-net
#   - /var/versiongate/projects (writable by current user)
#   - nginx, certbot (+ nginx plugin), pm2 (recommended)
#
# Usage (from repo root, on the VM):
#   sudo bash scripts/bootstrap-host.sh
#   npm run bootstrap-host
#   bun run bootstrap-host
#
# Options:
#   --minimal     Skip nginx / certbot / pm2
#   --with-postgres  Also apt-install postgresql (local DB)
#   --skip-docker    Do not install Docker (if already present via snap/etc.)
#
set -euo pipefail

MINIMAL=0
WITH_POSTGRES=0
SKIP_DOCKER=0
DOCKER_NETWORK="${DOCKER_NETWORK:-versiongate-net}"
PROJECTS_ROOT="${PROJECTS_ROOT_PATH:-/var/versiongate/projects}"

for arg in "$@"; do
  case "$arg" in
    --minimal) MINIMAL=1 ;;
    --with-postgres) WITH_POSTGRES=1 ;;
    --skip-docker) SKIP_DOCKER=1 ;;
    -h|--help)
      sed -n '2,24p' "$0"
      exit 0
      ;;
  esac
done

log()  { printf '\n==> %s\n' "$*"; }
ok()   { printf '  [ok] %s\n' "$*"; }
warn() { printf '  [!]  %s\n' "$*"; }
die()  { printf '  [NO] %s\n' "$*" >&2; exit 1; }

# Resolve the user who should own projects dir / docker group
REAL_USER="${SUDO_USER:-${USER:-}}"
if [[ -z "$REAL_USER" || "$REAL_USER" == "root" ]]; then
  REAL_USER="$(logname 2>/dev/null || echo root)"
fi
REAL_HOME="$(getent passwd "$REAL_USER" 2>/dev/null | cut -d: -f6 || echo /root)"

if [[ "$(id -u)" -ne 0 ]]; then
  if command -v sudo >/dev/null 2>&1; then
    exec sudo -E bash "$0" "$@"
  fi
  die "Run with sudo: sudo bash scripts/bootstrap-host.sh"
fi

if [[ ! -f /etc/os-release ]]; then
  die "Unsupported OS (need /etc/os-release)"
fi
# shellcheck source=/dev/null
. /etc/os-release
case "${ID:-}" in
  ubuntu|debian) ok "OS: $PRETTY_NAME" ;;
  *)
    warn "Untested OS: $PRETTY_NAME — continuing with apt-style packages"
    ;;
esac

export DEBIAN_FRONTEND=noninteractive

log "Base packages (git, curl, ca-certificates, gnupg)"
apt-get update -y
apt-get install -y --no-install-recommends \
  ca-certificates curl git gnupg lsb-release apt-transport-https

# ── Bun ───────────────────────────────────────────────────────────────────────
log "Bun runtime"
if command -v bun >/dev/null 2>&1; then
  ok "bun already installed: $(bun --version)"
elif [[ -x "$REAL_HOME/.bun/bin/bun" ]]; then
  ok "bun found at $REAL_HOME/.bun/bin/bun"
else
  log "Installing Bun for user $REAL_USER"
  sudo -u "$REAL_USER" -H bash -lc 'curl -fsSL https://bun.sh/install | bash'
  ok "Bun installed — ensure PATH includes ~/.bun/bin (re-login or source ~/.bashrc)"
fi

# ── Docker ────────────────────────────────────────────────────────────────────
if [[ "$SKIP_DOCKER" -eq 1 ]]; then
  warn "Skipping Docker install (--skip-docker)"
else
  log "Docker Engine"
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    ok "Docker already working: $(docker version --format '{{.Server.Version}}' 2>/dev/null || echo ok)"
  else
    log "Installing Docker via get.docker.com"
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
    ok "Docker installed and started"
  fi

  if id "$REAL_USER" >/dev/null 2>&1; then
    usermod -aG docker "$REAL_USER"
    ok "Added $REAL_USER to docker group (log out/in or: newgrp docker)"
  fi
fi

# ── Docker network ────────────────────────────────────────────────────────────
log "Docker network: $DOCKER_NETWORK"
if docker network inspect "$DOCKER_NETWORK" >/dev/null 2>&1; then
  ok "Network $DOCKER_NETWORK already exists"
else
  docker network create "$DOCKER_NETWORK"
  ok "Created network $DOCKER_NETWORK"
fi

# ── Projects directory ────────────────────────────────────────────────────────
log "Projects directory: $PROJECTS_ROOT"
mkdir -p "$PROJECTS_ROOT"
chown -R "$REAL_USER:$REAL_USER" "$(dirname "$PROJECTS_ROOT")" 2>/dev/null || chown -R "$REAL_USER:$REAL_USER" "$PROJECTS_ROOT"
chmod 755 "$PROJECTS_ROOT"
ok "Writable by $REAL_USER: $PROJECTS_ROOT"

# ── Recommended stack ─────────────────────────────────────────────────────────
if [[ "$MINIMAL" -eq 0 ]]; then
  log "Recommended: nginx + certbot"
  apt-get install -y --no-install-recommends nginx certbot python3-certbot-nginx || warn "nginx/certbot install had issues"

  if command -v nginx >/dev/null 2>&1; then
    systemctl enable --now nginx || true
    ok "nginx: $(nginx -v 2>&1)"
  fi

  log "Recommended: Node.js + npm + PM2"
  apt-get install -y --no-install-recommends nodejs npm || warn "nodejs/npm apt install had issues"
  if command -v npm >/dev/null 2>&1; then
    npm install -g pm2
    ok "pm2: $(pm2 --version 2>/dev/null || echo installed)"
  else
    warn "PM2 skipped — install later: sudo apt install -y nodejs npm && sudo npm i -g pm2"
  fi
else
  warn "Minimal mode — skipped nginx / certbot / pm2"
fi

if [[ "$WITH_POSTGRES" -eq 1 ]]; then
  log "PostgreSQL (local)"
  apt-get install -y postgresql postgresql-contrib
  systemctl enable --now postgresql
  ok "PostgreSQL installed — create DB/user for VersionGate (see docs/SETUP.md)"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "============================================"
echo " Bootstrap complete"
echo "============================================"
echo ""
echo "Next (as $REAL_USER):"
echo "  1. Apply docker group:  newgrp docker   # or log out/in"
echo "  2. cd ~/VersionGate   # (or your clone path)"
echo "  3. npm run check-deps"
echo "  4. bun install && cd dashboard && bun install && bun run build && cd .."
echo "  5. bun run preflight"
echo "  6. bun --watch src/server.ts   # or: pm2 start ecosystem.config.cjs"
echo "  7. Open http://<this-vm>:9090/setup"
echo ""
echo "GitHub App later needs PUBLIC_URL=https://your-domain (HTTPS reachable)."
echo ""

# Non-fatal: print docker status for current shell (may fail until newgrp)
if docker info >/dev/null 2>&1; then
  ok "docker info OK in this root shell"
else
  warn "docker info failed here — after logout, verify: docker info"
fi
