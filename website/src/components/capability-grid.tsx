"use client";

import { useState, useMemo, useEffect } from "react";

export interface Capability {
  id: string;
  category: "Deployment" | "Networking & TLS" | "Storage & Databases" | "Security & Auth" | "Monitoring & Logs";
  title: string;
  command: string;
  description: string;
  details: string;
  badge: string;
  tag: string;
}

const CAPABILITIES: Capability[] = [
  {
    id: "cap-blue-green-engine",
    category: "Deployment",
    title: "Blue/Green Zero-Downtime Deployments",
    command: "POST /api/v1/deploy  |  nginx -s reload",
    description:
      "Compiles on an isolated idle slot, runs proactive multi-host health probes, then atomically reloads Nginx upstream with zero dropped connections.",
    details:
      "Every production environment is allocated two published internal ports (Slot Blue and Slot Green). The worker compiles the new version on the idle slot while live traffic continues hitting the active slot. After health checks return 200 OK, the Nginx upstream is atomically rewritten and reloaded.",
    badge: "CORE ENGINE",
    tag: "Zero Downtime",
  },
  {
    id: "cap-warm-swap-rollback",
    category: "Deployment",
    title: "Instant Sub-2-Second Warm Rollback",
    command: "POST /api/v1/projects/:id/rollback",
    description:
      "Instant rollback mechanism reusing locally cached Docker image tags and container states without git re-pulling or context rebuilds.",
    details:
      "VersionGate retains the local Docker image tag and configuration of the previous successful release in a warm cache. Clicking rollback triggers an instant slot switch and Nginx rewrite in under 2 seconds, eliminating painful rebuild wait times during production incidents.",
    badge: "RELIABILITY",
    tag: "< 2s Swap",
  },
  {
    id: "cap-autonomous-autodeploy-sync-engine",
    category: "Deployment",
    title: "Autonomous Commit Polling & Remote Git Sync",
    command: "AUTO_DEPLOY_POLL_MS=60000  |  git ls-remote",
    description:
      "Autonomous background polling daemon, authenticated git ls-remote commit detection, and dual-format urlencoded/json webhook ingress.",
    details:
      "Continuous background poller queries remote repository HEAD commits via authenticated git ls-remote, eliminating stale local git log checks. Ingests GitHub webhook payloads, provides root /webhooks/:secret routing aliases, and automatically tracks baseline commits.",
    badge: "AUTONOMOUS",
    tag: "Git Polling",
  },
  {
    id: "cap-pm2-bare-metal",
    category: "Deployment",
    title: "Bare-Metal PM2 & Container Supervision",
    command: "POST /api/v1/projects  { \"deploymentType\": \"pm2\" }",
    description:
      "Dual execution engine supporting Docker containers and native host PM2 processes with automatic ecosystem detection and PATH injection.",
    details:
      "For apps where container virtualization overhead is undesirable, VersionGate manages host processes via PM2, auto-detecting ecosystem configuration files, injecting node_modules/.bin into PATH, and managing Blue/Green slots with identical zero-downtime cutover.",
    badge: "DUAL RUNTIME",
    tag: "PM2 + Docker",
  },
  {
    id: "cap-db-studio",
    category: "Storage & Databases",
    title: "In-Dashboard Database Studio & SQL Runner",
    command: "GET /api/v1/databases/:id/schema  |  POST /query",
    description:
      "Interactive in-browser database studio for inspecting schemas, exploring tables, and executing raw SQL, Redis, and Mongo queries.",
    details:
      "Inspect live tables, run custom SQL, Redis, and Mongo queries with millisecond execution telemetry, view tabular records, and export results directly to CSV or JSON without opening external database GUI tools.",
    badge: "BUILT-IN",
    tag: "SQL Console",
  },
  {
    id: "cap-db-provisioning-linking",
    category: "Storage & Databases",
    title: "1-Click Database Provisioning & Auto-Linking",
    command: "POST /api/v1/databases  |  POST /api/v1/databases/:id/link",
    description:
      "Deploy PostgreSQL, Redis, MySQL, or MongoDB with persistent volumes and 1-click DATABASE_URL injection into project settings.",
    details:
      "Provisions isolated database containers on the host with persistent volumes. Links credentials directly into target projects, automatically resolving container internal gateway hosts vs local loopback hosts for PM2.",
    badge: "AUTOMATION",
    tag: "Auto-Link",
  },
  {
    id: "cap-dns-verification-tls",
    category: "Networking & TLS",
    title: "Automated Certbot TLS & DNS Preflight",
    command: "POST /api/v1/projects/:id/domains/:id/verify-dns",
    description:
      "Proactively tests DNS A and CNAME records against server IPv4 before issuing Let's Encrypt certificates, preventing rate-limit lockouts.",
    details:
      "Resolves DNS propagation across authorative name servers before calling Certbot. Once verified, automatically requests and binds SSL/TLS certificates via Nginx plugin with automatic renewal hooks.",
    badge: "SECURITY",
    tag: "Auto SSL",
  },
  {
    id: "cap-nginx-stage-proxy",
    category: "Networking & TLS",
    title: "Dynamic Nginx Reverse Proxy & Stage Routing",
    command: "GET /p/:projectName/:stage/  |  sites-available/versiongate",
    description:
      "Dynamic reverse proxy mapping /p/:projectName/:stage to internal published ports without exposing raw host ports.",
    details:
      "Nginx reverse proxy parses path-based stage routing for development, staging, and preview environments. Automatically updates upstream blocks during Blue/Green swaps with HTTP/2 and WebSocket upgrade support.",
    badge: "NETWORKING",
    tag: "Clean Paths",
  },
  {
    id: "cap-autodeploy-relay-git-auth",
    category: "Security & Auth",
    title: "Relay Webhook Stream & Ephemeral Git Tokens",
    command: "POST /api/webhooks/github/relay  |  git clone x-access-token",
    description:
      "Raw body preservation for cryptographic HMAC-SHA256 signature checks and ephemeral GitHub App installation token injection.",
    details:
      "Preserves unparsed payload bytes across all webhook routes for infallible HMAC verification. Negotiates ephemeral GitHub App installation tokens during clone/pull routines so private repositories deploy without storing plaintext secrets.",
    badge: "ENCRYPTED",
    tag: "HMAC Signed",
  },
  {
    id: "cap-bearer-tokens-cicd",
    category: "Security & Auth",
    title: "Bearer API Tokens & CI/CD Pipelines",
    command: "curl -H \"Authorization: Bearer vg_live_...\" /api/v1/deploy",
    description:
      "SHA-256 hashed persistent API Bearer tokens for external CI/CD workflow automation via GitHub Actions and GitLab CI.",
    details:
      "Programmatic deploy triggers, rollback calls, and status inspection using scoped Bearer access tokens. Token hashes are stored in PostgreSQL with SHA-256, allowing automated pipelines without cookie sessions.",
    badge: "AUTOMATION",
    tag: "API Access",
  },
  {
    id: "cap-health-autodetect-validation",
    category: "Monitoring & Logs",
    title: "Codebase Health Detection & Dual-Host Probes",
    command: "src/utils/health-detector.ts  |  validation.service.ts",
    description:
      "Automated source route scanning across Node, Python, and Go, paired with resilient dual-host validation probes over 127.0.0.1 and localhost.",
    details:
      "Statically scans codebase routes (/health, /api/health, /ping, /status) upon adoption and deployment. Executes resilient dual-host validation probes testing IPv4 127.0.0.1 alongside localhost, auto-syncing healthy routes to database settings.",
    badge: "RESILIENCE",
    tag: "Dual Probes",
  },
  {
    id: "cap-realtime-logs-telemetry",
    category: "Monitoring & Logs",
    title: "Real-Time WebSocket Logs & Telemetry",
    command: "WS /api/v1/logs/:jobId  |  GET /api/v1/projects/:id/logs",
    description:
      "Live stdout and stderr streaming for Docker containers and PM2 host processes with ANSI color rendering and search filtering.",
    details:
      "Streams live build outputs and runtime application logs directly into the web console. Features cursor synchronization to prevent duplicate log lines, search filters, and persistent deployment job history.",
    badge: "OBSERVABILITY",
    tag: "Live Stream",
  },
  {
    id: "cap-system-status-autodeploy",
    category: "Monitoring & Logs",
    title: "Subsystems Status Plane & Commit Validator",
    command: "GET /api/v1/system/status-overview  |  POST /check-autodeploy",
    description:
      "Dedicated control plane monitoring Fastify API, PostgreSQL 16, Redis, Docker daemon, PM2, and Nginx reverse proxy in real time.",
    details:
      "Monitors engine core subsystems in real time and automatically compares deployed commit SHAs against repository HEAD across all active projects, flagging out-of-sync environments with 1-click sync.",
    badge: "CONTROL PLANE",
    tag: "Status Plane",
  },
  {
    id: "cap-port-exclusion-conflict-guard",
    category: "Networking & TLS",
    title: "Port Exclusion Lists & Conflict Avoidance",
    command: "EXCLUDED_PORTS=80,443,3000,5432,6379,9090",
    description:
      "Automated port exclusion lists and live TCP socket probes preventing deployment collisions with existing host services.",
    details:
      "Configurable reserved port lists prevent collisions with system daemons. When assigning Blue/Green slots, VersionGate dynamically scans TCP socket listeners before allocating ports.",
    badge: "STABILITY",
    tag: "Port Guard",
  },
  {
    id: "cap-distributed-locks-recovery",
    category: "Deployment",
    title: "Postgres Queue Locking & Stuck Job Recovery",
    command: "FOR UPDATE SKIP LOCKED  |  recoverStuckJobs()",
    description:
      "Row-level database locks for worker concurrency and automatic stuck-job recovery on engine server restarts.",
    details:
      "Uses PostgreSQL FOR UPDATE SKIP LOCKED row claims so multiple worker threads never execute duplicate deployments. Crashed or interrupted in-flight jobs are safely detected and reset upon reboot.",
    badge: "RECOVERY",
    tag: "Self Healing",
  },
];

