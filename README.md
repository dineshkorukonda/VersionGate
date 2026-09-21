# VersionGate

Self-hosted zero-downtime Docker & multi-runtime deployment engine with blue/green slot routing, bare-metal PM2 process supervision, in-dashboard UI Database Studio, and automated Nginx reverse proxy management.

Push to GitHub (or invoke the HTTP API), VersionGate builds the application on an idle host slot, validates HTTP health check probes, atomically switches production traffic via Nginx, and enables 1-second warm-swap rollbacks to locally cached image tags.

---

## Quick Install (Ubuntu / Debian / RHEL)

One-command automated host bootstrap:

```bash
curl -fsSL https://versiongate.tech/install.sh | sudo bash
```

With custom domain and automatic Let's Encrypt TLS:

```bash
DOMAIN=versiongate.tech curl -fsSL https://versiongate.tech/install.sh | sudo bash
```

Open the dashboard setup wizard at `http://your-server-ip:9090/` or `https://your-domain/` when `DOMAIN` is configured.

> **Network / Firewall Note:** Ensure inbound TCP ports `80`, `443`, and `9090` are allowed in your cloud provider security groups (AWS Security Groups, Azure NSG, Hetzner Firewall, DigitalOcean Firewalls).

---

## Core Platform Capabilities

### 01 // Zero-Downtime Blue/Green Engine
- **Dedicated Port Pairs:** Allocates a dedicated BLUE/GREEN port pair (`basePort` and `basePort + 1`) per project environment.
- **Health-Gated Traffic Cutover:** Polls `project.healthPath` (e.g. `GET /health`) on the idle slot for HTTP 200 before rewriting the Nginx upstream configuration.
- **Atomic Nginx Reload:** Executes `nginx -s reload` without dropping existing TCP sockets or in-flight requests.
- **Warm-Swap Rollback:** Reuses locally cached Docker image tags to restore previous healthy deployments in under 1.2 seconds, skipping `git clone` and `docker build`.

### 02 // In-Dashboard UI Database Studio & SQL Console
- **Interactive Schema Inspector:** Browse database tables, view column data types, indexes, and relations directly in VersionGate.
- **Live Query Runner:** Execute raw SQL queries (PostgreSQL, MySQL), Redis commands, or MongoDB operations with execution timing telemetry.
- **Data Export:** View records in paginated data tables and export query results directly to CSV or JSON formats.

### 03 // Dual Execution Engines: Docker & Bare-Metal PM2
- **Docker Containerization:** Synthesizes optimized Dockerfiles for containerized isolation.
- **Bare-Metal PM2 Supervision:** Run apps natively on the host via PM2 with automatic port assignment and health validation.
- **Universal Package Managers:** Auto-detects and supports `bun`, `pnpm`, `yarn`, `npm`, `uv`, `poetry`, `pipenv`, `cargo` (Rust), and `composer` (PHP).

### 04 // Managed Multi-Database Provisioning
- **1-Click Containerized Databases:** Provision PostgreSQL 16, Redis, MySQL, or MongoDB with persistent Docker volumes and conflict-free port allocation.
- **Environment Auto-Linking:** Automatically injects `DATABASE_URL` or `REDIS_URL` directly into project encrypted environment variables.

### 05 // Preflight DNS Verification & SSL Automation
- **DNS Propagation Validation:** Conducts direct DNS A and CNAME record queries against the server's public IPv4 before triggering Certbot, preventing Let's Encrypt rate-limit bans.
- **Isolated Upstream Vhosts:** Project-specific Nginx configurations isolate application traffic from the management dashboard.

### 06 // Developer Experience & Observability
- **Global Command Palette:** Grouped `Cmd+K` / `Ctrl+K` keyboard search across projects, navigation tabs, and system actions.
- **Realtime Log Streaming:** Live stdout/stderr log stream viewer with auto-scroll lock, search filtering, and log export.
- **Raw .env Bulk Editor:** Dual-mode key-value inputs alongside raw multiline dotenv editing with AES-256 secret masking.
- **Rolling Telemetry:** 24-hour hit counters, response status code distributions (2xx, 3xx, 4xx, 5xx), and millisecond latency metrics.

### 07 // Cron Jobs & Background Scheduling
- **5-Part Cron Scheduler:** Run background tasks on custom intervals (`*/15 * * * *`) with HTTP webhook triggers and host shell commands.
- **Execution Telemetry:** Real-time log capture, timeout guards, manual trigger execution, and server resource limit analytics.

---

## Deployment Lifecycle Architecture

```
[ Git Push / Webhook ]
        │
        ▼
[ 01 // Distributed Lock ] ── Redis & Postgres FOR UPDATE SKIP LOCKED
        │
        ▼
[ 02 // Stack Detection ] ── Scans bun.lock, Cargo.toml, uv.lock, package.json
        │
        ▼
[ 03 // Build & Run ] ───── Builds image / starts container on IDLE slot (Port N+1)
        │
        ▼
[ 04 // Health Check ] ──── Polls HTTP GET http://127.0.0.1:{idlePort}/health
        │
 ┌──────┴──────┐
 │ (HTTP 200)  │ (Failure / Timeout)
 ▼             ▼
[ 05 // Cutover ]         [ Abort & Retain Active Slot ]
Nginx Upstream Reload     Traffic never drops. Image retained for warm rollback.
```

---

## Local Development & Setup

### Prerequisites
- **Bun** (v1.1+) — `curl -fsSL https://bun.sh/install | bash`
- **PostgreSQL 16** — Local database `versiongate`, user `versiongate`
- **Redis** — Local instance on port `6379`
- **Docker** — Engine socket `/var/run/docker.sock`

### Running Services

| Service | Command | Port | Description |
|---------|---------|------|-------------|
| Backend API | `bun --watch src/server.ts` | 9090 | Fastify REST API & WebSockets |
| Dashboard UI | `cd dashboard && bun run dev` | 5173 | React + Vite + Tailwind CSS |
| Marketing Site | `cd website && bun run dev` | 3000 | Next.js 16 + Turbopack + Docs |

### Verification & Testing Commands

```bash
# Backend TypeScript Check
bun run typecheck

# Run Backend Unit & Integration Tests
bun test --pass-with-no-tests

# Build Dashboard UI
bun run build:dashboard

# Build Website & Documentation
cd website && bun run build
```

---

## Repository Layout

```
VersionGate/
├── src/                      # Fastify Backend API & Engine Core
│   ├── controllers/          # Route handlers (auth, projects, databases, cron, etc.)
│   ├── services/             # Core business logic (deployer, traffic, databases, etc.)
│   ├── repositories/         # Drizzle ORM data access layer
│   ├── db/                   # Drizzle schema and client configurations
│   ├── routes/               # API route definitions (/api/v1/*)
│   └── worker/               # Background queue job worker
├── dashboard/                # React / Vite / Tailwind developer console
│   └── src/                  # Vercel-styled dashboard UI and Command Palette
├── website/                  # Next.js marketing site, changelog, and documentation
│   └── src/                  # Dokploy-inspired bento layout and visualizer
├── scripts/                  # Host bootstrap, preflight, and password reset scripts
└── tests/                    # Unit and integration test suites
```

---

## License & Attribution

Distributed under the **MIT License**. Created by [Dinesh Korukonda](https://github.com/dineshkorukonda).
