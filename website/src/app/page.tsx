"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const GITHUB_REPO = "https://github.com/dineshkorukonda/VersionGate";

const STATS = [
  { label: "Warm-Swap Rollback", value: "< 2 sec", note: "Instant cached image swap" },
  { label: "Traffic Downtime", value: "0 ms", note: "Atomic Nginx upstream rewrite" },
  { label: "Zero-Downtime Architecture", value: "Blue / Green", note: "Isolated published port slots" },
  { label: "Self-Hosted Control", value: "100% MIT", note: "Your VPS, your data & secrets" },
] as const;

const RELEASE_HIGHLIGHTS = [
  {
    version: "v1.4",
    tag: "REVERSE PROXY ROUTING",
    badge: "NEW",
    title: "Stage Path Proxy Routing",
    text: "Expose development, staging, and production environments over clean path-based URLs (/p/my-app/staging) routed dynamically through Nginx without raw ports.",
    icon: "🔀",
  },
  {
    version: "v1.4",
    tag: "CI/CD AUTHENTICATION",
    badge: "NEW",
    title: "Bearer API Access Tokens",
    text: "Generate secure vg_live_... API Bearer tokens with SHA-256 token hashing for GitHub Actions, GitLab CI, and external automation scripts.",
    icon: "🔑",
  },
  {
    version: "v1.4",
    tag: "STAGE CONFIGURATION",
    badge: "NEW",
    title: "Per-Environment Variable Overrides",
    text: "Configure stage-specific environment variables for development, staging, and production that seamlessly override global project defaults.",
    icon: "⚙️",
  },
  {
    version: "v1.4",
    tag: "BACKGROUND ENGINE",
    badge: "NEW",
    title: "Native Engine Background Health Monitor",
    text: "Continuous background thread inspecting PostgreSQL database latency, Redis pub/sub state, container lifecycles, and system threshold alerts.",
    icon: "📡",
  },
] as const;

const FEATURES = [
  {
    mod: "01",
    title: "Blue-Green Zero Downtime",
    text: "Every deployment builds in an isolated idle slot. Traffic switches atomically via Nginx upstream reload only after health checks pass.",
  },
  {
    mod: "02",
    title: "Instant Warm-Swap Rollback",
    text: "Rollback instantly to previous deployments using cached Docker images without re-pulling or rebuilding context. Rollbacks complete in under 2s.",
  },
  {
    mod: "03",
    title: "Git-Backed CI/CD Workflow",
    text: "Signed GitHub webhooks trigger automated container builds on push. Access token support allows seamless integration into GitHub Actions.",
  },
  {
    mod: "04",
    title: "Environment Promotion Chain",
    text: "Dev → Staging → Production pipeline. Build once on the first stage, then promote identical Docker images upstream without rebuilding.",
  },
  {
    mod: "05",
    title: "Stage Path Reverse Proxy",
    text: "Nginx reverse proxy maps /p/:projectName/:stage to published Docker container ports cleanly without exposing raw host ports.",
  },
  {
    mod: "06",
    title: "Native Health & Monitoring",
    text: "Continuous background state engine audits database latency, Redis pub/sub locks, container health status, and system resource alerts.",
  },
] as const;

const PAAS_COMPARISON = [
  {
    feature: "Zero Downtime Blue/Green",
    versionGate: "Built-in (Atomic Nginx)",
    cloudPaaS: "Paid addon / Enterprise",
    traditionalVPS: "Manual shell scripts",
  },
  {
    feature: "Infrastructure Cost",
    versionGate: "Your VPS ($5 - $20/mo)",
    cloudPaaS: "$50 - $500+/mo (Per Seat)",
    traditionalVPS: "Your VPS ($5 - $20/mo)",
  },
  {
    feature: "Deployment Speed",
    versionGate: "< 90s (Build) / < 2s (Warm Swap)",
    cloudPaaS: "2 - 5 minutes",
    traditionalVPS: "Manual / Slow SSH",
  },
  {
    feature: "Data & Secrets Security",
    versionGate: "100% On-Prem / Local Postgres",
    cloudPaaS: "Stored on vendor cloud",
    traditionalVPS: "On-Prem",
  },
  {
    feature: "CI/CD & API Automation",
    versionGate: "Bearer Tokens + Webhooks",
    cloudPaaS: "Vendor CLI / API",
    traditionalVPS: "Complex SSH keys",
  },
] as const;

