"use client";

import { useState } from "react";

export interface Capability {
  id: string;
  category: "Deployment" | "Networking" | "Security" | "Monitoring";
  title: string;
  command: string;
  description: string;
  details: string;
  badge: string;
}

const CAPABILITIES: Capability[] = [
  {
    id: "cap-dashboard-settings-query-completion",
    category: "Monitoring",
    title: "Settings Tab Decomposition & Dashboard Query Hooks",
    command: "useSettingsPage()  |  useSystemHealth()  |  useRecentJobs()",
    description:
      "Settings page split into seven tab components with TanStack Query hooks across Overview, Deployments, Activity, System Health, and Settings.",
    details:
      "Extracted General, Build, Network, Security, Webhooks, Updates, and Advanced settings tabs into dedicated components. Added useRecentJobs, useSystemHealth, and useSettingsPage hooks with shared query keys. Sidebar navigation fixes: Activity label, deployment route matching, and removal of broken project settings sub-nav.",
    badge: "IMPROVEMENT",
  },
  {
    id: "cap-webhook-autodeploy-rate-limits",
    category: "Security",
    title: "Webhook & Auto-Deploy Rate Limiting",
    command: "checkRateLimit()  |  POST /webhooks/:secret  |  AUTO_DEPLOY_POLL_MS",
    description:
      "In-memory sliding-window rate limiter for webhook ingress and per-project auto-deploy poll throttling.",
    details:
      "GitHub webhook routes return HTTP 429 when a secret exceeds 30 requests per minute. Background auto-deploy poller rate-limits git ls-remote checks to once per 30 seconds and deploy enqueues to once per 5 minutes per project, preventing runaway poll loops.",
    badge: "IMPROVEMENT",
  },
  {
    id: "cap-database-unlink-schema-hardening",
    category: "Deployment",
    title: "Database Unlink Env Cleanup & Schema Error Propagation",
    command: "unlinkFromProject()  |  GET /api/v1/databases/:id/schema",
    description:
      "Unlinking a managed database removes injected DATABASE_URL env keys from linked projects. Schema introspection failures surface as explicit API errors.",
    details:
      "When a managed database is unlinked from a project, the corresponding engine env var key is deleted from the project environment. Schema introspection no longer returns empty tables on container exec failure; it throws a descriptive error for the dashboard DB studio to display.",
    badge: "IMPROVEMENT",
  },
  {
    id: "cap-service-discovery-removal",
    category: "Deployment",
    title: "Service Discovery & Adoption Removal",
    command: "Removed: GET /api/system/discover-deployments  |  POST /api/projects/adopt",
    description:
      "Removed host scanning and one-click adoption endpoints. Existing adopted projects retain isAdopted metadata and PM2 local-path deploy behavior.",
    details:
      "Deleted ServiceDiscoveryService, discovery controller routes, and the Adopt Service dashboard modal. Projects previously imported via adoption keep isAdopted=true, local Git sourcing, PM2 restart logic, and webhook auto-deploy unchanged.",
    badge: "IMPROVEMENT",
  },
  {
    id: "cap-dashboard-query-layer",
    category: "Monitoring",
    title: "TanStack Query Data Layer & Project Tab Decomposition",
    command: "useProjectDetail()  |  useAllDeployments()  |  ProjectDetailOverviewTab",
    description:
      "Cached server-state hooks for project detail and deployments, plus decomposed ProjectDetail tab components for maintainability.",
    details:
      "ProjectDetail page reduced to a thin shell using useProjectDetail with 15-second refetch intervals. Overview and deployments pages share TanStack Query caches. Remaining tabs extracted into dedicated components with colocated settings form state.",
    badge: "IMPROVEMENT",
  },
  {
    id: "cap-engine-architecture-hardening",
    category: "Deployment",
    title: "Unified Deploy Pipeline & Resilient Job Recovery",
    command: "runDeployPipeline()  |  MAX_JOB_LOG_LINES=5000  |  recoverStuckJobs()",
    description:
      "Consolidated deploy orchestration service, bounded job log retention, and worker restart recovery that re-queues in-flight jobs instead of failing them.",
    details:
      "Extracted a single deploy-pipeline.service.ts shared by worker handlers, capped PostgreSQL JSONB job logs at 5000 lines, and improved recoverStuckJobs to re-queue recent RUNNING jobs on worker restart while failing only stale hung jobs.",
    badge: "IMPROVEMENT",
  },
  {
    id: "cap-autonomous-autodeploy-sync-engine",
    category: "Deployment",
    title: "Autonomous Commit Polling & Remote Git ls-remote Engine",
    command: "AUTO_DEPLOY_POLL_MS=60000  |  git ls-remote  |  POST /webhooks/:secret",
    description:
      "Autonomous background application polling daemon, remote Git ls-remote commit detection, and dual-format urlencoded/json webhook ingress with per-project throttling.",
    details:
      "Continuous background poller engine automatically queries remote repository HEAD commits via authenticated git ls-remote, eliminating stale local git log checks. Ingests GitHub default application/x-www-form-urlencoded webhook payloads and provides root /webhooks/:secret routing aliases with sliding-window rate limits.",
    badge: "NEW",
  },
  {
    id: "cap-autodeploy-relay-git-auth",
    category: "Deployment",
    title: "Relay Webhook Stream & Authenticated Git Token Deployment",
    command: "POST /api/webhooks/github/relay  |  git clone x-access-token",
    description:
      "Full rawBody preservation for cloud relay HMAC verification, authenticated GitHub App token injection for private repositories, and inline card-based project settings.",
    details:
      "Ensures unparsed payload bytes are preserved across all webhook and relay routes for flawless HMAC verification. Automatically generates and injects ephemeral GitHub App installation tokens into git clone and pull commands, allowing both adopted and dashboard-created private repositories to auto-deploy on commit without manual workflow files.",
    badge: "NEW",
  },
  {
    id: "cap-health-autodetect-validation",
    category: "Deployment",
    title: "Codebase Health Path Auto-Detection & Resilient Validation",
    command: "src/utils/health-detector.ts  |  src/services/validation.service.ts",
    description:
      "Automated source route scanning across Node, Python, and Go, paired with dual-host candidate probing and database health path auto-sync.",
    details:
      "Statically scans codebase routes (/health, /api/health, /healthz, /live, /ready, /ping, /status) during deployment. Executes resilient dual-host validation probes testing IPv4 127.0.0.1 alongside localhost and candidate endpoints, automatically updating the project database configuration when active health routes are resolved.",
    badge: "NEW",
  },
  {
    id: "cap-universal-github-autodeploy-webhooks",
    category: "Deployment",
    title: "Universal GitHub Push Auto-Deploy & Webhook Relay",
    command: "POST /api/github/app/relay-webhook  |  POST /api/webhooks/:secret",
    description:
      "Universal GitHub repo URL normalization, multi-payload push dispatching, branch fallback routing, and in-dashboard Webhook & Auto-Deploy management.",
    details:
      "Normalizes SSH, HTTPS, git+ssh, git://, and owner/repo short forms for infallible webhook and GitHub App relay push dispatching. Features multi-environment branch fallback routing, monorepo Git root resolution, and an in-dashboard Git Webhook management card with one-click commit synchronization.",
    badge: "NEW",
  },
  {
    id: "cap-launch-video-showcase",
    category: "Monitoring",
    title: "Interactive Launch Video & Brag Showcase",
    command: "npx skills add https://github.com/latent-spaces/brag --skill brag  |  /brag",
    description:
      "Interactive technical video showcase player on landing page paired with automated Hyperframes release video generation.",
    details:
      "Integrated product launch teaser player with audio mute/unmute, timeline scrubbing, and sub-second chapter cues. Supported by the local /brag skill pipeline to render high-energy 20s launch videos directly from codebase updates.",
    badge: "NEW",
  },
  {
    id: "cap-system-status-autodeploy",
    category: "Monitoring",
    title: "System Status & Commit Auto-Deploy Validator",
    command: "GET /api/v1/system/status-overview  |  POST /api/v1/system/check-autodeploy",
    description:
      "Comprehensive functions & subsystems status monitoring, real-time application health probes, and commit-driven auto-deployment synchronization checker.",
    details:
      "Dedicated Status control plane monitoring Fastify API engine, PostgreSQL 16, Redis broker, background workers, Docker daemon, PM2 supervisor, Nginx reverse proxy, and GitHub relays. Continuously verifies deployed commit SHAs against repository HEAD across all projects with one-click multi-project auto-sync.",
    badge: "NEW",
  },
  {
    id: "cap-pm2-autodeploy-commits",
    category: "Deployment",
    title: "Adopted PM2 Auto-Deployments & Commit Restarts",
    command: "POST /api/webhooks/:secret  |  POST /api/v1/projects",
    description:
      "Seamless commit-triggered auto-deployments, SSH Git remote normalization, and intelligent PM2 process restarts for adopted host services.",
    details:
      "Normalizes GitHub SSH remotes to HTTPS, tracks local commit histories, injects node_modules/.bin into process PATH, and detects ecosystem configuration files for zero-friction PM2 rollouts on existing adopted projects.",
    badge: "NEW",
  },
  {
    id: "cap-deployment-logs-ui",
    category: "Monitoring",
    title: "Vercel-Style Deployment & Commit Logs",
    command: "GET /api/v1/deployments  |  GET /api/v1/projects/:id/commits",
    description:
      "Global and per-project deployment feeds with commit metadata, status filters, environment badges, and commit-centric deployment history.",
    details:
      "Dashboard deployments page lists all projects with production/preview labels, commit SHA, branch, author, and duration. Project workspaces expose Deployments and Commits tabs with shared filters and live log drill-down.",
    badge: "NEW",
  },
  {
    id: "cap-db-studio",
    category: "Deployment",
    title: "UI Database Studio & Query Console",
    command: "GET /api/v1/databases/:id/schema  |  POST /api/v1/databases/:id/query",
    description:
      "Interactive in-dashboard database studio for inspecting schemas, exploring tables, and executing SQL / command queries against managed containers.",
    details:
      "Inspect live tables, run custom SQL / Redis / Mongo queries with real-time execution telemetry, view tabular records, and export results directly to JSON or CSV.",
    badge: "NEW",
  },
  {
    id: "cap-fullpage-project-wizard",
    category: "Deployment",
    title: "Full-Page Project & PM2 Creation Suite",
    command: "POST /api/v1/projects  |  /projects/new",
    description:
      "Dedicated full-page project setup experience supporting Docker containerization and bare-metal PM2 process supervision.",
    details:
      "Ample workspace for repository selection, automatic stack detection, custom package managers (Bun, pnpm, uv, Poetry, Cargo, Composer), build/start script overrides, and encrypted environment variables.",
    badge: "NEW",
  },
  {
    id: "cap-vercel-command-ui",
    category: "Monitoring",
    title: "Vercel & shadcn UI with Command Palette",
    command: "Cmd+K / Ctrl+K  |  Tabbed Project Navigation",
    description:
      "Precision-crafted developer interface with grouped Command Palette search, tabbed project workspaces, and live deployment previews.",
    details:
      "Transforms the dashboard with authentic Vercel/shadcn styling: global Cmd+K command bar for instant project and navigation jumping, dedicated project tabs (Overview, Deployments, Domains, Logs, Settings), and high-contrast telemetry cards.",
    badge: "NEW",
  },
  {
    id: "cap-dns-verification",
    category: "Networking",
    title: "DNS Preflight Verification & Setup",
    command: "POST /api/v1/projects/:id/domains/:domainId/verify-dns",
    description:
      "Preflight DNS propagation validation with expected server IPv4 checking before invoking Let's Encrypt TLS issuance.",
    details:
      "Performs direct DNS A and CNAME record lookups against expected server IPv4 addresses before executing Certbot, protecting production domains from Let's Encrypt rate-limit lockouts.",
    badge: "NEW",
  },
  {
    id: "cap-runtime-logs-env",
    category: "Monitoring",
    title: "Live Runtime Container Logs & Raw DotEnv",
    command: "GET /api/v1/projects/:id/logs  |  GET /api/v1/databases/:id/logs",
    description:
      "Inspect stdout/stderr container logs for apps and managed databases, edit multi-line .env bulk files, and mask secrets.",
    details:
      "Real-time container stdout/stderr log viewer with auto-scroll and filtering, paired with dual-mode raw .env editing and sensitive value masking for project and stage environments.",
    badge: "NEW",
  },
  {
    id: "cap-minimalist-ui",
    category: "Monitoring",
    title: "Minimalist Vercel-Grade Interface",
    command: "GET /api/v1/self-update/check",
    description:
      "High-density monospace badges, clean hairline borders, update refresh requirement notices, and zero decorative icon bloat.",
    details:
      "Precision-tuned interface inspired by Vercel and hyper-focused developer tooling. Explicit reload prompts ensure new client assets apply seamlessly post-update, and status indicators display as pure monospace text badges.",
    badge: "NEW",
  },
  {
    id: "cap-managed-databases",
    category: "Deployment",
    title: "Server Database Provisioning & Linking",
    command: 'POST /api/v1/databases/:id/link  {"projectId":"...","envKey":"DATABASE_URL"}',
    description:
      "Provision dedicated PostgreSQL, Redis, MySQL, or MongoDB containers on the server with 1-click project linking anytime post-creation.",
    details:
      "One-click server database provisioning with persistent Docker volumes, encrypted credentials at rest, conflict-free port allocation, and flexible post-creation project linking/unlinking directly from the database console or project settings.",
    badge: "NEW",
  },
  {
    id: "cap-custom-pms-pm2",
    category: "Deployment",
    title: "Custom PMs & Host PM2 Engine",
    command: 'POST /api/v1/projects  {"deploymentType":"pm2|docker","packageManager":"bun|pnpm|yarn|npm|uv|poetry|cargo|composer"}',
    description:
      "Deploy apps via Docker or bare-metal host PM2 with automatic support for bun, pnpm, yarn, npm, uv, poetry, pipenv, cargo, and composer.",
    details:
      "Engineers can choose between Docker containerization or direct host PM2 execution per project, customize install, build, and start commands, and let VersionGate auto-detect Rust (Cargo), Python (uv/poetry/pipenv), and PHP (Composer) workflows.",
    badge: "NEW",
  },
  {
    id: "cap-singlecontainer",
    category: "Deployment",
    title: "Single-Container Deploys",
    command: 'POST /api/v1/deploy  {"projectId":"...","environmentId":"..."}',
    description:
      "One build context, one Dockerfile, one running container per project environment on a BLUE/GREEN port pair.",
    details:
      "No docker-compose or multi-service stacks. deploy.handler builds a single image (versiongate-{project}:{timestamp}), runs it on basePort or basePort+1, and retires the previous slot after activation.",
    badge: "Core Engine",
  },
  {
    id: "cap-bluegreen",
    category: "Deployment",
    title: "Blue-Green Slot Deployment",
    command: 'POST /api/v1/deploy  {"projectId":"...","environmentId":"..."}',
    description:
      "Deploy to the idle BLUE or GREEN host port, health-check the new container, then reload Nginx upstream for production.",
    details:
      "Color alternates from the active deployment record. TrafficService.switchTrafficTo() writes upstream config and runs nginx -s reload. Nginx switch is skipped when environment name is not production (DEFAULT_ENVIRONMENT_NAME).",
    badge: "Core Engine",
  },
  {
    id: "cap-warmswap",
    category: "Deployment",
    title: "Warm-Swap Rollback",
    command: "POST /api/v1/projects/:id/rollback",
    description:
      "Restores the previous deployment record by re-running its Docker image tag when the image exists locally.",
    details:
      "rollback.handler calls imageExists(previous.imageTag). When cached, it skips git clone and docker build, runs the previous container, validates health, then switchTrafficTo(previous.port). Requires a prior successful deployment record.",
    badge: "Engine",
  },
  {
    id: "cap-static-html",
    category: "Deployment",
    title: "Static HTML & SPA Sites",
    command: 'POST /api/v1/deploy  {"projectId":"...","environmentId":"..."}',
    description:
      "Automated Nginx containerization for plain HTML repositories and single-page apps with zero build configuration.",
    details:
      "Detects index.html or index.htm at repo root or build context. Auto-generates an Nginx 1.25 container with dedicated /health endpoints, clean URL extension matching ($uri.html), and SPA fallback routing.",
    badge: "Core Engine",
  },
  {
    id: "cap-autostack",
    category: "Deployment",
    title: "Automatic Stack Recognition",
    command: "GET /api/v1/github/repos/detect?owner=...&repo=...",
    description:
      "Inspects repository manifests to automatically identify frameworks, application ports, health probe paths, and build context subdirectories.",
    details:
      "Pre-scans repositories for Next.js, Vite, Nuxt, Remix, Astro, SvelteKit, FastAPI, Flask, Django, Go, Rust, and Static HTML. Auto-populates container ports and health check routes in the project setup flow.",
    badge: "NEW",
  },
  {
    id: "cap-projectsettings",
    category: "Deployment",
    title: "Project Configuration Editor",
    command: "PATCH /api/v1/projects/:id  {\"branch\":\"...\",\"buildContext\":\"...\",\"env\":{...}}",
    description:
      "Edit Git repository URL, default target branch, Docker build context, app port, and root environment variables dynamically.",
    details:
      "Validates repo URL accessibility and branch syntax before updating database records. Synchronizes root environment variables securely with AES-GCM encryption.",
    badge: "NEW",
  },
  {
    id: "cap-analytics",
    category: "Monitoring",
    title: "Per-Project Telemetry & Hit Tracking",
    command: "GET /api/v1/projects/:id/analytics",
    description:
      "Real-time rolling 24-hour hit aggregation, average latency, and HTTP status code distribution (2xx, 3xx, 4xx, 5xx).",
    details:
      "Proxy telemetry hooks record downstream response times and status buckets into sliding Redis window counters with in-memory fallback, rendered in dashboard telemetry cards.",
    badge: "NEW",
  },
  {
    id: "cap-globaldeployments",
    category: "Monitoring",
    title: "Cross-Project Deployment Feed",
    command: "GET /api/v1/deployments",
    description:
      "Global unified deployment feed across all registered projects with direct log inspection and instant stage preview links.",
    details:
      "Centralized activity console displays status, target environments, assigned container ports, and execution logs across your entire infrastructure.",
    badge: "NEW",
  },
  {
    id: "cap-github-mgmt",
    category: "Security",
    title: "GitHub App Installation Management",
    command: "DELETE /api/v1/github/installation/:installationId",
    description:
      "Disconnect or remove GitHub App installations directly from the dashboard integrations console.",
    details:
      "Allows clean unlinking of obsolete GitHub organizations, automated webhook cleanup, and re-authentication with fresh repository permissions.",
    badge: "NEW",
  },
  {
    id: "cap-projectdomain",
    category: "Networking",
    title: "Project Custom Domains",
    command: 'POST /api/v1/projects/:id/domains  {"hostname":"app.example.com"}',
    description:
      "Attach a production hostname per project. VersionGate writes isolated nginx upstream and server files, then Certbot can issue TLS without touching the dashboard vhost.",
    details:
      "vg-app-{project}.upstream.conf rewrites on blue/green switch. vg-app-{project}-{hostname}.conf stays Certbot-owned. No ACTIVE deploy points upstream at 127.0.0.1:9 down until the first healthy production slot is live.",
    badge: "NEW",
  },
  {
    id: "cap-domaindiag",
    category: "Networking",
    title: "Public Domain Diagnosis",
    command: "dig +short $PUBLIC_DOMAIN A @8.8.8.8",
    description:
      "When the dashboard says working but the hostname does not open, test loopback, Host header, TLS, then client DNS separately from the VPS resolver.",
    details:
      "Preflight DNS and PM2 only prove the engine on this host. Hairpin NAT makes curl to the public IP hang on Proxmox/NAT VPS. install.sh, Settings (NGINX_CONFIG_PATH=/etc/nginx/conf.d/upstream.conf), and certbot write three competing vhosts. Apps stay on /p/:project/:env — not a second hostname.",
    badge: "Ops",
  },
  {
    id: "cap-stageproxy",
    category: "Networking",
    title: "Stage Path Reverse Proxy",
    command: "GET /p/:projectName/:envName/*",
    description:
      "Routes /p/{project}/{environment}/... to the active container port via Fastify proxy handlers.",
    details:
      "ProxyService.resolveTarget() looks up the ACTIVE deployment port. HTML responses rewrite asset paths for Next.js, Vite, and /static/ prefixes. Separate from the Nginx upstream used for production traffic.",
    badge: "Engine",
  },
  {
    id: "cap-bearerauth",
    category: "Security",
    title: "Bearer API Access Tokens",
    command: "POST /api/v1/auth/tokens  {\"name\":\"CI deploy\"}",
    description:
      "Issues vg_live_... tokens; stores SHA-256 hash in PostgreSQL for Authorization: Bearer on API routes.",
    details:
      "createApiToken() in auth.service.ts returns the raw token once. requireApiAuth middleware accepts session cookies or Bearer tokens via getUserFromApiToken().",
    badge: "Engine",
  },
  {
    id: "cap-passwordreset",
    category: "Security",
    title: "Password Reset Scripts",
    command: "bun run reset-password admin@example.com 'NewPass123!'",
    description:
      "Host CLI scripts and dashboard password change for administrator credentials.",
    details:
      "scripts/reset-password.ts and scripts/create-admin.ts (--reset) update scrypt-hashed passwords in PostgreSQL. Logged-in users can POST /api/v1/auth/password from the dashboard.",
    badge: "Host / Dashboard",
  },
  {
    id: "cap-autohealing",
    category: "Monitoring",
    title: "Job Worker & Deploy Locks",
    command: "IN_PROCESS_WORKER=true  (default in Docker)",
    description:
      "PostgreSQL job queue with SKIP LOCKED claims; optional in-process worker or separate PM2 worker.",
    details:
      "claimNextJob() uses FOR UPDATE SKIP LOCKED. acquireDeployLock() uses Redis (when available) plus a PostgreSQL lockedAt row. worker/in-process.ts polls when IN_PROCESS_WORKER=true.",
    badge: "Engine",
  },
  {
    id: "cap-healthmonitor",
    category: "Monitoring",
    title: "Background Health Monitor",
    command: "GET /api/v1/system/engine-health",
    description:
      "30-second interval audit of database latency, Redis availability, container inspect state, and host CPU/RAM/disk.",
    details:
      "EngineHealthMonitorService.tick() in engine-monitor.service.ts. Returns status ok | degraded | error with alert list. Started from server.ts on boot.",
    badge: "Engine",
  },
  {
    id: "cap-envoverrides",
    category: "Security",
    title: "Per-Environment Variable Overrides",
    command: "PATCH /api/v1/projects/:id/environments/:envId",
    description:
      "Stage-specific env vars merged over project-level defaults at container start.",
    details:
      "deploy.handler merges decryptProjectEnv(project.env) with decryptProjectEnv(environment.env) before runContainer(). Stage keys override project keys with the same name.",
    badge: "Engine",
  },
  {
    id: "cap-githubrelay",
    category: "Security",
    title: "GitHub App & Central Relay",
    command: "POST /api/webhooks/github  (GitHub App)",
    description:
      "GitHub App webhooks verified with X-Hub-Signature-256; optional versiongate.tech relay with X-VG-Relay-Signature.",
    details:
      "github-app.controller.ts verifies HMAC on /api/webhooks/github and relay hop on /api/webhooks/github/relay. Per-project webhooks use POST /api/v1/webhooks/:secret (secret in URL, no HMAC).",
    badge: "Engine",
  },
  {
    id: "cap-multibranch",
    category: "Deployment",
    title: "Branch-Matched Webhook Deploys",
    command: "POST /api/v1/webhooks/:secret  (push event)",
    description:
      "Git push enqueues DEPLOY jobs for each environment whose branch matches the pushed ref.",
    details:
      "webhook.controller.ts parses refs/heads/{branch} and filters environments by branch. Does not deploy every stage unless each stage's branch matches the push. Ignores non-push GitHub events.",
    badge: "Engine",
  },
  {
    id: "cap-dockerfile",
    category: "Deployment",
    title: "Auto Dockerfile Generation",
    command: "ensureDockerfile()  (on each deploy)",
    description:
      "Generates a Dockerfile when none exists; respects user-provided Dockerfiles without the auto-generated marker.",
    details:
      "Detection order per directory: package.json (Node — npm/yarn/pnpm/bun via lockfiles), requirements.txt (Python), go.mod (Go), index.html (static nginx). Scans build context, repo root, then immediate subdirs; first match wins.",
    badge: "Engine",
  },
  {
    id: "cap-asyncupdate",
    category: "Deployment",
    title: "Engine Self-Update",
    command: "POST /api/v1/settings/self-update/apply",
    description:
      "Background git pull, bun install, Drizzle schema sync, and dashboard build with progress polling.",
    details:
      "self-update.service.ts runs steps asynchronously. GET /api/v1/system/update/progress streams status. PM2 reload via ecosystem.config.cjs when complete.",
    badge: "Engine",
  },
  {
    id: "cap-certbotauto",
    category: "Security",
    title: "Certbot TLS from Settings",
    command: "POST /api/v1/settings/ssl/certbot  {\"domain\":\"...\"}",
    description:
      "Host installer includes certbot packages; dashboard triggers certbot --nginx with resolved binary path.",
    details:
      "certbot-path.ts checks /usr/bin/certbot, /snap/bin/certbot, and other paths. settings.controller postCertbotSslHandler falls back to sudo -n when needed.",
    badge: "Host / Dashboard",
  },
  {
    id: "cap-github-diagnostics",
    category: "Monitoring",
    title: "GitHub Integration Diagnostic Checkpoints",
    command: "GET /api/github/test-connection",
    description:
      "Four-stage real-time connection probe validating database records, secrets, relay reachability, and GitHub API repository access.",
    details:
      "Runs automated diagnostic checks across PostgreSQL installation records, engine state HMAC secret configuration, central cloud relay network latency (versiongate.tech), and Octokit token repository access with instant troubleshooting advice.",
    badge: "Dashboard / Engine",
  },
  {
    id: "cap-port-exclusion",
    category: "Networking",
    title: "Reserved Port Exclusion & Conflict Avoidance",
    command: "EXCLUDED_PORTS=80,443,3000,5173,5432,6379,9090",
    description:
      "Automated port exclusion lists and live TCP socket probes preventing deployment collisions with existing server services.",
    details:
      "Operators can specify individual ports and port ranges in settings or .env. When allocating Blue/Green slots across production, staging, and development, VersionGate verifies all 6 required ports against exclusion lists and active host listeners before binding.",
    badge: "Engine / Settings",
  },
];

