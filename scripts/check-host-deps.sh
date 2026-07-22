#!/usr/bin/env bash
# Host dependency check — run BEFORE `bun install`.
# Usage (from repo root):
#   ./scripts/check-host-deps.sh
#   bun run check-deps
#   npm run check-deps
#
# Exit 0 if all *required* tools are present; 1 otherwise.
# Recommended tools print warnings but do not fail the script.

set -u

REQUIRED_FAIL=0
WARN=0

ok()   { printf '[ok]  %s\n' "$*"; }
fail() { printf '[NO]  %s\n' "$*"; REQUIRED_FAIL=1; }
warn() { printf '[!]   %s\n' "$*"; WARN=1; }
info() { printf '[--]  %s\n' "$*"; }

need_cmd() {
  local name="$1" install_hint="$2"
  if command -v "$name" >/dev/null 2>&1; then
    local ver
    ver="$("$name" --version 2>&1 | head -n1 | tr -d '\r')"
    ok "$name — $ver"
  else
    fail "$name — missing. $install_hint"
  fi
}

want_cmd() {
  local name="$1" install_hint="$2"
  if command -v "$name" >/dev/null 2>&1; then
    local ver
    ver="$("$name" --version 2>&1 | head -n1 | tr -d '\r')"
    ok "$name — $ver"
  else
    warn "$name — not found (recommended). $install_hint"
  fi
}

echo "VersionGate host deps check (before install)"
echo "============================================"
echo ""

# ── Required ─────────────────────────────────────────────────────────────────
echo "Required"
need_cmd git "Install: sudo apt install -y git"
need_cmd curl "Install: sudo apt install -y curl"

if command -v bun >/dev/null 2>&1; then
  ok "bun — $(bun --version 2>&1 | head -n1)"
else
  fail "bun — missing. Install: curl -fsSL https://bun.sh/install | bash"
fi

DOCKER_BIN="${DOCKER_BIN:-docker}"
if command -v "$DOCKER_BIN" >/dev/null 2>&1; then
  ok "docker CLI — $($DOCKER_BIN version --format '{{.Client.Version}}' 2>/dev/null || $DOCKER_BIN --version 2>&1 | head -n1)"
  if $DOCKER_BIN info >/dev/null 2>&1; then
    ok "docker daemon — reachable"
  else
    fail "docker daemon — not reachable (start dockerd; add user to docker group: sudo usermod -aG docker \$USER)"
  fi
else
  fail "docker — missing. Install: curl -fsSL https://get.docker.com | sudo sh"
fi

echo ""
echo "Recommended"
want_cmd node "Optional if you only use Bun"
want_cmd npm "Optional; Bun can install packages"
want_cmd nginx "Install: sudo apt install -y nginx (traffic switching)"
want_cmd pm2 "Install: npm i -g pm2 (or use systemd)"
want_cmd psql "Install: sudo apt install -y postgresql-client (or use remote DATABASE_URL)"
want_cmd certbot "Install: sudo apt install -y certbot python3-certbot-nginx"

echo ""
echo "After this passes, install VersionGate:"
echo "  bun install"
echo "  cd dashboard && bun install && bun run build && cd .."
echo "  docker network create versiongate-net"
echo "  bun run preflight    # full host + network + paths check"
echo ""

if [[ "$REQUIRED_FAIL" -ne 0 ]]; then
  echo "Result: FAILED — fix required tools above, then re-run."
  echo ""
  echo "On Ubuntu/Debian VM, install everything in one shot:"
  echo "  sudo bash scripts/bootstrap-host.sh"
  echo "  newgrp docker"
  echo "  npm run check-deps"
  exit 1
fi

if [[ "$WARN" -ne 0 ]]; then
  echo "Result: OK (with recommended warnings)"
else
  echo "Result: OK"
fi
exit 0