const TERMINAL_TABS = [
  {
    id: "deploy",
    label: "Deploy Pipeline",
    lines: [
      { text: "$ versiongate deploy --project api-backend --branch main", cls: "text-foreground font-semibold" },
      { text: "[INFO] Enqueued deployment job #d89f2a (project: api-backend)", cls: "text-muted-foreground" },
      { text: "[INFO] Building Docker image versiongate-api-backend:172200142...", cls: "text-sky-400" },
      { text: "[INFO] Starting container api-backend_green on host port 3101", cls: "text-sky-400" },
      { text: "[INFO] Health check PASS http://127.0.0.1:3101/health (200 OK)", cls: "text-emerald-400 font-semibold" },
      { text: "[INFO] Atomic Nginx upstream rewrite: /p/api-backend/production → :3101", cls: "text-emerald-400 font-semibold" },
      { text: "[SUCCESS] Deployment v14 completed in 42s with ZERO downtime!", cls: "text-emerald-400 font-bold" },
    ],
  },
  {
    id: "rollback",
    label: "Instant Warm Swap",
    lines: [
      { text: "$ versiongate rollback --project api-backend --env production", cls: "text-foreground font-semibold" },
      { text: "[INFO] Rollback initiated: v14 → v13", cls: "text-amber-400 font-semibold" },
      { text: "[⚡ WARM-SWAP] Found cached Docker image versiongate-api-backend:v13", cls: "text-emerald-400" },
      { text: "[⚡ WARM-SWAP] Launching container api-backend_blue on port 3100...", cls: "text-emerald-400" },
      { text: "[INFO] Health check PASS http://127.0.0.1:3100/health (200 OK)", cls: "text-emerald-400" },
      { text: "[INFO] Traffic switched to port 3100 in 1.4 seconds", cls: "text-emerald-400 font-semibold" },
      { text: "[SUCCESS] Rollback completed instantly! Zero Downtime.", cls: "text-emerald-400 font-bold" },
    ],
  },
  {
    id: "tokens",
    label: "Bearer API Tokens",
    lines: [
      { text: "$ curl -X POST https://your-server.com/api/v1/auth/tokens \\", cls: "text-foreground font-semibold" },
      { text: "    -H 'Cookie: session=...' -d '{\"name\":\"GitHub Actions CI\"}'", cls: "text-muted-foreground" },
      { text: "[✔] Created API Access Token: vg_live_8f3a9e421c7d...", cls: "text-emerald-400 font-semibold" },
      { text: "$ curl -X POST https://your-server.com/api/v1/deploy \\", cls: "text-foreground font-semibold" },
      { text: "    -H 'Authorization: Bearer vg_live_8f3a9e421c7d...' \\", cls: "text-sky-400" },
      { text: "    -d '{\"projectId\":\"proj_123\",\"environmentId\":\"env_prod\"}'", cls: "text-sky-400" },
      { text: "{\"jobId\":\"job_99a8\",\"status\":\"QUEUED\",\"message\":\"Deployment enqueued\"}", cls: "text-emerald-400 font-mono" },
    ],
  },
];

