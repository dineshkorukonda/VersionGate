import { ChangelogTimeline, type ChangelogRelease } from "@/components/changelog-timeline";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const revalidate = 3600; // Revalidate dynamic releases every 1 hour (ISR)

export const metadata = {
  title: "Changelog // VersionGate",
  description: "Recent product updates, new features, and infrastructure improvements released in VersionGate.",
};

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  html_url: string;
  prerelease: boolean;
}

interface ReleaseItem {
  title: string;
  description: string;
  command?: string;
  prLink?: string;
  prNumber?: number;
}

interface ReleaseCategory {
  title: string;
  badge: "NEW" | "IMPROVEMENT" | "FIX";
  items: ReleaseItem[];
}

const FALLBACK_RELEASES: ChangelogRelease[] = [
  {
    version: "v3.6.0",
    date: "September 21, 2026",
    isLatest: true,
    summary:
      "Phases 6-9 milestone: dashboard Settings tab decomposition with TanStack Query hooks, webhook and auto-deploy rate limiting, database unlink env cleanup, service discovery removal, and expanded unit tests.",
    categories: [
      {
        title: "Dashboard Query Layer Completion",
        badge: "IMPROVEMENT",
        items: [
          {
            title: "Settings Page Tab Decomposition",
            description:
              "Split Settings into seven dedicated tab components (General, Build, Network, Security, Webhooks, Updates, Advanced) with a thin page shell and useSettingsPage hook.",
            command: "useSettingsPage()  |  SettingsGeneralTab",
          },
          {
            title: "TanStack Query Hooks for Overview, Activity, Deployments, and System Health",
            description:
              "Added useRecentJobs and useSystemHealth hooks. Migrated Overview, Deployments, Activity, and System Health pages to cached server-state with automatic refetch intervals.",
            command: "useRecentJobs()  |  useSystemHealth()",
          },
          {
            title: "Sidebar Navigation Fixes",
            description:
              "Renamed Logs to Activity, fixed deployment route active state for /projects/:id/deploy/, and removed broken project settings sub-navigation.",
          },
        ],
      },
      {
        title: "Rate Limiting & UX",
        badge: "IMPROVEMENT",
        items: [
          {
            title: "Webhook Ingress Rate Limiting",
            description:
              "GitHub webhook routes return HTTP 429 when a secret exceeds 30 requests per minute using an in-memory sliding-window limiter.",
            command: "checkRateLimit('webhook:{secret}', 30, 60000)",
          },
          {
            title: "Auto-Deploy Poll Throttling",
            description:
              "Background poller rate-limits git ls-remote checks to once per 30 seconds and deploy enqueues to once per 5 minutes per project.",
          },
          {
            title: "Landing Page Copy Cleanup",
            description:
              "Removed references to deleted discovery/adoption endpoints from FAQ, bento features, and PaaS comparison sections.",
          },
        ],
      },
      {
        title: "Database Improvements",
        badge: "IMPROVEMENT",
        items: [
          {
            title: "Unlink Removes Injected Env Keys",
            description:
              "unlinkFromProject deletes the linked engine env var key (DATABASE_URL) from the project environment when a managed database is unlinked.",
            command: "DELETE env.DATABASE_URL on unlink",
          },
          {
            title: "Schema Introspection Error Propagation",
            description:
              "getDatabaseSchema throws explicit errors on container exec failure instead of returning empty table lists.",
          },
        ],
      },
      {
        title: "Service Discovery Removal",
        badge: "IMPROVEMENT",
        items: [
          {
            title: "Removed Host Scanning and Adoption API",
            description:
              "Deleted GET /api/system/discover-deployments and POST /api/projects/adopt endpoints, the ServiceDiscoveryService backend module, and the Adopt Service dashboard modal.",
            command: "Removed: GET /api/system/discover-deployments  |  POST /api/projects/adopt",
          },
          {
            title: "Preserved Existing Adopted Project Support",
            description:
              "Projects created via the former adoption flow keep isAdopted=true, localPath Git sourcing, PM2 restart logic, and webhook auto-deploy behavior unchanged.",
          },
        ],
      },
      {
        title: "Test Coverage",
        badge: "IMPROVEMENT",
        items: [
          {
            title: "Rate Limiter and Database Provisioning Tests",
            description:
              "Added unit tests for sliding-window rate limiting, database unlink env cleanup, and schema introspection failure handling.",
          },
        ],
      },
    ],
  },
  {
    version: "v3.5.0",
    date: "September 21, 2026",
    isLatest: false,
    summary:
      "Dashboard Phase 5: ProjectDetail tab decomposition, TanStack Query hooks for project detail and deployments, and initial dashboard unit tests.",
    categories: [
      {
        title: "Project Detail Tab Decomposition",
        badge: "IMPROVEMENT",
        items: [
          {
            title: "Extracted Overview, Deployments, Observability, and Settings Tabs",
            description:
              "Moved remaining ProjectDetail tab panels into dedicated components with colocated settings form state, reducing the page shell to under 350 lines.",
          },
        ],
      },
      {
        title: "TanStack Query Expansion",
        badge: "IMPROVEMENT",
        items: [
          {
            title: "useProjectDetail and useAllDeployments Hooks",
            description:
              "Centralized project detail fetching with shared query keys, automatic 15-second refetch, and invalidation after mutations.",
            command: "useProjectDetail(projectId)",
          },
        ],
      },
      {
        title: "Dashboard Unit Tests",
        badge: "NEW",
        items: [
          {
            title: "Route Resolution and API Client Tests",
            description:
              "Added Bun unit tests for projectTabFromPath routing and ApiError parsing under tests/dashboard/.",
          },
        ],
      },
    ],
  },
  {
    version: "v3.4.0",
    date: "September 21, 2026",
    isLatest: false,
    summary:
      "Phased technical debt remediation: unified deploy pipeline service, resilient job recovery, modular dashboard API client, TanStack Query data layer, and landing page capability grid sync.",
    categories: [
      {
        title: "Engine Architecture Hardening",
        badge: "IMPROVEMENT",
        items: [
          {
            title: "Unified Deploy Pipeline Service",
            description:
              "Consolidated duplicate deploy logic from DeploymentService and worker handlers into deploy-pipeline.service.ts with health checks, commit metadata, and monorepo build context resolution.",
            command: "src/services/deploy-pipeline.service.ts",
          },
          {
            title: "Bounded Job Log Retention",
            description:
              "Job log appends now retain only the most recent 5000 lines in PostgreSQL JSONB arrays, preventing unbounded row growth on long deploy pipelines.",
            command: "MAX_JOB_LOG_LINES=5000",
          },
          {
            title: "Resilient Stuck Job Recovery",
            description:
              "Worker restart recovery re-queues recent RUNNING jobs to PENDING instead of marking them failed, while stale jobs exceeding the runtime threshold are stopped safely.",
          },
          {
            title: "Service Layer Cleanup",
            description:
              "Moved systemMetrics singleton into system-metrics.service.ts, deduplicated in-process worker boot, and consolidated webhook route registration into a shared helper.",
          },
        ],
      },
      {
        title: "Dashboard Developer Experience",
        badge: "IMPROVEMENT",
        items: [
          {
            title: "Modular API Client",
            description:
              "Split the monolithic dashboard api.ts into domain modules (projects, deployments, auth, settings, system, github, databases, cron) with backward-compatible re-exports.",
          },
          {
            title: "TanStack Query Integration",
            description:
              "Added QueryClientProvider and useProjectsSummary hook as the foundation for cached, deduplicated server state across dashboard pages.",
          },
          {
            title: "Component Decomposition",
            description:
              "Extracted ProjectDetail tab panels and Settings security cards into dedicated components, reducing page file complexity.",
          },
          {
            title: "Integrations Route Normalization",
            description:
              "Standardized integrations navigation to /integrations with a legacy redirect from /dashboard/integrations.",
          },
        ],
      },
    ],
  },
  {
    version: "v3.3.0",
    date: "September 20, 2026",
    isLatest: false,
    summary:
      "Autonomous background application auto-deploy poller daemon, remote Git ls-remote commit detection eliminating local cache staleness, dual-format GitHub webhook payload ingress, and automatic Git remote URL detection on service adoption.",
    categories: [
      {
        title: "Autonomous Commit Polling & Remote Git Sync",
        badge: "NEW",
        items: [
          {
            title: "Autonomous Application Auto-Deploy Poller Daemon",
            description:
              "Engineered an autonomous background polling service (AUTO_DEPLOY_POLL_MS) running on an active heartbeat to continuously monitor managed projects, detect upstream branch changes, and trigger zero-downtime blue/green deployments without requiring inbound public webhooks.",
            command: "AUTO_DEPLOY_POLL_MS=60000",
          },
          {
            title: "Remote Git ls-remote Commit Resolution",
            description:
              "Enhanced GitService with authenticated git ls-remote resolution using ephemeral installation tokens, accurately identifying upstream repository HEAD commits in milliseconds and fixing false-positive 'already in sync' reports.",
            command: "git ls-remote <authUrl> refs/heads/<branch>",
          },
          {
            title: "Dual-Format Webhook Parsing & Root Routing Aliases",
            description:
              "Added automatic support for GitHub default application/x-www-form-urlencoded push payloads alongside application/json, and registered root /webhooks/:secret aliases for universal webhook receiver compatibility.",
            command: "POST /webhooks/:secret  |  POST /api/webhooks/:secret",
          },
          {
            title: "Adopted Service Git Remote Ingestion & Baseline Tracking",
            description:
              "Automatically queries host repository remotes (git config --get remote.origin.url) during service adoption to link canonical GitHub URLs, while establishing baseline commit SHAs on initial deployment records for immediate synchronization tracking.",
          },
        ],
      },
    ],
  },
  {
    version: "v3.2.0",
    date: "September 19, 2026",
    isLatest: false,
    summary:
      "Full cloud relay webhook rawBody preservation for cryptographic HMAC validation, automated GitHub App token injection for private repository git operations, and rich inline card-based project settings replacing modal dialogs.",
    categories: [
      {
        title: "Automated Deployments & Webhook Stream",
        badge: "NEW",
        items: [
          {
            title: "Relay Webhook Raw Body Pre-Parsing",
            description:
              "Updated server preParsing hooks to preserve unparsed payload bytes across all /api/webhooks routes, enabling flawless HMAC-SHA256 signature verification on relayed push events.",
            command: "POST /api/webhooks/github/relay",
          },
          {
            title: "Authenticated Git Token Injection",
            description:
              "Integrated automatic GitHub App installation access token resolution into GitService clone and pull routines, enabling private repository auto-deployments without plaintext credentials in logs.",
            command: "git clone --branch <branch> https://x-access-token:***@github.com/...",
          },
        ],
      },
      {
        title: "Dashboard & Settings UX",
        badge: "IMPROVEMENT",
        items: [
          {
            title: "Inline Project Settings & Build Configuration Cards",
            description:
              "Converted modal-based project configuration editing into native inline cards with direct save actions for Build & Output Settings, Root Directory Paths, Container Runtime Ports, and Git Tracking.",
          },
        ],
      },
    ],
  },
  {
    version: "v3.1.0",
    date: "September 19, 2026",
    isLatest: false,
    summary:
      "Universal GitHub repository URL normalization, multi-payload push auto-deployment dispatching, branch fallback routing, in-dashboard Git Webhook management, deep monorepo build context resolution, and multi-candidate PM2 log streaming.",
    categories: [
      {
        title: "Automated Deployments & Webhooks",
        badge: "NEW",
        items: [
          {
            title: "Universal GitHub Repo Normalizer & Multi-Payload Dispatching",
            description:
              "Normalizes SSH, HTTPS, git+ssh, git://, and owner/repo short forms for robust GitHub App relay and direct webhook push handling, extracting repository targets across all payload variants.",
            command: "POST /api/github/app/relay-webhook  |  POST /api/webhooks/:secret",
          },
          {
            title: "Multi-Environment Branch Matching & Fallback Routing",
            description:
              "Matches pushed branches against environment-level branch configurations and falls back automatically to project branch and production environment when branches are unassigned.",
            command: "src/controllers/github-app.controller.ts",
          },
          {
            title: "In-Dashboard Git Webhooks & Instant Commit Sync Card",
            description:
              "Added dedicated Git Webhooks & Automated Deployments card in Project Settings displaying the unique webhook URL, copy actions, GitHub configuration tips, and one-click commit synchronization.",
            command: "dashboard/src/pages/ProjectDetail.tsx",
          },
        ],
      },
      {
        title: "Deployment Engine & Monorepos",
        badge: "IMPROVEMENT",
        items: [
          {
            title: "Hierarchical Git Discovery & Subpath Resolution",
            description:
              "Host service discovery traverses directory parents to locate repository root and automatically detects relative buildContext for nested monorepo packages during service adoption.",
            command: "POST /api/projects/adopt",
          },
          {
            title: "Deep Monorepo Subfolder Manifest Matcher",
            description:
              "Scans directory hierarchies up to 3 levels deep to find application manifests (package.json, Dockerfile, requirements.txt) and matches folder names against project identifier tokens, prioritizing sub-packages over root workspace manifests.",
            command: "src/services/git.service.ts",
          },
          {
            title: "Safe Dependency Installation & Fallback",
            description:
              "Protects PM2 pipeline against missing package.json errors by inspecting parent directories for workspace manifests, falling back to root installs, and syncing from local path when remote Git pulls are restricted.",
            command: "src/utils/pm2.ts",
          },
          {
            title: "Codebase Health Path Auto-Detection & Resilient Validation Probes",
            description:
              "Scans source files across Node, Python, and Go for declared routes (/health, /api/health, /ping, /status) and runs resilient dual-host validation probes over 127.0.0.1 and localhost, auto-updating project database configuration when working endpoints respond.",
            command: "src/utils/health-detector.ts  |  src/services/validation.service.ts",
          },
        ],
      },
      {
        title: "Observability & Process Logging",
        badge: "NEW",
        items: [
          {
            title: "Multi-Candidate Real-Time PM2 Log Streaming",
            description:
              "Enhanced PM2 log retriever to inspect pm2 jlist log paths and physical disk log files across multiple candidate process names, ensuring runtime logs for adopted services are immediately streamable from the dashboard.",
            command: "GET /api/v1/projects/:id/logs",
          },
        ],
      },
    ],
  },
  {
    version: "v3.0.0",
    date: "September 19, 2026",
    isLatest: false,
    summary:
      "Interactive Launch Video Showcase component on website landing page, automated codebase-to-video release workflow with /brag and Hyperframes, and custom technical video player controls.",
    categories: [
      {
        title: "Landing Page & Marketing Media",
        badge: "NEW",
        items: [
          {
            title: "Interactive Technical Launch Video Showcase",
            description:
              "Engineered a dedicated Launch Video showcase on the VersionGate website landing page with custom video playback controls, audio mute/unmute toggle, timeline scrubber, and technical feature callout chips.",
            command: "website/src/components/landing/launch-video-section.tsx",
            prNumber: 248,
          },
          {
            title: "Automated Codebase Release Video Pipeline (/brag)",
            description:
              "Configured local /brag skill integration powered by Hyperframes to enable instant generation of 20-second product launch and milestone teaser videos directly from repository code.",
            command: "npx skills add https://github.com/latent-spaces/brag --skill brag",
            prNumber: 248,
          },
        ],
      },
    ],
  },
  {
    version: "v2.9.9",
    date: "September 18, 2026",
    isLatest: false,
    summary:
      "Comprehensive Subsystems & Applications Status page, commit-driven auto-deployment synchronization checker, non-empty Git clone destination cleanup, and production NODE_ENV environment handling for PM2 builds.",
    categories: [
      {
        title: "System Functions & Applications Status",
        badge: "NEW",
        items: [
          {
            title: "Comprehensive Subsystem & Functions Status Page",
            description:
              "Introduced dedicated Status control plane at /status monitoring Fastify API engine, PostgreSQL 16, Redis broker, background job worker, Docker daemon, PM2 supervisor, Nginx reverse proxy, and GitHub webhook relays in real time.",
            command: "GET /api/v1/system/status-overview",
            prNumber: 247,
          },
          {
            title: "Commit-Driven Auto-Deployment Synchronization Checker",
            description:
              "Automated validator scanning all managed projects after every Git push to verify deployed commit SHA matches remote HEAD, with one-click multi-project auto-sync and diagnostic telemetry.",
            command: "POST /api/v1/system/check-autodeploy",
            prNumber: 247,
          },
        ],
      },
      {
        title: "Deployment Pipeline & Monorepo Engine",
        badge: "FIX",
        items: [
          {
            title: "Non-Empty Destination Directory Cleanup on Git Clone",
            description:
              "GitService automatically purges stale or dirty pre-existing destination directories before invoking git clone, eliminating fatal destination path collisions in monorepos and re-deployed projects.",
            prNumber: 247,
          },
          {
            title: "Production NODE_ENV Isolation for Next.js & PM2 Builds",
            description:
              "Separated dependency installation environment (development) from application build environment (production), resolving Next.js non-standard NODE_ENV warnings and React server component prerendering failures.",
            prNumber: 247,
          },
        ],
      },
    ],
  },
  {
    version: "v2.9.8",
    date: "September 18, 2026",
    isLatest: false,
    summary:
      "Automated deployment and commit tracking for adopted PM2 services, GitHub webhook secret generation on service import, automatic SSH Git URL normalization, ecosystem configuration detection, and multi-home PM2 daemon support.",
    categories: [
      {
        title: "Adopted PM2 Auto-Deployments & Commits",
        badge: "NEW",
        items: [
          {
            title: "Automatic Webhook Secret Generation & Backfill",
            description:
              "Adopted PM2 and Docker services automatically receive cryptographic webhook authentication secrets, enabling instant GitHub push auto-deployments without manual configuration.",
            command: "POST /api/webhooks/:secret",
          },
          {
            title: "Git SSH to HTTPS Remote Normalization",
            description:
              "Origin remote URLs detected in local repositories (git@github.com:...) are automatically normalized to HTTPS, preventing clone/fetch failures during CI/CD deployments.",
          },
          {
            title: "Preserved Commit History & Local Commit Resolution",
            description:
              "Local adopted service directories now preserve .git history and fallback to local repository roots for commit log extraction, capturing SHA, author, and commit messages across deployments.",
            command: "GET /api/v1/projects/:id/commits",
          },
        ],
      },
      {
        title: "PM2 Runtime & Health Diagnostics",
        badge: "IMPROVEMENT",
        items: [
          {
            title: "Ecosystem Config & PATH Enhancement",
            description:
              "PM2 deployments now detect ecosystem configuration files (ecosystem.config.js, pm2.config.js), package.json entrypoints, and automatically inject node_modules/.bin into the process PATH for runtime CLI tools.",
          },
          {
            title: "PM2 Multi-Home Daemon Resolution & Log Diagnostic Output",
            description:
              "Cross-user PM2 daemon homes are automatically scanned during discovery and restarts, and PM2 logs are piped directly into deployment health check failure logs.",
          },
        ],
      },
    ],
  },
  {
    version: "v2.9.7",
    date: "September 17, 2026",
    isLatest: false,
    summary:
      "Vercel-style deployment and commit log views across the dashboard, redesigned marketing site with Poppins typography and dark-only theme, and global deployments activity page.",
    categories: [
      {
        title: "Dashboard Deployment Logs",
        badge: "NEW",
        items: [
          {
            title: "Global Deployments Page",
            description:
              "New /deployments route lists all project deployments with status, environment, commit metadata, branch, author, and duration in a Vercel-style feed.",
            command: "GET /api/v1/deployments",
          },
          {
            title: "Project Commit & Deployment Tabs",
            description:
              "Project workspaces now expose route-synced Deployments and Commits tabs with shared status/environment filters and commit-centric deployment history.",
            command: "GET /api/v1/projects/:id/commits",
          },
          {
            title: "Redesigned App Sidebar",
            description:
              "Vercel-style sidebar with workspace header, keyboard search shortcut, project sub-navigation, and streamlined navigation to deployments and activity.",
          },
        ],
      },
      {
        title: "Marketing Site Redesign",
        badge: "IMPROVEMENT",
        items: [
          {
            title: "Minimal Product Landing (A+B)",
            description:
              "Homepage rebuilt as a sparse Railway-style layout: split hero with real deployments UI preview, four feature rows, three-step how-it-works, and install CTA.",
          },
          {
            title: "Poppins Typography & Dark-Only Theme",
            description:
              "Landing page uses Poppins for UI copy, pure black canvas, and no light-mode toggle. Removed bento grid, comparison table, ecosystem strip, and capability catalog.",
          },
        ],
      },
    ],
  },
  {
    version: "v2.9.6",
    date: "September 17, 2026",
    isLatest: false,
    summary:
      "Full-page PM2 project creation suite, in-dashboard UI Database Studio and SQL console, Nginx custom domain ingestion for adopted services, real-time PM2 runtime log streaming, and PM2 process metrics.",
    categories: [
      {
        title: "Service Discovery & Host Adoption",
        badge: "NEW",
        items: [
          {
            title: "Nginx Reverse Proxy Domain Ingestion",
            description:
              "Discovered host services now automatically inspect host Nginx configuration files to detect active server_name rules, pre-filling and attaching custom domains upon adoption.",
            command: "GET /api/system/discover-deployments",
          },
          {
            title: "Host PM2 Runtime Logs & Process Telemetry",
            description:
              "Runtime Logs and Metrics views now stream PM2 stdout/stderr output directly and report CPU %, memory bytes, and process status for host-managed services.",
            command: "GET /api/projects/:id/logs",
          },
        ],
      },
      {
        title: "Developer Experience & Database Tooling",
        badge: "NEW",
        items: [
          {
            title: "Scheduled Cron Jobs & Hardware Resource Limits",
            description:
              "Engine-level scheduled cron task runner supporting recurring HTTP webhooks and in-container command jobs. Features schedule presets, manual 'Run Now' triggers, execution history logs, and host hardware resource limit guardrails for databases and cron execution.",
            command: "GET /api/v1/cron-jobs | POST /api/v1/cron-jobs/:id/run | GET /api/v1/system/capacity-specs",
          },
          {
            title: "UI Database Studio & SQL Query Console",
            description:
              "Interactive database studio inside VersionGate. Inspect live schemas, browse tables, run raw queries with millisecond execution telemetry, and export results as JSON or CSV.",
            command: "GET /api/v1/databases/:id/schema | POST /api/v1/databases/:id/query",
          },
          {
            title: "Full-Page Project Creation Suite",
            description:
              "Replaced modal setup with a full-page wizard (/projects/new) supporting Docker containers and bare-metal PM2 process supervision, stack detection, and encrypted environment variables.",
            command: "POST /api/v1/projects | /projects/new",
          },
          {
            title: "Dark Mode Contrast & Theme Refinement",
            description:
              "Fixed element contrast issues across forms, selects, status badges, alerts, and modal dialogs to guarantee crisp readability in dark mode.",
          },
        ],
      },
    ],
  },

  {
    version: "v2.9.4",
    date: "September 16, 2026",
    isLatest: false,
    summary:
      "Vercel and shadcn UI overhaul: global Command Palette (Cmd+K), tabbed project workspaces, redesigned project cards, and streamlined telemetry.",
    categories: [
      {
        title: "Developer Experience & Interface",
        badge: "NEW",
        items: [
          {
            title: "Global Command Palette (Cmd + K)",
            description:
              "Grouped command search with full keyboard navigation across Projects, Navigation, and Operational Actions with keyboard shortcuts and instant execution.",
            command: "Cmd+K / Ctrl+K",
          },
          {
            title: "Tabbed Per-Project Workspaces",
            description:
              "Reorganized long scrolling project views into dedicated tabs: Overview, Deployments, Domains & Networking, Runtime Logs, and Settings.",
          },
          {
            title: "Vercel-Style Project Cards & Overview",
            description:
              "Minimalist cards with Git branch chips, commit status, live deployment preview links, and zero-downtime slot telemetry.",
          },
        ],
      },
    ],
  },
  {
    version: "v2.9.3",
    date: "September 14, 2026",
    isLatest: false,
    summary:
      "Core engine optimizations, DNS preflight verification, live container logs inspection, raw dotenv bulk editing, and custom confirmation modals.",
    categories: [
      {
        title: "Infrastructure & Networking",
        badge: "NEW",
        items: [
          {
            title: "DNS Preflight Verification Setup",
            description:
              "Proactively test DNS A and CNAME record propagation against expected server IPv4 before triggering Let's Encrypt TLS certificate issuance, preventing Certbot rate-limit lockouts.",
            command: "POST /api/v1/projects/:id/domains/:domainId/verify-dns",
          },
          {
            title: "Aggregated Project Overview Endpoint",
            description:
              "Replaced N+1 dashboard polling requests across projects, custom domains, and deployment jobs with a single high-performance batch query endpoint.",
            command: "GET /api/v1/projects/summary",
          },
        ],
      },
      {
        title: "Developer Experience & Monitoring",
        badge: "NEW",
        items: [
          {
            title: "Live Runtime Container Logs Viewer",
            description:
              "Directly inspect stdout and stderr logs for both application containers and provisioned database engines with real-time polling, search filtering, and log export.",
            command: "GET /api/v1/databases/:id/logs",
          },
          {
            title: "Raw .env Bulk Editor & Secret Masking",
            description:
              "Dual-mode environment editor supporting standard key-value inputs alongside direct raw multiline dotenv editing, one-click clipboard export, and sensitive secret masking.",
          },
          {
            title: "Accessible Themed ConfirmDialog Component",
            description:
              "Replaced all native browser window.confirm() dialogs with accessible, dark-themed confirmation modals featuring keyboard shortcuts, destructive variants, and volume drop checkboxes.",
          },
        ],
      },
    ],
  },
  {
    version: "v2.9.2",
    date: "September 14, 2026",
    isLatest: false,
    summary:
      "Post-creation managed database linking: attach, re-link, or unlink any provisioned database to any project post-creation, with inline environment variable attachment from project settings.",
    categories: [
      {
        title: "Managed Databases & Project Integration",
        badge: "NEW",
        items: [
          {
            title: "1-Click Post-Creation Database Linking",
            description:
              "Link or re-link any provisioned database directly from the Databases console with target project selection and environment variable key customization.",
            command: "POST /api/v1/databases/:id/link",
            prNumber: 217,
          },
          {
            title: "Database Unlinking & Re-binding Endpoint",
            description:
              "Unlink provisioned databases from projects cleanly without deleting data volumes or interrupting running container slots.",
            command: "POST /api/v1/databases/:id/unlink",
            prNumber: 217,
          },
          {
            title: "Project Environment DB Attacher",
            description:
              "Attach existing server databases directly inside the Project Settings environment variables panel with automatic Docker vs PM2 connection string resolution.",
            prNumber: 217,
          },
        ],
      },
    ],
  },
  {
    version: "v2.9.1",
    date: "September 14, 2026",
    isLatest: false,
    summary:
      "Vercel-inspired UI refinement: explicit browser refresh notification and one-click reload button upon update completion, removal of decorative dots and logo boxes in favor of clean monospace badges and hairline minimalism.",
    categories: [
      {
        title: "User Experience & Minimalist UI",
        badge: "IMPROVEMENT",
        items: [
          {
            title: "Update Refresh Requirement Notification & 1-Click Reload",
            description:
              "Displays clear [ NOTE ] indicating browser page reload is required after system update completes, accompanied by a direct 1-click [ Refresh Page ] button.",
            prNumber: 215,
          },
          {
            title: "Header & Sidebar Icon Cleanup",
            description:
              "Removed decorative dot icons and 'V' logo boxes from the top platform header and sidebar in accordance with Vercel design language and strict text badge standards.",
            prNumber: 215,
          },
          {
            title: "Monospace Status Indicators",
            description:
              "Replaced pulsing circular indicators across headers, overview cards, and deployment status pills with clean, high-density text badges ([ OPERATIONAL ], [ LIVE ], [ OK ]).",
            prNumber: 215,
          },
        ],
      },
    ],
  },
  {
    version: "v2.9.0",
    date: "September 14, 2026",
    isLatest: false,
    summary:
      "Host deployment auto-discovery and one-click adoption: scan running PM2 processes and external Docker containers across the server and bring them into zero-downtime VersionGate management.",
    categories: [
      {
        title: "Adoption & Infrastructure Discovery",
        badge: "NEW",
        items: [
          {
            title: "Server Deployment Discovery Engine",
            description:
              "Inspects the host machine for active PM2 applications and Docker containers with listening TCP ports and Git metadata.",
            command: "GET /api/v1/system/discover-deployments",
            prNumber: 213,
          },
          {
            title: "1-Click Service Adoption",
            description:
              "Brings unmanaged external apps under VersionGate control: creates Project, multi-stage Environments, routes production traffic via Nginx, and enables blue/green zero-downtime updates.",
            command: "POST /api/v1/projects/adopt",
            prNumber: 213,
          },
          {
            title: "Projects Console Adoption Drawer",
            description:
              "Interactive service adoption modal on the Projects view indicating unadopted instances, port bindings, and directory paths.",
            prNumber: 213,
          },
        ],
      },
    ],
  },
  {
    version: "v2.8.0",
    date: "September 14, 2026",
    isLatest: false,
    summary:
      "Integrated server database provisioning (PostgreSQL, Redis, MySQL, MongoDB), encrypted credential management, dedicated database manager console, and one-click environment variable auto-linking.",
    categories: [
      {
        title: "Managed Databases & Storage",
        badge: "NEW",
        items: [
          {
            title: "Host Database Provisioning Engine",
            description:
              "Deploy isolated containerized database instances (PostgreSQL, Redis, MySQL, MongoDB) on the server with automated port conflict avoidance and persistent Docker volumes.",
            command: "POST /api/v1/databases  {\"engine\":\"postgres\",\"name\":\"auth-db\"}",
            prNumber: 211,
          },
          {
            title: "Project Environment Auto-Linking",
            description:
              "Auto-inject DATABASE_URL or REDIS_URL directly into project or environment encrypted variables, resolving local loopback vs container internal gateway hosts automatically.",
            command: "POST /api/v1/databases/:id/link  {\"projectId\":\"...\"}",
            prNumber: 211,
          },
          {
            title: "Dashboard Database Manager Console",
            description:
              "Dedicated Databases view to inspect connection URIs, reveal/copy credentials, toggle start/stop status, and manage persistent volumes.",
            prNumber: 211,
          },
        ],
      },
    ],
  },
  {
    version: "v2.7.0",
    date: "September 14, 2026",
    isLatest: false,
    summary:
      "Custom package managers and command overrides (bun, pnpm, yarn, npm, uv, poetry, pipenv, cargo, composer), modern framework auto-detection for Rust and Python, and dual execution engines (Docker containers vs bare-metal host PM2).",
    categories: [
      {
        title: "Deployment Engines & Runtimes",
        badge: "NEW",
        items: [
          {
            title: "Host PM2 Bare-Metal Process Execution",
            description:
              "Run applications directly on the host using PM2 process management with zero-downtime blue/green port allocation, automated health validation, and rolling warm-swap rollbacks alongside Docker.",
            command: "POST /api/v1/projects  {\"deploymentType\":\"pm2\"}",
            prNumber: 210,
          },
          {
            title: "Universal Package Manager Overrides",
            description:
              "Explicitly select npm, pnpm, yarn, bun, uv, poetry, pipenv, cargo, or composer per project with custom install, build, and start command execution.",
            command: "POST /api/v1/projects  {\"packageManager\":\"pnpm\"}",
            prNumber: 210,
          },
          {
            title: "Extended Framework Auto-Detection",
            description:
              "Automatic repository pre-scanning and Dockerfile synthesis for Rust (Cargo.toml), modern Python (uv.lock, poetry.lock, Pipfile), and PHP (composer.json).",
            prNumber: 210,
          },
        ],
      },
    ],
  },
  {
    version: "v2.6.0",
    date: "September 13, 2026",
    isLatest: false,
    summary:
      "Enterprise project configuration editor, per-project live traffic telemetry, global deployment activity stream, GitHub App installation management, and Vercel-style stage preview URLs.",
    categories: [
      {
        title: "Developer Experience & Configuration",
        badge: "NEW",
        items: [
          {
            title: "Project Settings Editor & Save + Redeploy",
            description:
              "Dynamically edit repository URL, default branch, build context directory, app port, and root environment variables with one-click Save & Redeploy support.",
            command: "PATCH /api/v1/projects/:id",
            prNumber: 203,
          },
          {
            title: "Vercel-Style Bulk Environment Paste & Auto-Parser",
            description:
              "Paste raw .env blocks, multi-line key-value declarations, or export syntax into any environment variable field to auto-split them into clean form rows without losing state.",
            prNumber: 203,
          },
          {
            title: "Self-Hosted Zero-Dependency GitHub Relay Registry",
            description:
              "Website relay now automatically falls back to local persistent storage when external Upstash Redis is not provisioned.",
            prNumber: 203,
          },
          {
            title: "Vercel-Style Stage Preview URLs",
            description:
              "Instant preview links and one-click URL copy actions on all environment stage cards and deployment history rows.",
          },
        ],
      },
      {
        title: "Monitoring & Observability",
        badge: "NEW",
        items: [
          {
            title: "GitHub Integration Diagnostics & Connection Checkpoints",
            description:
              "Interactive four-checkpoint system probe on Integrations and Repo Picker testing database records, HMAC secret configuration, central relay reachability (latency in ms), and GitHub API token repository access with instant troubleshooting guidance.",
            command: "GET /api/github/test-connection",
          },
          {
            title: "Reserved Port Exclusion & Dynamic Host Conflict Avoidance",
            description:
              "Configure excluded host ports and port ranges in Settings or .env to prevent deployment collisions with existing server services. VersionGate dynamically checks both exclusion lists and live TCP socket listeners when assigning Blue/Green slots.",
            command: "EXCLUDED_PORTS=80,443,3000,5173,5432,6379,9090",
          },
          {
            title: "Per-Project Traffic & Response Telemetry",
            description:
              "Sliding 24-hour hit counters, response status code distributions (2xx, 3xx, 4xx, 5xx), and average latency telemetry per project.",
            command: "GET /api/v1/projects/:id/analytics",
            prNumber: 201,
          },
          {
            title: "Global Deployments Activity Feed",
            description:
              "Cross-project deployments tab in Activity center with status badges, host ports, project links, and direct build log navigation.",
            command: "GET /api/v1/deployments",
            prNumber: 201,
          },
        ],
      },
      {
        title: "Integrations & Management",
        badge: "IMPROVEMENT",
        items: [
          {
            title: "GitHub App Disconnect & Removal",
            description:
              "Disconnect and delete GitHub App installations from the dashboard integrations view without manual database intervention.",
            command: "DELETE /api/v1/github/installation/:installationId",
            prNumber: 201,
          },
        ],
      },
    ],
  },
  {
    version: "v2.5.0",
    date: "September 12, 2026",
    isLatest: false,
    summary:
      "Automatic project stack recognition: intelligent pre-scan for Next.js, Vite, Nuxt, Remix, Astro, SvelteKit, FastAPI, Flask, Django, Go, Rust, and Dockerfiles with automatic port and health probe configuration.",
    categories: [
      {
        title: "Developer Experience & Automation",
        badge: "NEW",
        items: [
          {
            title: "Automated Stack Detector Service",
            description:
              "Backend service analyzing repository tree manifests to detect technology stacks, extract Dockerfile EXPOSE directives, and discover monorepo context directories.",
            command: "GET /api/v1/github/repos/detect?owner=...&repo=...",
            prNumber: 190,
          },
          {
            title: "Interactive Stack Feedback in Project Setup",
            description:
              "Create Project dialog instantly auto-configures app port, health path, and build context presets with clean status badges upon selecting a repository.",
          },
        ],
      },
    ],
  },
  {
    version: "v2.4.1",
    date: "September 12, 2026",
    isLatest: false,
    summary:
      "Reliable plain HTML & static site zero-downtime deployments: fixed Nginx Dockerfile generator syntax, added native /health route responses, clean URL routing, and index.htm support.",
    categories: [
      {
        title: "Deployment & Engine",
        badge: "FIX",
        items: [
          {
            title: "Static HTML Dockerfile generation fix",
            description:
              "Replaced invalid heredoc parsing with portable POSIX printf configuration generation for default.conf. Added dedicated /health endpoint returning 200 OK and clean URL fallbacks ($uri.html and /index.html).",
            command: "ensureDockerfile(buildContextDir, appPort)",
            prNumber: 189,
          },
          {
            title: "Support index.htm and index.html detection",
            description:
              "Auto-detects either index.html or index.htm at the repository root and subdirectories to generate the production Nginx container.",
          },
        ],
      },
    ],
  },
  {
    version: "v2.4.0",
    date: "September 5, 2026",
    isLatest: false,
    summary:
      "Production custom domains per project: isolated nginx upstream and server files, Certbot TLS per hostname, dashboard Live/Open links prefer the attached domain, and deploy traffic sync rewrites the app upstream after blue/green switches.",
    categories: [
      {
        title: "Networking",
        badge: "NEW",
        items: [
          {
            title: "Project custom domains API",
            description:
              "GET/POST /api/v1/projects/:id/domains, DELETE .../domains/:domainId, POST .../domains/:domainId/ssl. One production hostname per project; staging domains planned later.",
            command: 'POST /api/v1/projects/:id/domains  {"hostname":"app.example.com"}',
          },
          {
            title: "Isolated nginx layout",
            description:
              "vg-app-{project}.upstream.conf switches with ACTIVE production port; vg-app-{project}-{hostname}.conf stays Certbot-owned and separate from dashboard upstream.conf.",
          },
          {
            title: "Dashboard Live URL preference",
            description:
              "Project detail, Overview, and Projects list prefer https:// when sslStatus is issued, otherwise http:// on the custom hostname before falling back to /p/{project}/production.",
          },
        ],
      },
    ],
  },
  {
    version: "v2.3.1",
    date: "September 5, 2026",
    isLatest: false,
    summary:
      "Landing page, README, and capability grid rewritten against src/ — single-container scope stated up front, fictional versiongate CLI and dashboard-only cards removed, job log format aligned with deploy.handler.ts. Domain troubleshooting runbook added for hostname vs engine-health mismatches.",
    categories: [
      {
        title: "Documentation & Marketing Accuracy",
        badge: "IMPROVEMENT",
        items: [
          {
            title: "README and landing page scope correction",
            description:
              "Documents one Docker container per project per environment, no docker-compose, and auto-Dockerfile detection list (package.json, requirements.txt, go.mod, index.html).",
          },
          {
            title: "Capability grid engine-only entries",
            description:
              "Removed dashboard UI remodel cards; API routes and host scripts replace fictional versiongate CLI commands.",
          },
          {
            title: "Simulator and Q&A source-aligned snippets",
            description:
              "Job log lines match deploy.handler.ts and rollback.handler.ts; Q&A code excerpts reference traffic.service.ts, docker.ts, and auth routes.",
          },
          {
            title: "Domain troubleshooting runbook",
            description:
              "Docs for when PM2 and preflight say working but the hostname does not open: split-horizon DNS, hairpin NAT on Proxmox/NAT VPS, and the three nginx files (sites-available/versiongate, conf.d/versiongate.conf, upstream.conf).",
          },
        ],
      },
    ],
  },
  {
    version: "v2.3.0",
    date: "August 20, 2026",
    isLatest: false,
    summary: "Complete Vercel platform structural and layout overhaul featuring top scope bar with workspace switcher, horizontal sub-header navigation bar, 4-column telemetry hero matrix, and Grid vs Dense Table view modes.",
    categories: [
      {
        title: "Platform Navigation Architecture Overhaul",
        badge: "NEW",
        items: [
          {
            title: "Top Vercel Scope Bar & Horizontal Nav Sub-Bar",
            description: "Restructured top bar to include workspace switcher, ⌘K command trigger, system status pill, and horizontal navigation tabs.",
          },
          {
            title: "Telemetry Hero Matrix Grid",
            description: "Added 4-column hero telemetry matrix for Total Projects, Active Containers, Pipeline Status, and Cluster Health.",
          },
          {
            title: "Grid Cards & Dense Data Table View Switcher",
            description: "Added Grid vs Dense Table view mode toggling in Projects page for high-density cloud management.",
          },
        ],
      },
    ],
  },
  {
    version: "v2.2.0",
    date: "August 20, 2026",
    isLatest: false,
    summary: "Full platform visual remodel to Vercel Geist Obsidian design system featuring Geist Sans/Mono typography, pure #000000 obsidian dark canvas, translucent backdrop-blur sticky header, rounded-xl hairline panels, and solid white CTA buttons.",
    categories: [
      {
        title: "Aesthetics & Design System",
        badge: "NEW",
        items: [
          {
            title: "Vercel Geist Typography Integration",
            description: "Integrated Geist Sans Variable and Geist Mono Variable fonts across entire dashboard, header, login cards, and terminal viewers.",
          },
          {
            title: "Vercel Geist Obsidian Theme Tokens",
            description: "Configured #000000 obsidian canvas, #0a0a0a surface cards, #1f1f1f hairline borders, and glowing status micro-badges.",
          },
          {
            title: "UI Primitive & Card Overhaul",
            description: "Standardized Button, Card, Input, Badge, and StatCard components to Vercel Geist rounded-xl hairline panels and solid white CTAs.",
          },
        ],
      },
    ],
  },
  {
    version: "v2.1.0",
    date: "August 20, 2026",
    isLatest: false,
    summary: "CLI administrator password reset script, in-dashboard password updates under Settings -> Security, reorganized 5-tab Settings page, and fixed header navigation bar layout.",
    categories: [
      {
        title: "Administrator Credential Management",
        badge: "NEW",
        items: [
          {
            title: "Host CLI Password Reset Tools",
            description:
              "Added `bun run reset-password` script and `--reset` / `--force` flags to `create-admin` for direct credential updates on existing host user records.",
            command: "bun run reset-password admin@example.com 'NewPassword123!'",
          },
          {
            title: "In-Dashboard Password Updates & Settings Overhaul",
            description:
              "Added Change Password form under Settings -> Security and reorganized Settings into 5 fully populated tabs (General, Network, Security, Updates, Advanced).",
          },
        ],
      },
    ],
  },
  {
    version: "v2.0.0",
    date: "August 19, 2026",
    isLatest: false,
    summary: "Automated host Certbot and Nginx plugin installation in the one-command installer script, enhanced Let's Encrypt path resolution, and non-blocking diagnostic feedback for host setups.",
    categories: [
      {
        title: "Automated Host Certbot Installation",
        badge: "NEW",
        items: [
          {
            title: "Pre-packaged Host Certbot & Nginx Plugin",
            description:
              "Updated the 1-command installer script (install.sh) and host bootstrap scripts to automatically download and configure certbot and python3-certbot-nginx out of the box.",
            command: "curl -fsSL https://versiongate.tech/install.sh | sudo bash",
          },
          {
            title: "Enhanced Certbot Path Resolution & Diagnostics",
            description:
              "Added multi-path binary resolution (/usr/bin/certbot, /snap/bin/certbot, /usr/local/bin/certbot) and detailed error diagnostics for missing binaries and Cloudflare proxying.",
          },
        ],
      },
    ],
  },
  {
    version: "v1.9.0",
    date: "August 15, 2026",
    isLatest: false,
    summary: "Asynchronous zero-downtime system self-updates with live log streaming modal, complete dashboard UI overhaul with silent SWR revalidation, and smart terminal scroll locking.",
    categories: [
      {
        title: "Zero-Downtime System Self-Updates",
        badge: "NEW",
        items: [
          {
            title: "Non-Blocking Background Update Pipeline",
            description:
              "System updates run asynchronously in the background with GET /api/v1/system/update/progress telemetry, eliminating HTTP timeouts and connection drops during builds.",
            command: "versiongate system update --async",
          },
          {
            title: "Interactive Live Progress Modal",
            description:
              "Replaced abrupt banners and page reload loops with an interactive live progress drawer showing real-time git fetch, bun install, schema sync, and build steps.",
          },
          {
            title: "Graceful Environment-Aware Reloading",
            description:
              "Automatically detects PM2 vs standalone / container runtimes, applying asset updates in-place without crashing or terminating live dev sessions.",
          },
        ],
      },
      {
        title: "Dashboard UI & Experience Redesign",
        badge: "IMPROVEMENT",
        items: [
          {
            title: "Zero-Flicker SWR Background Revalidation",
            description:
              "Cluster metrics and project states refresh silently in the background without full-screen skeleton flashing or layout jitter.",
          },
          {
            title: "Smart Terminal Scroll Lock",
            description:
              "DeployLog viewer automatically pins to the bottom during live streams while respecting user scroll intent, with a convenient Jump to Latest button.",
          },
          {
            title: "Precision Developer Typography & Clean Metrics",
            description:
              "Redesigned Overview and Project Detail screens with clean slot status indicators, verified container ports, and rapid deployment action triggers.",
          },
        ],
      },
    ],
  },
  {
    version: "v1.8.0",
    date: "August 15, 2026",
    isLatest: false,
    summary: "Engine resilience hardening with encrypted env injection, multi-stage Git auto-deploy, startup stuck job recovery, modern Bun lockfile support, and deduplicated log streams.",
    categories: [
      {
        title: "Engine & Orchestration Hardening",
        badge: "NEW",
        items: [
          {
            title: "Multi-Stage Git Webhook Auto-Deploy",
            description:
              "Push events to staging or development Git branches now automatically trigger zero-downtime builds for matching environment stages in parallel.",
            command: "versiongate webhook test --branch staging",
          },
          {
            title: "Runtime AES-256 Secret Decryption",
            description:
              "Encrypted database environment variables and stage overrides are safely decrypted into container runtime variables upon deployment, promotion, and warm-swap rollback.",
          },
          {
            title: "In-Process Worker Startup Stuck Job Recovery",
            description:
              "Server restarts automatically detect and recover crashed in-flight jobs, clearing stale database deploy locks and keeping deployment status in sync.",
          },
          {
            title: "Modern Bun Lockfile & Optional go.sum Support",
            description:
              "Dockerfile synthesis now detects modern text-based bun.lock files and supports Go projects with standalone go.mod files.",
          },
          {
            title: "WebSocket Live Log Stream Deduplication",
            description:
              "Synchronized log cursor positions between real-time event emitters and PostgreSQL polling prevent duplicate log stream lines in the deployment terminal.",
          },
        ],
      },
    ],
  },
  {
    version: "v1.7.0",
    date: "August 13, 2026",
    isLatest: false,
    summary: "Production-ready installer upgrade with Nginx reverse proxy, PM2 systemd boot persistence, Certbot TLS, and public health checks.",
    categories: [
      {
        title: "Host Installer & Infrastructure",
        badge: "NEW",
        items: [
          {
            title: "Nginx Reverse Proxy Automation",
            description:
              "Installer configures Nginx server block proxying port 80 to 127.0.0.1:9090 with WebSocket upgrade headers, so the engine is reachable on domain or VM public IP directly.",
            command: "curl -fsSL https://versiongate.tech/install.sh | sudo bash",
          },
          {
            title: "PM2 Systemd Reboot Persistence",
            description:
              "Runs pm2 startup systemd and verifies that the pm2 systemd service is active and enabled across server reboots.",
          },
          {
            title: "Optional Certbot TLS Provisioning",
            description:
              "Automatically provisions SSL/TLS certificates via Certbot when a DOMAIN environment variable is passed during install.",
            command: "DOMAIN=versiongate.tech bash install.sh",
          },
          {
            title: "End-to-End Nginx Health Check",
            description:
              "Installer health check verifies both local port 9090 response and Nginx reverse-proxied public endpoint response before finishing.",
          },
        ],
      },
    ],
  },
  {
    version: "v1.6.0",
    date: "August 10, 2026",
    isLatest: false,
    summary: "Signal-black marketing landing with acid-mint accent, mono manifesto typography, and kinetic slot-orbit hero.",
    categories: [
      {
        title: "Website & Marketing",
        badge: "NEW",
        items: [
          {
            title: "Landing page redesign",
            description:
              "Pure-black editorial landing: stacked VersionGate wordmark, kinetic radial control-plane graphic, long-form problem narrative, four-step architecture loop, and install path — acid mint accent system.",
          },
          {
            title: "Typography & atmosphere",
            description:
              "JetBrains Mono display headlines + IBM Plex Sans body, mint (#3EFFA8) accents on pure black, top signal banner, and intentional orbit/pulse motion.",
          },
        ],
      },
    ],
  },
  {
    version: "v1.5.1",
    date: "August 5, 2026",
    isLatest: false,
    summary: "PM2 worker deduplication, Drizzle naming alignment, job queue row locking, and Compose port fixes.",
    categories: [
      {
        title: "Engine Reliability",
        badge: "FIX",
        items: [
          {
            title: "Single job consumer under PM2",
            description:
              "The API process sets IN_PROCESS_WORKER=false when managed by PM2 so only versiongate-worker polls the queue — no duplicate pollers.",
          },
          {
            title: "FOR UPDATE SKIP LOCKED job claims",
            description:
              "Workers claim pending jobs with PostgreSQL row locks so concurrent workers do not fight over the same row.",
          },
          {
            title: "Drizzle schema sync env naming",
            description:
              "Settings and .env editing use DRIZZLE_SCHEMA_SYNC (PRISMA_SCHEMA_SYNC still accepted as a legacy alias).",
          },
          {
            title: "Docker Compose port 9090",
            description: "Compose defaults now match the engine listen port (9090) and single-process in-process worker mode.",
          },
        ],
      },
    ],
  },
  {
    version: "v1.5.0",
    date: "July 30, 2026",
    isLatest: false,
    summary: "Automated Worker Self-Healing, Base-Href HTML Proxying, Auto-Detect Build Context & Relay Fixes.",
    categories: [
      {
        title: "New Features & Infrastructure",
        badge: "NEW",
        items: [
          {
            title: "Automated In-Process Worker Engine",
            description: "Embedded background worker started automatically on server boot, eliminating queue delays and removing the requirement for manual PM2 terminal restarts.",
            command: "versiongate worker status",
            prNumber: 149,
          },
          {
            title: "Base Href HTML Response Proxying",
            description: "Automatic injection of base href tags into proxied HTML responses for seamless CSS, JS, and static asset rendering across Next.js and Vite apps.",
            command: "versiongate proxy test",
            prNumber: 149,
          },
          {
            title: "Smart Repository Context Auto-Detection",
            description: "Vercel-style auto-fill of project names and subdirectory detection (website, dashboard, frontend) upon picking GitHub repositories.",
            command: "versiongate project create",
            prNumber: 149,
          },
        ],
      },
    ],
  },
  {
    version: "v1.4.0",
    date: "July 29, 2026",
    isLatest: false,
    summary: "GitHub App Relay Proxying, Stage Path Reverse Proxy, Warm-Swap Rollbacks, API Bearer Tokens & Health Audit.",
    categories: [
      {
        title: "New Features & Infrastructure",
        badge: "NEW",
        items: [
          {
            title: "GitHub App Relay & Manual Installation Sync",
            description: "Automatic relay proxy fallback for self-hosted instances running without local GitHub App private keys, plus 1-click manual Installation ID sync when GitHub remains on settings page.",
            command: "versiongate github mode --type relay",
            prNumber: 130,
            prLink: "https://github.com/dineshkorukonda/VersionGate/pull/130",
          },
          {
            title: "Stage Path Reverse Proxy Routing",
            description: "Reverse proxies stage environments cleanly on /p/:projectName/:stage without exposing raw container ports.",
            command: "versiongate proxy add --path /p/web-app/staging",
            prNumber: 128,
            prLink: "https://github.com/dineshkorukonda/VersionGate/pull/128",
          },
          {
            title: "Instant Zero-Wait Warm-Swap Rollbacks",
            description: "Sub-second rollbacks reusing locally cached Docker image tags without git re-pulling or context rebuilds.",
            command: "versiongate rollback --project web-app --env production",
            prNumber: 120,
            prLink: "https://github.com/dineshkorukonda/VersionGate/pull/120",
          },
          {
            title: "Bearer API Access Tokens for CI/CD",
            description: "SHA-256 hashed persistent vg_live_... API Bearer tokens for external CI/CD workflow automation.",
            command: "versiongate tokens create --name 'GitHub Actions CI'",
            prNumber: 119,
            prLink: "https://github.com/dineshkorukonda/VersionGate/pull/119",
          },
          {
            title: "Universal One-Line Host Installer Endpoint",
            description: "Direct host endpoint serving install.sh at versiongate.tech/install.sh for automated zero-downtime VM setup.",
            command: "curl -fsSL https://versiongate.tech/install.sh | sudo bash",
            prNumber: 135,
            prLink: "https://github.com/dineshkorukonda/VersionGate/pull/135",
          },
        ],
      },
    ],
  },
  {
    version: "v1.3.0",
    date: "July 21, 2026",
    summary: "Quality Gates, Multi-Stage Promotion Pipelines, and Environment Chain Visualization.",
    categories: [
      {
        title: "Quality Gates & Promotion Pipelines",
        badge: "NEW",
        items: [
          {
            title: "Automated Soak & Health Check Gates",
            description: "Monitors latency and error rate thresholds for a defined soak window before promoting builds.",
          },
        ],
      },
    ],
  },
  {
    version: "v1.2.0",
    date: "May 03, 2026",
    summary: "Multi-tenant GitHub App Central Relay and Neon Database Integration.",
    categories: [
      {
        title: "Relay Architecture & Database Scaling",
        badge: "NEW",
        items: [
          {
            title: "Central GitHub App Relay Core",
            description: "HMAC-SHA256 signature verification (X-VG-Relay-Signature) and fan-out webhook forwarding.",
          },
        ],
      },
    ],
  },
  {
    version: "v1.1.0",
    date: "April 22, 2026",
    summary: "Initial Release of Self-Hosted Zero-Downtime Deployment Engine.",
    categories: [
      {
        title: "Core Deployment Engine",
        badge: "NEW",
        items: [
          {
            title: "Blue-Green Container Execution",
            description: "Multi-stage Docker container builds, atomic Nginx upstream switches, and automated database schema synchronization.",
          },
        ],
      },
    ],
  },
];

