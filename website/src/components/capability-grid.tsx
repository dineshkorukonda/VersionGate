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
    description: "Self-healing background worker engine with base-href HTML proxying for flawless asset loading.",
    details: "Runs an embedded background worker inside the API process to eliminate idle queue delays, while injecting base href tags into proxied HTML responses for perfect CSS/image asset resolution.",
    badge: "v1.5 Feature",
  },
  {
    id: "cap-vercellayout",
    category: "Deployment",
    title: "Vercel SalesOps Layout UI",
    command: "cd dashboard && bun run dev",
    description: "Ultra-sleek dark theme UI overhaul with Vercel SalesOps navigation, active indicator bars, and circular progress metrics.",
    details: "Pixel-perfect black dashboard UI with active sidebar indicator strips, sticky backdrop-blur header, 4-column metric cards, and SVG circular progress indicators.",
    badge: "v1.6 Feature",
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
    id: "cap-installer",
    category: "Deployment",
    title: "Universal One-Line Host Installer",
    command: "curl -fsSL https://versiongate.tech/install.sh | sudo bash",
    description: "Automated VM bootstrap installing base packages, Bun, Docker, UFW firewall rules, and launching Setup Mode.",
    details: "Downloads install.sh from versiongate.tech to configure Docker daemon networking, host firewall rules for ports 9090, 5173, 80, and 443, and initialize VersionGate in setup mode.",
    badge: "v1.4 Feature",
  },
  {
    id: "cap-vercel-redesign",
    category: "Deployment",
    title: "Vercel SalesOps Aesthetics Redesign",
    command: "bun run build:dashboard",
    description: "Full Vercel-style UI dashboard overhaul adhering to strict monochromatic aesthetic.",
    details: "Features an ultra-clean #000000 background surface, unified #0a0a0a cards, animated circular SVG loading metrics, brutalist font choices, and no decorative emojis or emojis. Stat strips instead of box grids.",
    badge: "v1.5 UI Refresh",
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
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        <span className="font-mono text-xs text-muted-foreground mr-2">Filter:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 font-mono text-xs rounded-md transition ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground font-semibold"
                : "bg-muted text-muted-foreground border border-border hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Capabilities Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((cap) => (
          <div
            key={cap.id}
            className="group relative rounded-lg border border-border bg-card p-6 transition-all duration-200 hover:border-foreground/40 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground border border-border">
                  {cap.category}
                </span>
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-foreground border border-border font-semibold">
                  {cap.badge}
                </span>
              </div>

              <h3 className="font-sans text-sm font-bold text-foreground">
                {cap.title}
              </h3>

              <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                {cap.description}
              </p>

              {/* Command Code Box */}
              <div className="relative mt-3 rounded-md bg-muted border border-border p-3 font-mono text-xs text-foreground overflow-x-auto">
                <code>{cap.command}</code>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-3 flex items-center justify-between font-mono text-[11px]">
              <button
                onClick={() => handleCopy(cap.id, cap.command)}
                className="text-muted-foreground hover:text-foreground transition"
              >
                {copiedId === cap.id ? "[ Copied! ]" : "[ Copy Command ]"}
              </button>
              <button
                onClick={() => setActiveModalCap(cap)}
                className="text-foreground font-semibold hover:underline"
              >
                [ Inspect Spec ]
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {activeModalCap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="font-sans text-sm font-bold text-foreground">{activeModalCap.title}</span>
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground border border-border">
                  {activeModalCap.category}
                </span>
              </div>
              <button
                onClick={() => setActiveModalCap(null)}
                className="font-mono text-xs text-muted-foreground hover:text-foreground"
              >
                [ Close ]
              </button>
            </div>

            <p className="font-sans text-xs text-muted-foreground leading-relaxed">
              {activeModalCap.details}
            </p>

            <div className="space-y-1">
              <span className="font-mono text-[10px] text-muted-foreground uppercase">CLI Command Execution</span>
              <div className="p-3 bg-muted border border-border font-mono text-xs text-foreground rounded-md">
                $ {activeModalCap.command}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  handleCopy(activeModalCap.id, activeModalCap.command);
                  setActiveModalCap(null);
                }}
                className="rounded-md bg-primary px-4 py-2 font-sans text-xs font-semibold text-primary-foreground hover:opacity-90 transition"
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