const GET_STARTED_STEPS = [
  {
    step: "01",
    title: "Clone & Bootstrap Host",
    code: "git clone https://github.com/dineshkorukonda/VersionGate.git\ncd VersionGate\nsudo bash scripts/bootstrap-host.sh",
  },
  {
    step: "02",
    title: "Install Dependencies & Build Dashboard",
    code: "bun install\ncd dashboard && bun run build && cd ..\nbun run preflight",
  },
  {
    step: "03",
    title: "Start Engine & Run Setup Wizard",
    code: "pm2 start ecosystem.config.cjs\n# Open http://your-server-ip:9090/setup in browser",
  },
  {
    step: "04",
    title: "Connect GitHub & Deploy Apps",
    code: "# Dashboard → Integrations → Connect GitHub\n# Create project → Push code → Automatic Zero-Downtime Deploy!",
  },
] as const;

export default function Home() {
  const [activeTab, setActiveTab] = useState<"deploy" | "rollback" | "tokens">("deploy");

  const currentTab = TERMINAL_TABS.find((t) => t.id === activeTab) ?? TERMINAL_TABS[0];

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] bg-mesh-grid">
      <SiteHeader active="features" />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/80 py-20 lg:py-28">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[250px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-sky-400">
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                VersionGate Engine v1.4 Released
              </div>

              <h1 className="text-4xl font-extrabold uppercase tracking-tight sm:text-5xl lg:text-6xl leading-[1.05]">
                Zero-Downtime
                <br />
                <span className="bg-gradient-to-r from-sky-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
                  Docker Deploys.
                </span>
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                Self-hosted zero-downtime deployment engine for your VPS. Atomic blue-green slot swaps, instant warm-swap rollbacks, path-based reverse proxy routing, and Bearer token CI/CD pipelines.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="#get-started"
                  className="rounded-lg bg-sky-500 px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-sky-950 transition-all hover:bg-sky-400 shadow-lg shadow-sky-500/20"
                >
                  Get Started Free
                </Link>
                <Link
                  href={GITHUB_REPO}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-border bg-card/80 px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-foreground transition hover:bg-muted hover:border-foreground/30"
                >
                  Star on GitHub ↗
                </Link>
                <Link
                  href="/docs"
                  className="rounded-lg px-4 py-3 font-mono text-xs text-muted-foreground hover:text-foreground transition"
                >
                  Documentation →
                </Link>
              </div>

              <div className="pt-4 flex items-center gap-6 font-mono text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✔</span> MIT Licensed
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✔</span> 100% Self-Hosted
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✔</span> No Cloud Lock-In
                </div>
              </div>
            </div>

            {/* Interactive Terminal Demo */}
            <div className="lg:col-span-6">
              <div className="rounded-xl border border-border/80 bg-[#0c0c0e] shadow-2xl overflow-hidden glass-panel glow-blue">
                <div className="flex items-center justify-between border-b border-border/80 px-4 py-2.5 bg-[#121215]">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-2 font-mono text-xs font-medium text-muted-foreground">
                      versiongate-cli ~ live execution
                    </span>
                  </div>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Engine Active
                  </span>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border/60 bg-[#121215]/50 px-2 pt-1 gap-1">
                  {TERMINAL_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`px-3 py-1.5 font-mono text-xs rounded-t transition-all ${
                        activeTab === tab.id
                          ? "bg-[#0c0c0e] text-sky-400 font-semibold border-t-2 border-sky-400"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-4 font-mono text-xs leading-relaxed space-y-2 min-h-[220px]">
                  {currentTab.lines.map((l, idx) => (
                    <div key={idx} className={l.cls}>
                      {l.text}
                    </div>
                  ))}
                </div>

                <div className="border-t border-border/60 bg-[#121215]/80 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                  <span>Engine: 127.0.0.1:9090</span>
                  <span>Active Slot: GREEN (:3101)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-border/80 bg-card/40 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
            {STATS.map((s, idx) => (
              <div key={s.label} className={`space-y-1 ${idx > 0 ? "sm:pl-6" : ""} ${idx >= 2 ? "pt-4 sm:pt-0" : ""}`}>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-black tracking-tight text-foreground">{s.value}</p>
                <p className="text-xs text-sky-400/90 font-mono">{s.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Release v1.4 Highlights Section */}
      <section id="updates" className="border-b border-border/80 py-20 bg-surface/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                <span>Release v1.4 Highlights</span>
              </div>
              <h2 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">Latest Engine Features</h2>
              <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Recent architecture additions & platform upgrades
              </p>
            </div>
            <span className="font-mono text-xs text-muted-foreground">Updated July 2026</span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {RELEASE_HIGHLIGHTS.map((u) => (
              <div
                key={u.title}
                className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-6 transition-all duration-300 hover:border-sky-500/50 hover:shadow-xl hover:shadow-sky-500/5"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xl">{u.icon}</span>
                    <span className="rounded bg-sky-500/20 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-sky-400 border border-sky-500/30">
                      {u.badge}
                    </span>
                  </div>
                  <h3 className="mb-2 font-mono text-sm font-bold uppercase tracking-wider text-foreground group-hover:text-sky-400 transition">
                    {u.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{u.text}</p>
                </div>
                <div className="mt-6 border-t border-border/60 pt-3 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                  <span>Engine {u.version}</span>
                  <span className="text-emerald-400 font-semibold">Available now</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="border-b border-border/80 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">Built for Production</h2>
            <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Enterprise deployment capability on your single server or cluster
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.mod}
                className="rounded-xl border border-border/80 bg-card/60 p-6 transition hover:border-border"
              >
                <span className="font-mono text-xs font-bold text-sky-400">0{f.mod} //</span>
                <h3 className="mt-2 mb-2 font-mono text-sm font-bold uppercase tracking-wider text-foreground">
                  {f.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="border-b border-border/80 py-20 bg-surface/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">Why VersionGate?</h2>
            <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Compare VersionGate against cloud PaaS vendor lock-in and manual VPS setups
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-border bg-[#121215] text-muted-foreground">
                    <th className="p-4 font-semibold uppercase">Feature</th>
                    <th className="p-4 font-semibold uppercase text-sky-400 bg-sky-500/10 border-x border-sky-500/20">VersionGate Engine</th>
                    <th className="p-4 font-semibold uppercase">Cloud PaaS (Vercel/Heroku)</th>
                    <th className="p-4 font-semibold uppercase">Traditional VPS Scripts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {PAAS_COMPARISON.map((c, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="p-4 font-medium text-foreground">{c.feature}</td>
                      <td className="p-4 font-bold text-emerald-400 bg-sky-500/5 border-x border-sky-500/10">{c.versionGate}</td>
                      <td className="p-4 text-muted-foreground">{c.cloudPaaS}</td>
                      <td className="p-4 text-muted-foreground">{c.traditionalVPS}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Guide */}
      <section id="get-started" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-sky-400">
              <span>5-Minute Bootstrap</span>
            </div>
            <h2 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">Get Up and Running Fast</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Run VersionGate on any Ubuntu/Debian VPS. Bootstrap handles Docker, PostgreSQL, Redis, and Nginx automatically.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {GET_STARTED_STEPS.map((s) => (
              <div key={s.step} className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-lg">
                <div className="flex items-center gap-3 border-b border-border/80 px-4 py-3 bg-[#121215]">
                  <span className="font-mono text-sm font-bold text-sky-400">{s.step}</span>
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">{s.title}</h3>
                </div>
                <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-foreground/90 bg-[#0c0c0e]">
                  {s.code}
                </pre>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 via-emerald-500/10 to-indigo-500/10 p-8 glass-panel">
            <div>
              <h3 className="text-xl font-bold uppercase tracking-tight text-foreground">Ready to take control of your deployments?</h3>
              <p className="mt-1 text-xs text-muted-foreground font-mono">Join developers self-hosting zero-downtime Docker deploys on their own infrastructure.</p>
            </div>
            <Link
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-sky-500 px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-sky-950 transition hover:bg-sky-400 shadow-lg shadow-sky-500/20"
            >
              Get Started on GitHub ↗
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
