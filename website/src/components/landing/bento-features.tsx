"use client";

import { useState } from "react";

interface BentoCard {
  id: string;
  category: string;
  title: string;
  description: string;
  badge: string;
  command: string;
}

const BENTO_FEATURES: BentoCard[] = [
  {
    id: "bluegreen",
    category: "Deployment",
    title: "Blue/Green zero-downtime engine",
    description: "Deploys to an idle host port, verifies HTTP health probes, then rewrites the Nginx upstream with zero dropped requests.",
    badge: "Core",
    command: "POST /api/v1/deploy",
  },
  {
    id: "db-studio",
    category: "Databases",
    title: "In-dashboard DB studio",
    description: "Inspect schemas, run SQL/Redis/Mongo queries with execution telemetry, and export results to CSV or JSON.",
    badge: "New",
    command: "POST /api/v1/databases/:id/query",
  },
  {
    id: "pm2-runtimes",
    category: "Runtimes",
    title: "Bare-metal PM2 and Docker",
    description: "Run apps via PM2 or isolated Docker containers with automatic stack detection for Bun, Rust, uv, and Go.",
    badge: "New",
    command: "POST /api/v1/projects",
  },
  {
    id: "adoption",
    category: "Infrastructure",
    title: "Server deployment adoption",
    description: "Scan for unmanaged PM2 processes and Docker containers, then adopt them into zero-downtime control in one click.",
    badge: "Ops",
    command: "GET /api/v1/system/discover-deployments",
  },
  {
    id: "managed-db",
    category: "Storage",
    title: "Database provisioning",
    description: "Deploy PostgreSQL, Redis, MySQL, or MongoDB with persistent volumes, encrypted credentials, and instant project linking.",
    badge: "Databases",
    command: "POST /api/v1/databases/link",
  },
  {
    id: "dns-tls",
    category: "Networking",
    title: "DNS preflight and Let's Encrypt",
    description: "Validates DNS records against your VPS IPv4 before invoking Certbot, preventing TLS rate-limit lockouts.",
    badge: "Security",
    command: "POST /api/v1/projects/:id/domains/:id/verify-dns",
  },
  {
    id: "logs-env",
    category: "Monitoring",
    title: "Realtime logs and env editor",
    description: "Live stdout/stderr streaming with filter search, plus dual-mode .env editing and secret masking.",
    badge: "Observability",
    command: "GET /api/v1/projects/:id/logs",
  },
  {
    id: "cron-jobs",
    category: "Automation",
    title: "Cron jobs and scheduled workers",
    description: "Automate background tasks with cron schedules, HTTP webhook pings, host shell commands, and execution history.",
    badge: "New",
    command: "POST /api/v1/cron-jobs",
  },
  {
    id: "self-hosted",
    category: "Sovereignty",
    title: "100% self-hosted",
    description: "Complete data ownership on your VPS. No cloud seats, no surprise bills, no external dependencies.",
    badge: "Open Source",
    command: "curl -fsSL https://versiongate.tech/install.sh",
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
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Capabilities</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need for production
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Zero-downtime rollouts, clean operational tooling, and complete infrastructure ownership.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENTO_FEATURES.map((feat) => (
            <div
              key={feat.id}
              className="group flex flex-col justify-between rounded-lg border border-border/60 bg-zinc-950 p-6 transition hover:border-primary/40"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{feat.category}</span>
                  <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {feat.badge}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                  {feat.title}
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-zinc-400">{feat.description}</p>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-md bg-zinc-900 px-2.5 py-1.5 font-mono text-[11px] text-zinc-300">
                <code className="truncate pr-2">{feat.command}</code>
                <button
                  type="button"
                  onClick={() => handleCopy(feat.id, feat.command)}
                  className="shrink-0 text-muted-foreground hover:text-primary transition"
                >
                  {copiedId === feat.id ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
