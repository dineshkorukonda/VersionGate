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
    id: "cap-bluegreen",
    category: "Deployment",
    title: "Blue-Green Zero Downtime",
    command: "versiongate deploy --project web-app --env production",
    description: "Atomic idle slot container compilation and Nginx upstream reload with zero HTTP request loss.",
    details: "Builds a fresh container on an isolated host port, executes endpoint health checks, and rewrites Nginx upstream configuration atomically.",
    badge: "Core Engine",
  },
  {
    id: "cap-warmswap",
    category: "Deployment",
    title: "Instant Warm-Swap Rollback",
    command: "versiongate rollback --project web-app --env production",
    description: "Sub-second rollbacks reusing locally cached Docker image tags without git re-pulling or context rebuilds.",
    details: "Inspects host Docker cache for previous container state and switches traffic instantly, reducing rollback time from minutes to < 2 seconds.",
    badge: "v1.4 Feature",
  },
  {
    id: "cap-stageproxy",
    category: "Networking",
    title: "Stage Path Reverse Proxy",
    command: "versiongate proxy add --path /p/web-app/staging",
    description: "Reverse proxies stage environments cleanly on /p/:projectName/:stage without exposing raw host ports.",
    details: "Dynamic Nginx location blocks parse incoming request URI paths and forward traffic directly to internal Docker container ports.",
    badge: "v1.4 Feature",
  },
  {
    id: "cap-bearerauth",
    category: "Security",
    title: "Bearer API Access Tokens",
    command: "versiongate tokens create --name 'GitHub Actions CI'",
    description: "SHA-256 hashed persistent vg_live_... API Bearer tokens for external CI/CD workflow automation.",
    details: "Enables programmatic deployment triggers from GitHub Actions, GitLab CI, or custom webhooks without session cookies.",
    badge: "v1.4 Feature",
  },
  {
    id: "cap-autohealing",
    category: "Monitoring",
    title: "In-Process Worker & Base Href Proxy",
    command: "versiongate worker start --auto-heal",
    description: "Embedded worker for Docker/single-process installs; PM2 splits API and worker with explicit queue ownership.",
    details: "Runs a background worker inside the API when IN_PROCESS_WORKER=true (Docker default). PM2 production sets IN_PROCESS_WORKER=false on the API and uses a dedicated worker process. Job claims use PostgreSQL SKIP LOCKED row locks.",
    badge: "v1.5 Feature",
  },
  {
    id: "cap-healthmonitor",
    category: "Monitoring",
    title: "Native Background Health Audit",
    command: "versiongate monitor status",
    description: "Continuous background thread auditing DB connection latency, Redis locks, container states, and disk/RAM limits.",
    details: "Runs an internal 30-second audit loop inspecting system thresholds and exposing real-time engine health telemetry.",
    badge: "v1.4 Feature",
  },
  {
    id: "cap-envoverrides",
    category: "Security",
    title: "Per-Environment Variable Overrides",
    command: "versiongate env set --env staging --key DB_HOST --val staging-db",
    description: "Stage-specific environment variables for dev, staging, and prod overriding global project environment defaults.",
    details: "Merged into container runtime environment at launch: { ...parseProjectEnv(project.env), ...parseProjectEnv(stage.env) }.",
    badge: "v1.4 Feature",
  },
  {
    id: "cap-githubrelay",
    category: "Security",
    title: "GitHub App Relay & Custom Manifests",
    command: "versiongate github mode --type relay",
    description: "Dual GitHub integration supporting zero-config central cloud relay or 1-click custom GitHub App Manifest creation.",
    details: "Central relay fans out push webhooks securely with HMAC SHA-256 signatures; Custom Manifest mode builds self-hosted apps in 1-click.",
    badge: "v1.4 Feature",
  },
  {
    id: "cap-multibranch",
    category: "Deployment",
    title: "Multi-Stage Git Webhook Auto-Deploy",
    command: "versiongate webhook test --branch staging",
    description: "Automatic multi-stage deployments targeting staging, dev, and production based on Git push ref.",
    details: "Parses Git push branches and simultaneously triggers automated builds for all environment stages tracking that branch.",
    badge: "v1.8 Feature",
  },
  {
    id: "cap-bunbuild",
    category: "Deployment",
    title: "Bun Text Lockfile & Multi-Runtime Dockerfiles",
    command: "versiongate build --detect",
    description: "Native Dockerfile generation supporting modern text bun.lock, bun.lockb, go.mod without go.sum, and Node package-lock.",
    details: "Introspects project structure to synthesize lightweight Alpine Docker containers with optimized caching layers across Bun, Node, Go, and Python.",
    badge: "v1.8 Feature",
  },
  {
    id: "cap-installer",
    category: "Deployment",
    title: "Universal One-Line Host Installer",
    command: "curl -fsSL https://versiongate.tech/install.sh | sudo bash",
    description: "Automated VM bootstrap installing Node 20, Bun, Docker, PM2 systemd persistence, Nginx reverse proxy, and optional Certbot TLS.",
    details: "Downloads install.sh from versiongate.tech to configure Docker daemon networking, PM2 systemd auto-boot persistence, Nginx reverse proxying (80/443 -> 9090), automatic Certbot TLS, and end-to-end health checks.",
    badge: "v1.7 Feature",
  },
];

export function CapabilityGrid() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeModalCap, setActiveModalCap] = useState<Capability | null>(null);

  const categories = ["All", "Deployment", "Networking", "Security", "Monitoring"];

  const filtered = selectedCategory === "All"
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

              <p className="text-xs leading-relaxed text-white/50">
                {cap.description}
              </p>

              <div className="relative mt-3 overflow-x-auto border border-white/10 bg-white/[0.03] p-3 font-mono text-xs text-white/80">
                <code>{cap.command}</code>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-3 font-mono text-[11px]">
              <button
                onClick={() => handleCopy(cap.id, cap.command)}
                className="text-white/45 transition hover:text-white"
              >
                {copiedId === cap.id ? "[ Copied ]" : "[ Copy Command ]"}
              </button>
              <button
                onClick={() => setActiveModalCap(cap)}
                className="font-semibold text-[#3effa8] hover:underline"
              >
                [ Inspect Spec ]
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

            <p className="text-xs leading-relaxed text-white/55">
              {activeModalCap.details}
            </p>

            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                CLI Command Execution
              </span>
              <div className="border border-white/10 bg-white/[0.03] p-3 font-mono text-xs text-white/80">
                $ {activeModalCap.command}
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
                Copy Command
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