export function CapabilityGrid() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeModalCap, setActiveModalCap] = useState<Capability | null>(null);

  const categories = ["All", "Deployment", "Networking", "Security", "Monitoring"];

  const filtered =
    selectedCategory === "All"
      ? CAPABILITIES
      : CAPABILITIES.filter((c) => c.category === selectedCategory);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        <span className="mr-2 font-mono text-xs text-white/40">Filter:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 font-mono text-xs uppercase tracking-[0.12em] transition ${
              selectedCategory === cat
                ? "bg-[#3effa8] font-semibold text-black"
                : "border border-white/15 text-white/55 hover:border-white/30 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((cap) => (
          <div
            key={cap.id}
            className="group relative flex flex-col justify-between border border-white/10 bg-black p-6 transition-all duration-200 hover:border-[#3effa8]/45"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="border border-white/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">
                  {cap.category}
                </span>
                <span className="border border-[#3effa8]/35 bg-[#3effa8]/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3effa8]">
                  {cap.badge}
                </span>
              </div>

              <h3 className="font-display text-sm font-semibold uppercase tracking-[-0.02em] text-white">
                {cap.title}
              </h3>

              <p className="text-xs leading-relaxed text-white/50">{cap.description}</p>

              <div className="relative mt-3 overflow-x-auto border border-white/10 bg-white/[0.03] p-3 font-mono text-xs text-white/80">
                <code>{cap.command}</code>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-3 font-mono text-[11px]">
              <button
                onClick={() => handleCopy(cap.id, cap.command)}
                className="text-white/45 transition hover:text-white"
              >
                {copiedId === cap.id ? "[ Copied ]" : "[ Copy ]"}
              </button>
              <button
                onClick={() => setActiveModalCap(cap)}
                className="font-semibold text-[#3effa8] hover:underline"
              >
                [ Details ]
              </button>
            </div>
          </div>
        ))}
      </div>

      {activeModalCap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg space-y-4 border border-white/15 bg-black p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-semibold uppercase tracking-[-0.02em] text-white">
                  {activeModalCap.title}
                </span>
                <span className="border border-white/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">
                  {activeModalCap.category}
                </span>
              </div>
              <button
                onClick={() => setActiveModalCap(null)}
                className="font-mono text-xs text-white/45 hover:text-white"
              >
                [ Close ]
              </button>
            </div>

            <p className="text-xs leading-relaxed text-white/55">{activeModalCap.details}</p>

            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                API / script reference
              </span>
              <div className="border border-white/10 bg-white/[0.03] p-3 font-mono text-xs text-white/80">
                {activeModalCap.command}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  handleCopy(activeModalCap.id, activeModalCap.command);
                  setActiveModalCap(null);
                }}
                className="bg-[#3effa8] px-4 py-2 text-xs font-semibold text-black transition hover:brightness-110"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