export function CapabilityGrid() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeModalCap, setActiveModalCap] = useState<Capability | null>(null);

  const categories = [
    "All",
    "Deployment",
    "Networking & TLS",
    "Storage & Databases",
    "Security & Auth",
    "Monitoring & Logs",
  ];

  useEffect(() => {
    if (!activeModalCap) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveModalCap(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeModalCap]);

  const filteredCapabilities = useMemo(() => {
    return CAPABILITIES.filter((cap) => {
      const matchesCategory = selectedCategory === "All" || cap.category === selectedCategory;
      const matchesQuery =
        searchQuery === "" ||
        cap.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cap.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cap.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cap.tag.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section id="capabilities" className="border-t border-neutral-800 bg-[#040404] py-24 scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Capability Catalog
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Engine Capabilities & Architecture
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-400">
              Every feature runs directly on your VPS. Filter by domain or search by command and protocol.
            </p>
          </div>

          {/* Quick Search Input */}
          <div className="w-full sm:w-72">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search capabilities (e.g. nginx, rollback)..."
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 font-mono text-xs text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 text-xs text-neutral-500 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="mt-10 flex flex-wrap items-center gap-2 border-b border-neutral-800/80 pb-5">
          <span className="mr-2 font-mono text-xs text-neutral-500">Filter:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3.5 py-1.5 font-mono text-xs transition-all ${
                selectedCategory === cat
                  ? "bg-white font-semibold text-black shadow-md shadow-white/5"
                  : "border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Capabilities Grid */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCapabilities.map((cap) => (
            <div
              key={cap.id}
              className="group relative flex flex-col justify-between rounded-xl border border-neutral-800/80 bg-neutral-950/80 p-6 transition-all duration-200 hover:border-neutral-600 hover:bg-neutral-900/50"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 font-mono text-[10px] text-neutral-400">
                    {cap.category}
                  </span>
                  <span className="rounded border border-neutral-700 bg-neutral-800/60 px-2 py-0.5 font-mono text-[10px] font-semibold text-neutral-300">
                    {cap.tag}
                  </span>
                </div>

                <h3 className="font-sans text-base font-bold text-white group-hover:text-neutral-200 transition-colors">
                  {cap.title}
                </h3>

                <p className="text-xs leading-relaxed text-neutral-400">
                  {cap.description}
                </p>

                {/* Command Snippet */}
                <div className="relative mt-2 overflow-x-auto rounded-lg border border-neutral-800/90 bg-[#080808] p-3 font-mono text-[11px] text-neutral-300">
                  <code>{cap.command}</code>
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="mt-6 flex items-center justify-between border-t border-neutral-800/80 pt-3.5 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => handleCopy(cap.id, cap.command)}
                  className="text-neutral-400 transition hover:text-white"
                >
                  {copiedId === cap.id ? (
                    <span className="text-white font-semibold">[ Copied! ]</span>
                  ) : (
                    "[ Copy ]"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalCap(cap)}
                  className="font-medium text-white hover:underline"
                >
                  [ Details ]
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredCapabilities.length === 0 && (
          <div className="mt-12 rounded-xl border border-neutral-800 bg-neutral-950 p-12 text-center">
            <p className="font-mono text-sm text-neutral-400">
              No capabilities found matching &quot;{searchQuery}&quot; in category &quot;{selectedCategory}&quot;.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-4 rounded-lg bg-neutral-800 px-4 py-2 font-mono text-xs text-white hover:bg-neutral-700"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Detail Specification Modal */}
      {activeModalCap && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          role="presentation"
          onClick={() => setActiveModalCap(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="capability-modal-title"
            className="w-full max-w-xl rounded-2xl border border-neutral-700 bg-neutral-950 p-6 sm:p-8 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <span className="rounded border border-neutral-700 bg-neutral-800/60 px-2 py-0.5 font-mono text-[10px] font-semibold text-neutral-300">
                  {activeModalCap.tag}
                </span>
                <h3 id="capability-modal-title" className="mt-2 text-lg font-bold text-white sm:text-xl">
                  {activeModalCap.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalCap(null)}
                className="rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 font-mono text-xs text-neutral-400 hover:text-white"
              >
                ✕ Esc
              </button>
            </div>

            <div className="space-y-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 block">
                Technical Architecture Specification
              </span>
              <p className="text-sm leading-relaxed text-neutral-300">
                {activeModalCap.details}
              </p>
            </div>

            <div className="space-y-1.5 pt-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                Target Endpoint / Invocation
              </span>
              <div className="overflow-x-auto rounded-lg border border-neutral-800 bg-[#070707] p-3 font-mono text-xs text-neutral-200">
                <code>{activeModalCap.command}</code>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-800 pt-4">
              <span className="font-mono text-[11px] text-neutral-500">
                Category: <strong className="text-neutral-300">{activeModalCap.category}</strong>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleCopy(activeModalCap.id, activeModalCap.command);
                  }}
                  className="rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-1.5 font-mono text-xs text-white hover:bg-neutral-800 transition"
                >
                  {copiedId === activeModalCap.id ? "Copied!" : "Copy Command"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalCap(null)}
                  className="rounded-lg bg-white px-4 py-1.5 font-mono text-xs font-semibold text-black hover:bg-neutral-200 transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
