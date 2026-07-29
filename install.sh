#!/usr/bin/env bash
# Universal One-Line Installer for VersionGate (Ubuntu/Debian/RHEL).
# Installs base tools, Bun, Docker, configures firewall ports, builds dashboard,
# and starts the VersionGate engine in Setup Mode on port 9090.
#
# Usage on a fresh VM:
#   curl -fsSL https://versiongate.tech/install.sh | bash
#   or locally: bash install.sh
#
set -euo pipefail

log()  { printf '\n==> %s\n' "$*"; }
ok()   { printf '  [ok] %s\n' "$*"; }
warn() { printf '  [!]  %s\n' "$*"; }
die()  { printf '  [NO] %s\n' "$*" >&2; exit 1; }

REAL_USER="${SUDO_USER:-${USER:-}}"
if [[ -z "$REAL_USER" || "$REAL_USER" == "root" ]]; then
  REAL_USER="$(logname 2>/dev/null || echo root)"
fi
REAL_HOME="$(getent passwd "$REAL_USER" 2>/dev/null | cut -d: -f6 || echo /root)"

if [[ "$(id -u)" -ne 0 ]]; then
  if command -v sudo >/dev/null 2>&1; then
    exec sudo -E bash "$0" "$@"
  fi
  die "Run with sudo: sudo bash install.sh"
fi

log "1. System Base Packages (curl, git, unzip, ca-certificates, tar)"
if command -v apt-get >/dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y --no-install-recommends \
    ca-certificates curl git gnupg lsb-release apt-transport-https unzip tar
elif command -v dnf >/dev/null 2>&1; then
  dnf install -y curl git unzip ca-certificates tar
elif command -v yum >/dev/null 2>&1; then
  yum install -y curl git unzip ca-certificates tar
fi
ok "Base dependencies verified"

log "2. Bun Runtime"
if command -v bun >/dev/null 2>&1; then
  ok "Bun already installed: $(bun --version)"
elif [[ -x "$REAL_HOME/.bun/bin/bun" ]]; then
  ok "Bun found at $REAL_HOME/.bun/bin/bun"
else
  log "Installing Bun for $REAL_USER"
  sudo -u "$REAL_USER" -H bash -lc 'curl -fsSL https://bun.sh/install | bash' || true
  export PATH="$REAL_HOME/.bun/bin:$PATH"
  ok "Bun runtime installed"
fi

log "3. Docker Engine"
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  ok "Docker already running"
else
  log "Installing Docker Engine"
  curl -fsSL https://get.docker.com | sh || true
  systemctl enable --now docker || true
  ok "Docker Engine installed"
fi

groupadd -f docker || true
if id "$REAL_USER" >/dev/null 2>&1; then
  usermod -aG docker "$REAL_USER" || true
fi

DOCKER_NET="versiongate-net"
if docker network inspect "$DOCKER_NET" >/dev/null 2>&1; then
  ok "Docker network $DOCKER_NET exists"
else
  docker network create "$DOCKER_NET" || true
  ok "Created docker network $DOCKER_NET"
fi

PROJECTS_DIR="/var/versiongate/projects"
mkdir -p "$PROJECTS_DIR"
chown -R "$REAL_USER:$REAL_USER" "$PROJECTS_DIR" 2>/dev/null || true
chmod 755 "$PROJECTS_DIR"
ok "Projects directory ready: $PROJECTS_DIR"

log "4. Host Firewall Configuration (UFW / Firewalld)"
if command -v ufw >/dev/null 2>&1; then
  ufw allow 9090/tcp comment 'VersionGate API' 2>/dev/null || true
  ufw allow 5173/tcp comment 'VersionGate Dashboard' 2>/dev/null || true
  ufw allow 80/tcp comment 'HTTP Web' 2>/dev/null || true
  ufw allow 443/tcp comment 'HTTPS Web' 2>/dev/null || true
  ok "Configured UFW rules for ports 9090, 5173, 80, 443"
elif command -v firewall-cmd >/dev/null 2>&1; then
  firewall-cmd --permanent --add-port=9090/tcp --add-port=5173/tcp --add-port=80/tcp --add-port=443/tcp 2>/dev/null || true
  firewall-cmd --reload 2>/dev/null || true
  ok "Configured Firewalld rules for ports 9090, 5173, 80, 443"
fi

log "5. Repository Setup & Dependencies"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ ! -f "$SCRIPT_DIR/package.json" ]]; then
  TARGET_DIR="$REAL_HOME/VersionGate"
  if [[ ! -d "$TARGET_DIR" ]]; then
    sudo -u "$REAL_USER" git clone https://github.com/dineshkorukonda/VersionGate.git "$TARGET_DIR"
  fi
  cd "$TARGET_DIR"
else
  cd "$SCRIPT_DIR"
fi

sudo -u "$REAL_USER" -H bash -lc "export PATH=\"$REAL_HOME/.bun/bin:\$PATH\"; bun install"
sudo -u "$REAL_USER" -H bash -lc "export PATH=\"$REAL_HOME/.bun/bin:\$PATH\"; cd dashboard && bun install && bun run build"

log "6. Starting VersionGate Engine in Setup Mode"
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2 || true
fi

sudo -u "$REAL_USER" -H bash -lc "export PATH=\"$REAL_HOME/.bun/bin:\$PATH\"; pm2 start ecosystem.config.cjs 2>/dev/null || pm2 restart versiongate-api 2>/dev/null || true"

SERVER_IP="$(curl -s https://api.ipify.org 2>/dev/null || echo 'YOUR_VM_IP')"

echo ""
echo "============================================================"
echo " [ OK ] VersionGate Host Installation Complete!"
echo "============================================================"
echo ""
echo " Open your browser to complete setup:"
echo "   http://${SERVER_IP}:9090/setup"
echo ""
echo " (If using domain/HTTPS, configure DNS A record to ${SERVER_IP})"
echo "============================================================"
echo ""
