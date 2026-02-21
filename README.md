# ZeroShift Engine

Self-hosted one-click deployment pipeline engine with zero-downtime blue-green deployments.
Builds from GitHub source, manages Docker containers, and switches Nginx traffic automatically.
Designed for single-KVM self-hosted setups.

## Stack

- **Runtime** — Bun + TypeScript
- **API** — Fastify
- **Database** — PostgreSQL via Prisma (Neon serverless supported)
- **Containers** — Docker CLI
- **Proxy** — Nginx upstream config management
- **Logging** — Pino

---

## Architecture

```
src/
├── app.ts                            # Fastify instance + plugin registration
├── server.ts                         # Entry point, graceful shutdown, startup reconciliation
├── config/
│   └── env.ts                        # Typed environment config
├── controllers/
│   ├── deployment.controller.ts      # Deploy + list handlers
│   ├── project.controller.ts         # Project CRUD + rollback handlers
│   └── system.controller.ts          # Reconciliation debug handler
├── routes/
│   ├── deployment.routes.ts          # POST /deploy, GET /deployments, GET /status
│   ├── project.routes.ts             # CRUD /projects, POST /projects/:id/rollback
│   └── system.routes.ts              # POST /system/reconcile
├── services/
│   ├── deployment.service.ts         # Blue-green orchestration pipeline
│   ├── git.service.ts                # Clone / pull source from GitHub
│   ├── validation.service.ts         # Container health checks with retry
│   ├── traffic.service.ts            # Nginx upstream config + reload
│   ├── rollback.service.ts           # Rollback to previous deployment
│   └── reconciliation.service.ts     # Startup crash recovery + container audit
├── repositories/
│   ├── deployment.repository.ts      # Deployment data access layer
│   └── project.repository.ts         # Project data access layer
├── prisma/
│   └── client.ts                     # Singleton Prisma client
└── utils/
    ├── docker.ts                     # Docker CLI wrappers (execFileAsync — no shell injection)
    ├── exec.ts                        # execAsync + execFileAsync (child_process)
    ├── errors.ts                      # Typed error classes
    └── logger.ts                      # Pino logger instance
prisma/
└── schema.prisma                      # Project + Deployment models, enums, indexes
```

---

## Deployment Flow

```
POST /api/v1/deploy  { projectId }
  → Acquire per-project in-memory lock
  → Fetch project config from DB
  → git clone / git fetch + reset (source prep)
  → docker build -t zeroshift-<name>:<timestamp> <srcPath>
  → Determine color (BLUE/GREEN) and host port
  → docker run -d --name <name>-<color> -p <hostPort>:<appPort>
  → Health check (up to 5 retries, 2s delay, 2s latency threshold)
    ├─ Pass → nginx -s reload → mark ACTIVE → stop old container → mark old ROLLED_BACK
    └─ Fail → docker stop + rm → mark FAILED
  → Release lock (always, via finally)

POST /api/v1/projects/:id/rollback
  → Validate ACTIVE deployment exists
  → Find most recent ROLLED_BACK deployment (lower version)
  → docker run old container on its original port
  → Health check restarted container
    ├─ Pass → nginx -s reload → stop current → mark statuses
    └─ Fail → cleanup restarted container → abort (current stays ACTIVE)
```

### Blue-Green Port Assignment

| Color | Host Port |
|-------|-----------|
| BLUE  | `project.basePort` |
| GREEN | `project.basePort + 1` |

Container names: `<project.name>-blue` / `<project.name>-green`

### Crash Recovery (Startup Reconciliation)

On every server start, `ReconciliationService` runs before accepting requests:

1. **Crash recovery** — any deployment in `DEPLOYING` state means the process died mid-deploy. The container is stopped/removed and the record is marked `FAILED`.
2. **Container audit** — every `ACTIVE` deployment's container is inspected. If the container is not running, the deployment is marked `FAILED` (traffic is not auto-switched).

---

## API Endpoints

### Projects

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/projects` | Create a project |
| `GET` | `/api/v1/projects` | List all projects |
| `GET` | `/api/v1/projects/:id` | Get a project |
| `DELETE` | `/api/v1/projects/:id` | Delete a project |
| `POST` | `/api/v1/projects/:id/rollback` | Rollback to previous deployment |

#### POST /api/v1/projects
```json
{
  "name": "myapp",
  "repoUrl": "https://github.com/user/repo",
  "branch": "main",
  "appPort": 8080,
  "healthPath": "/health",
  "basePort": 4000
}
```
> `localPath` is auto-computed as `$PROJECTS_BASE_PATH/<project.id>` — do not supply it.

### Deployments

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/deploy` | Trigger a deployment |
| `GET` | `/api/v1/deployments` | List all deployments |
| `GET` | `/api/v1/status` | Current active deployment |

#### POST /api/v1/deploy
```json
{ "projectId": "<id>" }
```

### System

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/system/reconcile` | Manually trigger crash recovery |
| `GET` | `/health` | Server health check |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string (Neon or local) |
| `PROJECTS_BASE_PATH` | Yes | `/var/zeroshift/projects` | Root dir for cloned repos |
| `GIT_TOKEN` | No | — | Personal access token for private repos |
| `NGINX_CONFIG_PATH` | No | `/etc/nginx/conf.d/upstream.conf` | Nginx upstream config file |
| `DOCKER_NETWORK` | No | `zeroshift-net` | Docker network for containers |
| `HEALTH_TIMEOUT_MS` | No | `5000` | Per-request health check timeout |
| `HEALTH_RETRY_DELAY_MS` | No | `2000` | Delay between health check retries |
| `HEALTH_MAX_LATENCY_MS` | No | `2000` | Max acceptable response latency |
| `HEALTH_MAX_RETRIES` | No | `5` | Max health check attempts |
| `PORT` | No | `3000` | API server port |
| `LOG_LEVEL` | No | `info` | Pino log level |

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/your-org/zeroshift-engine
cd zeroshift-engine
bun install

# 2. Configure environment
cp .env.example .env
# Set DATABASE_URL and any other vars

# 3. Run database migrations
bun run prisma:migrate

# 4. Start in development mode
bun dev

# 5. Create your first project
curl -X POST http://localhost:3000/api/v1/projects \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "myapp",
    "repoUrl": "https://github.com/user/repo",
    "branch": "main",
    "appPort": 8080,
    "healthPath": "/health",
    "basePort": 4000
  }'

# 6. Deploy
curl -X POST http://localhost:3000/api/v1/deploy \
  -H 'Content-Type: application/json' \
  -d '{ "projectId": "<id from step 5>" }'
```

### Using Neon (Serverless PostgreSQL)

Set `DATABASE_URL` to your Neon connection string:

```
DATABASE_URL=postgresql://<user>:<password>@<host>/neondb?sslmode=require&channel_binding=require
```

Then run migrations normally — Prisma handles the SSL connection automatically.

---

## Deployment Status Lifecycle

```
PENDING → DEPLOYING → ACTIVE
                   ↘ FAILED
ACTIVE → ROLLED_BACK  (on next successful deploy or rollback)
```

`DEPLOYING` is the crash-safe state. If the engine restarts while a deployment is in `DEPLOYING`, reconciliation immediately marks it `FAILED` and cleans up the container.
