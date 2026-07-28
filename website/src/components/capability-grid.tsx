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
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-4">
        <span className="font-mono text-xs text-zinc-500 mr-2">Filter Category:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 font-mono text-xs rounded transition ${
              selectedCategory === cat
                ? "bg-white text-black font-bold"
                : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-700"
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
            className="group relative rounded border border-zinc-800 bg-[#0a0a0c] p-6 transition-all duration-200 hover:border-zinc-500 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded bg-zinc-900 px-2 py-0.5 font-mono text-[9px] text-zinc-400 border border-zinc-800 font-bold">
                  {cap.category}
                </span>
                <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[9px] text-white border border-zinc-700 font-semibold">
                  {cap.badge}
                </span>
              </div>

              <h3 className="font-mono text-sm font-bold text-white group-hover:text-zinc-200">
                {cap.title}
              </h3>

              <p className="font-mono text-xs text-zinc-400 leading-relaxed">
                {cap.description}
              </p>

              {/* Command Code Box */}
              <div className="relative mt-3 rounded bg-[#050506] border border-zinc-800 p-3 font-mono text-xs text-zinc-300 overflow-x-auto">
                <code>{cap.command}</code>
              </div>
            </div>

            <div className="mt-6 border-t border-zinc-800/80 pt-3 flex items-center justify-between">
              <button
                onClick={() => handleCopy(cap.id, cap.command)}
                className="font-mono text-[10px] text-zinc-400 hover:text-white transition"
              >
                {copiedId === cap.id ? "[ Copied! ]" : "[ Copy Command ]"}
              </button>
              <button
                onClick={() => setActiveModalCap(cap)}
                className="font-mono text-[10px] text-white font-bold hover:underline"
              >
                [ Inspect Spec ]
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {activeModalCap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded border border-zinc-700 bg-zinc-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white">{activeModalCap.title}</span>
                <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[9px] text-zinc-300">
                  {activeModalCap.category}
                </span>
              </div>
              <button
                onClick={() => setActiveModalCap(null)}
                className="font-mono text-xs text-zinc-500 hover:text-white"
              >
                [ Close ]
              </button>
            </div>

            <p className="font-mono text-xs text-zinc-300 leading-relaxed">
              {activeModalCap.details}
            </p>

            <div className="space-y-1">
              <span className="font-mono text-[10px] text-zinc-500 uppercase">CLI Command Execution</span>
              <div className="p-3 bg-black border border-zinc-800 font-mono text-xs text-emerald-400 rounded">
                $ {activeModalCap.command}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  handleCopy(activeModalCap.id, activeModalCap.command);
                  setActiveModalCap(null);
                }}
                className="rounded bg-white px-4 py-2 font-mono text-xs font-bold text-black hover:bg-zinc-200"
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