function parseReleaseBody(body: string): ReleaseCategory[] {
  if (!body) return [];
  const lines = body.split("\n");
  const categories: ReleaseCategory[] = [];
  let currentCategory: ReleaseCategory | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("### Added") || trimmed.startsWith("## Added")) {
      if (currentCategory) categories.push(currentCategory);
      currentCategory = { title: "Added Capabilities", badge: "NEW", items: [] };
    } else if (trimmed.startsWith("### Changed") || trimmed.startsWith("## Changed") || trimmed.startsWith("### Improved")) {
      if (currentCategory) categories.push(currentCategory);
      currentCategory = { title: "Improvements & Updates", badge: "IMPROVEMENT", items: [] };
    } else if (trimmed.startsWith("### Fixed") || trimmed.startsWith("## Fixed")) {
      if (currentCategory) categories.push(currentCategory);
      currentCategory = { title: "Bug Fixes & Security", badge: "FIX", items: [] };
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const itemText = trimmed.replace(/^[-*]\s+/, "");
      const boldMatch = itemText.match(/^\*\*(.*?)\*\*:\s*(.*)/);
      const title = boldMatch ? boldMatch[1] : itemText;
      const description = boldMatch ? boldMatch[2] : itemText;

      if (!currentCategory) {
        currentCategory = { title: "Release Highlights", badge: "NEW", items: [] };
      }
      currentCategory.items.push({ title, description });
    }
  }

  if (currentCategory) categories.push(currentCategory);
  return categories;
}

