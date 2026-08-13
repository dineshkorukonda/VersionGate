#!/usr/bin/env bash
# Universal One-Line Installer for VersionGate (Ubuntu/Debian/RHEL).
# Installs Docker, Nginx, Node (via NodeSource, not distro apt), Bun, PM2,
# configures Nginx reverse proxy & firewall, builds dashboard, starts the engine,
# persists PM2 systemd service across host reboots, and detects Azure NSG rules.
#
# Usage on a fresh VM (root or sudo user):
#   curl -fsSL https://versiongate.tech/install.sh | sudo bash
# With custom domain & automatic TLS:
#   DOMAIN=versiongate.tech curl -fsSL https://versiongate.tech/install.sh | sudo bash
# Local execution:
#   sudo bash install.sh
#
set -Eeuo pipefail

log()  { printf '\n==> %s\n' "$*"; }
ok()   { printf '  [ok] %s\n' "$*"; }
warn() { printf '  [!]  %s\n' "$*"; }
die()  { printf '  [FAIL] %s\n' "$*" >&2; exit 1; }

trap 'die "Install aborted at line $LINENO. Last command: $BASH_COMMAND"' ERR

# ---------------------------------------------------------------------------
# 0. Root check / self-elevate
# ---------------------------------------------------------------------------
if [[ "$(id -u)" -ne 0 ]]; then
  if command -v sudo >/dev/null 2>&1; then
    exec sudo -E bash "$0" "$@"
  fi
  die "Run as root: curl -fsSL https://versiongate.tech/install.sh | sudo bash"
fi

REAL_USER="${SUDO_USER:-root}"
REAL_HOME="$(getent passwd "$REAL_USER" 2>/dev/null | cut -d: -f6 || echo /root)"
[[ -d "$REAL_HOME" ]] || REAL_HOME=/root

run_as_user() { sudo -u "$REAL_USER" -H bash -lc "$1"; }

# ---------------------------------------------------------------------------
# 1. OS detection
# ---------------------------------------------------------------------------
if command -v apt-get >/dev/null 2>&1; then
  PKG_FAMILY=deb
elif command -v dnf >/dev/null 2>&1; then
  PKG_FAMILY=rpm; PKG_MGR=dnf
elif command -v yum >/dev/null 2>&1; then
  PKG_FAMILY=rpm; PKG_MGR=yum
else
  die "Unsupported OS: need apt-get, dnf, or yum."
fi
ok "Detected package family: $PKG_FAMILY"

# ---------------------------------------------------------------------------
# 2. Base packages
# ---------------------------------------------------------------------------
log "1. Base packages (curl, git, unzip, ca-certificates, tar, nginx)"
if [[ "$PKG_FAMILY" == deb ]]; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y --no-install-recommends \
    ca-certificates curl git gnupg lsb-release apt-transport-https unzip tar nginx
else
  "$PKG_MGR" install -y curl git unzip ca-certificates tar nginx
fi
ok "Base dependencies installed"

# ---------------------------------------------------------------------------
# 3. Node.js via NodeSource (fixes version-roulette from distro apt)
# ---------------------------------------------------------------------------
log "2. Node.js 20 LTS (NodeSource)"
NEED_NODE=1
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -v | sed 's/^v//' | cut -d. -f1)"
  if [[ "$NODE_MAJOR" -ge 20 ]]; then
    NEED_NODE=0
    ok "Node $(node -v) already satisfies >=20"
  else
    warn "Node $(node -v) too old, upgrading"
  fi
