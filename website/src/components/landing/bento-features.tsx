"use client";

import { useState } from "react";

interface BentoCard {
  id: string;
  category: string;
  title: string;
  description: string;
  badge: string;
  command: string;
  highlight: string;
}

const BENTO_FEATURES: BentoCard[] = [
  {
    id: "bluegreen",
    category: "Deployment",
    title: "Blue/Green Zero-Downtime Engine",
    description:
      "Deploys to an idle host port, verifies HTTP health probes before rewriting the Nginx upstream, and eliminates dropped requests.",
    badge: "Core Engine",
    command: "POST /api/v1/deploy",
    highlight: "Zero dropped connections & warm rollback in 1s",
  },
  {
    id: "db-studio",
    category: "Databases",
    title: "In-Dashboard DB Studio & Query Console",
    description:
      "Inspect live schemas, explore tables, run custom SQL / Redis / Mongo queries with execution telemetry, and export to CSV/JSON.",
    badge: "NEW v2.9.5",
    command: "POST /api/v1/databases/:id/query",
    highlight: "Direct container query execution with ms timing",
  },
  {
    id: "pm2-runtimes",
    category: "Runtimes",
    title: "Bare-Metal PM2 & Container Supervision",
    description:
      "Run apps directly on host bare-metal via PM2 or in isolated Docker containers with automatic stack detection for Bun, Rust, uv, and Go.",
    badge: "NEW v2.9.5",
    command: "POST /api/v1/projects { deploymentType: 'pm2' }",
    highlight: "Auto-detects locks: bun.lock, Cargo.toml, uv.lock",
  },
  {
    id: "adoption",
    category: "Infrastructure",
    title: "Server Deployment Auto-Adoption",
    description:
      "Scan the server for unmanaged PM2 processes and external Docker containers, then adopt them into zero-downtime control with 1 click.",
    badge: "Ops Tooling",
    command: "GET /api/v1/system/discover-deployments",
    highlight: "Auto-maps ports, directories, and Git metadata",
  },
  {
    id: "managed-db",
    category: "Storage",
    title: "Multi-Database Provisioning & Auto-Link",
    description:
      "Deploy PostgreSQL 16, Redis, MySQL, or MongoDB with persistent Docker volumes, encrypted credentials, and instant project linking.",
    badge: "Databases",
    command: "POST /api/v1/databases/link",
    highlight: "Auto-injects DATABASE_URL or REDIS_URL into env",
  },
  {
    id: "dns-tls",
    category: "Networking",
    title: "Preflight DNS & Automated Let's Encrypt",
    description:
      "Proactively validates DNS A & CNAME records against your VPS IPv4 before invoking Certbot, preventing TLS rate-limit lockouts.",
    badge: "Security",
    command: "POST /api/v1/projects/:id/domains/:id/verify-dns",
    highlight: "Isolated upstream configs per project hostname",
  },
  {
    id: "logs-env",
    category: "Monitoring",
    title: "Realtime Container Logs & Raw DotEnv",
    description:
      "Live stdout/stderr stream viewer with filter search, paired with dual-mode raw multiline .env editing and secret masking.",
    badge: "Observability",
    command: "GET /api/v1/projects/:id/logs",
    highlight: "Dual-mode key-value and raw dotenv bulk paste",
  },
  {
    id: "self-hosted",
    category: "Sovereignty",
    title: "100% Self-Hosted & Zero Lock-In",
    description:
      "Complete data ownership on your own VPS or bare metal server. No cloud seats, no surprise bills, and no external dependencies.",
    badge: "Open Source",
    command: "curl -fsSL https://versiongate.tech/install.sh",
    highlight: "Runs on any Linux server with Docker & PostgreSQL",
  },
];

export function BentoFeatures() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section id="features" className="py-20 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            [ ARCHITECTURE &amp; CAPABILITIES ]
          </p>
          <h2 className="mt-2 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything You Need to Run Production at Scale
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Engineered with extreme precision for developers who demand zero-downtime rollouts,
            clean operational tooling, and complete infrastructure ownership.
          </p>
        </div>

        {/* 4x2 Dokploy-Style Bento Grid */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENTO_FEATURES.map((feat) => (
            <div
              key={feat.id}
              className="group relative flex flex-col justify-between rounded-lg border border-border/70 bg-zinc-950/70 p-6 transition-all duration-200 hover:border-primary/60 hover:bg-zinc-950 hover:shadow-[0_4px_24px_rgba(239,68,68,0.08)]"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {feat.category}
                  </span>
                  <span className="border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {feat.badge}
                  </span>
                </div>

                {/* Title with expanding indicator line */}
                <div className="relative mt-4 mb-2">
                  <div className="absolute -left-6 top-1 h-4 w-1 rounded-r bg-border transition-all duration-200 group-hover:h-6 group-hover:bg-primary" />
                  <h3 className="font-mono text-base font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {feat.title}
                  </h3>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                  {feat.description}
                </p>
              </div>

              <div className="mt-6 border-t border-border/40 pt-4">
                <div className="font-mono text-[11px] text-zinc-300 mb-3 flex items-center justify-between">
                  <span className="text-zinc-500">Key Feature:</span>
                  <span className="text-primary font-medium text-right">{feat.highlight}</span>
                </div>

                <div className="flex items-center justify-between rounded bg-zinc-900/80 px-2.5 py-1.5 font-mono text-[11px] text-zinc-300">
                  <code className="truncate pr-2">{feat.command}</code>
                  <button
                    type="button"
                    onClick={() => handleCopy(feat.id, feat.command)}
                    className="shrink-0 text-muted-foreground hover:text-primary transition"
                  >
                    {copiedId === feat.id ? "[ OK ]" : "[ COPY ]"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
