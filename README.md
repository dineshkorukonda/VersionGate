# VersionGate

> **Self-hosted zero-downtime Docker deployment engine.** Push code to GitHub -> VersionGate builds your Docker container, validates endpoint health on an isolated slot, atomically switches Nginx traffic, and tears down the legacy slot with 0 ms downtime.

---

## Quick 1-Command Bootstrap (Ubuntu / Debian VPS)

```bash
git clone https://github.com/dineshkorukonda/VersionGate.git
cd VersionGate
sudo bash scripts/bootstrap-host.sh && bun install && bun run build:dashboard && pm2 start ecosystem.config.cjs
```

Open `http://your-server-ip:9090/setup` in your browser to run the 1-minute initialization wizard.

---

## Core Engine Capabilities

- **Zero-Downtime Blue/Green Swaps**: Every deploy targets an isolated idle slot (`:3100` / `:3101`). Live traffic switches atomically via Nginx upstream reload only after health check passes (`200 OK`).
- **Instant Warm-Swap Rollbacks (< 2s)**: Sub-second rollbacks reusing locally cached Docker image tags without git re-pulling or context rebuilds.
- **Stage Path Reverse Proxy**: Exposes dev, staging, and production environments over clean path URLs (`/p/:projectName/:stage`) routed dynamically through Nginx without raw ports.
- **Bearer API Access Tokens**: Generates persistent `vg_live_...` SHA-256 hashed API Bearer tokens for GitHub Actions, GitLab CI, and external automation scripts.
- **Per-Environment Variable Overrides**: Configure stage-specific environment variables for development, staging, and production that seamlessly override global project defaults.
- **Native Engine Background Monitor**: Continuous background thread inspecting PostgreSQL DB latency, Redis pub/sub state, container lifecycles, and system CPU/RAM/Disk limits.
- **Signed GitHub Webhooks**: HMAC SHA-256 signature verification triggering automated deployments on git push.

---

## License

Distributed under the **MIT License**. Created by **Dinesh Korukonda**.