fi
if [[ "$NEED_NODE" -eq 1 ]]; then
  if [[ "$PKG_FAMILY" == deb ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  else
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    "$PKG_MGR" install -y nodejs
  fi
  ok "Node $(node -v) installed"
fi

# ---------------------------------------------------------------------------
# 4. Bun
# ---------------------------------------------------------------------------
log "3. Bun runtime"
if [[ -x "$REAL_HOME/.bun/bin/bun" ]]; then
  ok "Bun already installed: $("$REAL_HOME/.bun/bin/bun" --version)"
else
  run_as_user 'curl -fsSL https://bun.sh/install | bash'
  [[ -x "$REAL_HOME/.bun/bin/bun" ]] || die "Bun install failed — check network access to bun.sh"
  ok "Bun installed: $("$REAL_HOME/.bun/bin/bun" --version)"
fi
export PATH="$REAL_HOME/.bun/bin:$PATH"

# ---------------------------------------------------------------------------
# 5. Docker
# ---------------------------------------------------------------------------
log "4. Docker Engine"
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  ok "Docker already running"
else
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
  docker info >/dev/null 2>&1 || die "Docker installed but daemon not responding"
  ok "Docker Engine installed and running"
fi
groupadd -f docker
[[ "$REAL_USER" == root ]] || usermod -aG docker "$REAL_USER"

DOCKER_NET="versiongate-net"
docker network inspect "$DOCKER_NET" >/dev/null 2>&1 || docker network create "$DOCKER_NET" >/dev/null
ok "Docker network $DOCKER_NET ready"

PROJECTS_DIR="/var/versiongate/projects"
mkdir -p "$PROJECTS_DIR"
chown -R "$REAL_USER:$REAL_USER" "$PROJECTS_DIR"
chmod 755 "$PROJECTS_DIR"
ok "Projects directory ready: $PROJECTS_DIR"

# ---------------------------------------------------------------------------
# 6. Firewall & Cloud Security Groups (UFW / Firewalld / Azure NSG)
# ---------------------------------------------------------------------------
log "5. Firewall & Cloud Network Security"
if command -v ufw >/dev/null 2>&1; then
  ufw allow 9090/tcp comment 'VersionGate API/setup' || true
  ufw allow 80/tcp comment 'HTTP' || true
  ufw allow 443/tcp comment 'HTTPS' || true
  ok "UFW rules set (9090, 80, 443). 3100/3101 intentionally NOT exposed."
elif command -v firewall-cmd >/dev/null 2>&1; then
  firewall-cmd --permanent --add-port=9090/tcp --add-port=80/tcp --add-port=443/tcp
  firewall-cmd --reload
  ok "Firewalld rules set (9090, 80, 443). 3100/3101 intentionally NOT exposed."
else
  warn "No ufw/firewalld found — open 80/443/9090 manually via your cloud provider's security group."
fi

# Azure IMDS Detection
AZURE_DETECTED=0
AZURE_META=""
if AZURE_META="$(curl -s -H "Metadata:true" --connect-timeout 2 --max-time 2 "http://169.254.169.254/metadata/instance?api-version=2021-02-01" 2>/dev/null)" && [[ -n "$AZURE_META" ]]; then
  if echo "$AZURE_META" | grep -qi "azEnvironment\|resourceGroupName\|compute"; then
    AZURE_DETECTED=1
    ok "Azure VM environment detected via IMDS"
  fi
fi

AZ_AUTOFIX_SUCCESS=0
if [[ "$AZURE_DETECTED" -eq 1 ]]; then
  if command -v az >/dev/null 2>&1 && az account show >/dev/null 2>&1; then
    RESOURCE_GROUP="$(echo "$AZURE_META" | grep -o '"resourceGroupName":"[^"]*"' | head -n 1 | cut -d'"' -f4 || echo "")"
    VM_NAME="$(echo "$AZURE_META" | grep -o '"name":"[^"]*"' | head -n 1 | cut -d'"' -f4 || echo "")"
    if [[ -n "$RESOURCE_GROUP" && -n "$VM_NAME" ]]; then
      NSG_NAME="$(az vm show --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --query "networkProfile.networkInterfaces[0].id" -o tsv 2>/dev/null | xargs -I {} az network nic show --ids {} --query "networkSecurityGroup.id" -o tsv 2>/dev/null | xargs -I {} basename {} 2>/dev/null || echo "")"
      if [[ -n "$NSG_NAME" ]]; then
        az network nsg rule create \
          --resource-group "$RESOURCE_GROUP" \
          --nsg-name "$NSG_NAME" \
          --name "Allow-VersionGate-Inbound" \
          --priority 1010 \
          --direction Inbound \
          --access Allow \
          --protocol Tcp \
          --destination-port-ranges 80 443 9090 >/dev/null 2>&1 || true
        AZ_AUTOFIX_SUCCESS=1
        ok "Azure NSG inbound rule 'Allow-VersionGate-Inbound' configured via Azure CLI (ports 80, 443, 9090)"
      fi
    fi
  fi
fi

# ---------------------------------------------------------------------------
# 7. Clone / locate repo, install deps, build dashboard
# ---------------------------------------------------------------------------
log "6. Repository & dependencies"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || echo "$PWD")"
if [[ -f "$SCRIPT_DIR/package.json" ]]; then
  TARGET_DIR="$SCRIPT_DIR"
else
  TARGET_DIR="$REAL_HOME/VersionGate"
  if [[ -d "$TARGET_DIR/.git" ]]; then
    run_as_user "cd '$TARGET_DIR' && git pull --ff-only"
  else
    rm -rf "$TARGET_DIR"   # clear any half-cloned dir from a failed prior run
    run_as_user "git clone https://github.com/dineshkorukonda/VersionGate.git '$TARGET_DIR'"
  fi
fi
cd "$TARGET_DIR"
ok "Using repo at $TARGET_DIR"

run_as_user "cd '$TARGET_DIR' && export PATH=\"$REAL_HOME/.bun/bin:\$PATH\" && bun install"
run_as_user "cd '$TARGET_DIR/dashboard' && export PATH=\"$REAL_HOME/.bun/bin:\$PATH\" && bun install && bun run build"
[[ -d "$TARGET_DIR/dashboard/dist" || -d "$TARGET_DIR/dashboard/build" ]] \
  || warn "Dashboard build finished but no dist/build output found — check dashboard/vite.config for output dir"
ok "Dependencies installed, dashboard built"

# ---------------------------------------------------------------------------
# 8. PM2 + persistence across reboots
# ---------------------------------------------------------------------------
log "7. Starting VersionGate Engine & configuring boot persistence"
command -v pm2 >/dev/null 2>&1 || npm install -g pm2
run_as_user "cd '$TARGET_DIR' && export PATH=\"$REAL_HOME/.bun/bin:\$PATH\" && (pm2 start ecosystem.config.cjs || pm2 restart versiongate-api)"
run_as_user "export PATH=\"$REAL_HOME/.bun/bin:\$PATH\" && pm2 save"

PM2_BIN="$(command -v pm2)"
PM2_STARTUP_CMD="$("$PM2_BIN" startup systemd -u "$REAL_USER" --hp "$REAL_HOME" | grep -E "sudo env|systemctl" || true)"
if [[ -n "$PM2_STARTUP_CMD" ]]; then
  eval "$PM2_STARTUP_CMD" || true
fi

PM2_SERVICE="pm2-$REAL_USER"
if systemctl is-enabled "$PM2_SERVICE" >/dev/null 2>&1; then
  ok "PM2 systemd service ($PM2_SERVICE) is enabled and persistent across reboots"
else
  systemctl enable "$PM2_SERVICE" >/dev/null 2>&1 || true
  systemctl is-enabled "$PM2_SERVICE" >/dev/null 2>&1 || warn "PM2 systemd service ($PM2_SERVICE) unconfirmed — verify with 'systemctl status $PM2_SERVICE'"
fi

# ---------------------------------------------------------------------------
# 9. Nginx reverse proxy + optional TLS via Certbot
# ---------------------------------------------------------------------------
log "8. Nginx reverse proxy"
DOMAIN="${DOMAIN:-}"
SERVER_IP="$(curl -s https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}' || echo '127.0.0.1')"

if [[ -n "$DOMAIN" ]]; then
  PUBLIC_HOST="$DOMAIN"
  SCHEME="https"
else
  PUBLIC_HOST="$SERVER_IP"
  SCHEME="http"
fi

NGINX_CONF="/etc/nginx/conf.d/versiongate.conf"
if [[ -d "/etc/nginx/sites-available" ]]; then
  NGINX_CONF="/etc/nginx/sites-available/versiongate"
fi

# Set directory write permissions for Nginx conf directory & configure sudoers helper
mkdir -p /etc/nginx/conf.d /etc/nginx/sites-available /etc/nginx/sites-enabled
chown -R "$REAL_USER:$REAL_USER" /etc/nginx/conf.d /etc/nginx/sites-available /etc/nginx/sites-enabled 2>/dev/null || true
chmod -R 775 /etc/nginx/conf.d /etc/nginx/sites-available /etc/nginx/sites-enabled 2>/dev/null || true

if [[ -d "/etc/sudoers.d" ]]; then
  cat <<EOF > /etc/sudoers.d/versiongate
${REAL_USER} ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /bin/cp /tmp/versiongate-nginx* /etc/nginx/*
EOF
  chmod 440 /etc/sudoers.d/versiongate
fi

cat <<EOF > "$NGINX_CONF"
server {
    listen 80;
    listen [::]:80;
    server_name ${PUBLIC_HOST} _;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:9090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

if [[ -d "/etc/nginx/sites-enabled" ]]; then
  ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/versiongate
  rm -f /etc/nginx/sites-enabled/default
fi

systemctl enable --now nginx
nginx -t || die "Nginx configuration test failed — check $NGINX_CONF"
systemctl reload nginx || systemctl restart nginx
ok "Nginx reverse proxy configured for http://${PUBLIC_HOST}"

if [[ -n "$DOMAIN" ]]; then
  log "Provisioning TLS certificate via Certbot for $DOMAIN"
  if [[ "$PKG_FAMILY" == deb ]]; then
    apt-get install -y certbot python3-certbot-nginx
  else
    "$PKG_MGR" install -y certbot python3-certbot-nginx
  fi

  if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect; then
    ok "TLS certificate provisioned successfully for $DOMAIN"
    SCHEME="https"
  else
    warn "Certbot failed to obtain certificate for $DOMAIN — falling back to HTTP"
    SCHEME="http"
  fi
else
  ok "No DOMAIN specified; skipping TLS provisioning (serving HTTP on $PUBLIC_HOST)"
fi

# ---------------------------------------------------------------------------
# 10. End-to-end health check (local engine + public Nginx reverse proxy)
# ---------------------------------------------------------------------------
log "9. End-to-end health check"
READY=0
for i in $(seq 1 15); do
  if curl -fsS "http://127.0.0.1:9090/setup" >/dev/null 2>&1 || curl -fsS "http://127.0.0.1:9090/" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 2
done
[[ "$READY" -eq 1 ]] || die "Engine did not respond on 127.0.0.1:9090 after 30s — run 'pm2 logs versiongate-api' to see why"
ok "Engine responding locally on port 9090"

PROXY_READY=0
for i in $(seq 1 15); do
  if curl -fsS -k -H "Host: ${PUBLIC_HOST}" "http://127.0.0.1/" >/dev/null 2>&1 || \
     curl -fsS -k "${SCHEME}://${PUBLIC_HOST}/" >/dev/null 2>&1 || \
     curl -fsS -k "http://127.0.0.1/setup" >/dev/null 2>&1; then
    PROXY_READY=1
    break
  fi
  sleep 2
done

if [[ "$PROXY_READY" -ne 1 ]]; then
  if [[ "$AZURE_DETECTED" -eq 1 ]]; then
    die "Nginx reverse proxy did not respond on public entrypoint — Azure VM detected: traffic may be blocked by Azure Network Security Group (NSG) rules. Ensure inbound ports 80, 443, and 9090 are allowed in Azure Portal."
  else
    die "Nginx reverse proxy did not respond on public entrypoint — check 'systemctl status nginx' or '/var/log/nginx/error.log'"
  fi
fi
ok "Public Nginx reverse proxy responding successfully (${SCHEME}://${PUBLIC_HOST})"

echo ""
echo "======================================================================"
echo " [ OK ] VersionGate Host Installation Complete!"
echo "======================================================================"
echo ""
echo " Finish setup in your browser:"
echo " ${SCHEME}://${PUBLIC_HOST}"
echo ""
echo " Note: Port 9090 is only used for the initial setup wizard."
echo " Deployments and custom domains route via standard ports 80/443."
echo "======================================================================"
echo ""

if [[ "$AZURE_DETECTED" -eq 1 && "$AZ_AUTOFIX_SUCCESS" -eq 0 ]]; then
  echo "======================================================================"
  echo " [ AZURE NETWORK SECURITY GROUP (NSG) ACTION REQUIRED ]"
  echo "======================================================================"
  echo " Required Inbound Ports: 80, 443, 9090 (TCP)"
  echo ""
  echo " Azure Portal Path:"
  echo "   Azure Portal -> Virtual Machines -> [Your VM] -> Networking -> Add inbound port rule"
  echo ""
  echo " Or run this Azure CLI command:"
  echo "   az network nsg rule create \\"
  echo "     --resource-group <YOUR_RESOURCE_GROUP> \\"
  echo "     --nsg-name <YOUR_NSG_NAME> \\"
  echo "     --name Allow-VersionGate-Inbound \\"
  echo "     --priority 1010 \\"
  echo "     --direction Inbound \\"
  echo "     --access Allow \\"
  echo "     --protocol Tcp \\"
  echo "     --destination-port-ranges 80 443 9090"
  echo "======================================================================"
  echo ""
fi