async function fetchGitHubReleases(): Promise<ChangelogRelease[]> {
  try {
    const res = await fetch("https://api.github.com/repos/dineshkorukonda/VersionGate/releases", {
      headers: {
        "User-Agent": "VersionGate-Website-Changelog",
        Accept: "application/vnd.github+json",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return FALLBACK_RELEASES;
    }

    const data: GitHubRelease[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return FALLBACK_RELEASES;
    }

    return data.map((rel, idx) => {
      const parsedCategories = parseReleaseBody(rel.body);
      const rawTitle = rel.name || rel.tag_name;
      const titleParts = rawTitle.split(" — ");
      const summary = titleParts.length > 1 ? titleParts[1] : rel.tag_name;

      const dateObj = new Date(rel.published_at);
      const formattedDate = dateObj.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      return {
        version: rel.tag_name,
        date: formattedDate,
        isLatest: idx === 0,
        summary: summary,
        categories: parsedCategories.length > 0 ? parsedCategories : FALLBACK_RELEASES[idx]?.categories || [],
        url: rel.html_url,
      };
    });
  } catch (err) {
    return FALLBACK_RELEASES;
  }
}

export default async function ChangelogPage() {
  const releases = await fetchGitHubReleases();

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <SiteHeader active="changelog" />

      <main id="main" className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* Page Header */}
        <div className="space-y-4 border-b border-border pb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                Changelog // GitHub API Auto-Sync
              </span>
            </div>
            <span className="rounded bg-muted border border-border px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
              [ AUTO-UPDATED VIA GITHUB RELEASES ]
            </span>
          </div>
          <h1 className="font-sans text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Changelog
          </h1>
          <p className="max-w-2xl font-sans text-sm text-muted-foreground leading-relaxed">
            Live, automatically synced product updates, feature releases, and infrastructure improvements powered by GitHub Releases.
          </p>
        </div>

        <ChangelogTimeline releases={releases} />
      </main>

      <SiteFooter />
    </div>
  );
}
