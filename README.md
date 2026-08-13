# VersionGate

> **Self-hosted zero-downtime Docker deployment engine.** Push code to GitHub -> VersionGate builds your Docker container, validates endpoint health on an isolated slot, atomically switches Nginx traffic, and tears down the legacy slot with 0 ms downtime.

---

## Quick 1-Command Host Installer (Ubuntu / Debian / RHEL)

Install VersionGate end-to-end on a fresh or existing VM (installs Docker, Nginx, Node 20, Bun, PM2, configures Nginx reverse proxy, PM2 systemd boot persistence, and starts VersionGate):

```bash
curl -fsSL https://versiongate.tech/install.sh | sudo bash
```

### With Custom Domain & Automatic TLS (Certbot)
If you have a domain pointing to your VM's public IP:

```bash
DOMAIN=versiongate.tech curl -fsSL https://versiongate.tech/install.sh | sudo bash
```

Once installed, open your browser directly to complete the 1-minute setup wizard:
- **HTTP**: `http://your-server-ip/`
- **HTTPS (if DOMAIN set)**: `https://your-domain.com/`

> **Azure VM Users**: Azure enforces Cloud Network Security Groups (NSGs) outside the OS firewall. Ensure inbound ports `80`, `443`, and `9090` (TCP) are allowed in `Azure Portal -> VM -> Networking -> Inbound port rules`, or run `az network nsg rule create --resource-group <RG> --nsg-name <NSG> --name Allow-VersionGate-Inbound --priority 1010 --direction Inbound --access Allow --protocol Tcp --destination-port-ranges 80 443 9090`.

---

## Core Engine Capabilities

- **Zero-Downtime Blue/Green Swaps**: Every deploy targets an isolated idle slot (`:3100` / `:3101`). Live traffic switches atomically via Nginx upstream reload only after health check passes (`200 OK`).
- **Nginx Reverse Proxy Automation**: Nginx runs in front of the engine, proxying port 80/443 traffic directly to `127.0.0.1:9090` with full WebSocket header support.
- **PM2 Systemd Boot Persistence**: Auto-generates and enables `pm2-$USER` systemd services to ensure VersionGate automatically restarts across server reboots.
- **Instant Warm-Swap Rollbacks (< 2s)**: Sub-second rollbacks reusing locally cached Docker image tags without git re-pulling or context rebuilds.
- **Stage Path Reverse Proxy**: Exposes dev, staging, and production environments over clean path URLs (`/p/:projectName/:stage`) routed dynamically through Nginx without raw ports.
- **Bearer API Access Tokens**: Generates persistent `vg_live_...` SHA-256 hashed API Bearer tokens for GitHub Actions, GitLab CI, and external automation scripts.
- **Per-Environment Variable Overrides**: Configure stage-specific environment variables for development, staging, and production that seamlessly override global project defaults.
- **Native Engine Background Monitor**: Continuous background thread inspecting PostgreSQL DB latency, Redis pub/sub state, container lifecycles, and system CPU/RAM/Disk limits.
- **Signed GitHub Webhooks**: HMAC SHA-256 signature verification triggering automated deployments on git push.

---

## License

Distributed under the **MIT License**. Created by **Dinesh Korukonda**.
