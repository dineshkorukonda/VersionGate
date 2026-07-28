"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const GITHUB_REPO = "https://github.com/dineshkorukonda/VersionGate";

const STATS = [
  { label: "Warm-Swap Rollback", value: "< 2 sec", note: "Instant cached image swap" },
  { label: "Traffic Downtime", value: "0 ms", note: "Atomic Nginx upstream rewrite" },
  { label: "Slot Architecture", value: "Blue / Green", note: "Isolated published port slots" },
  { label: "Self-Hosted Control", value: "100% MIT", note: "On-premise state & secrets" },
] as const;

const RELEASE_HIGHLIGHTS = [
  {
    num: "01",
    version: "v1.4",
    tag: "Reverse Proxy Routing",
    badge: "New",
    title: "Stage Path Proxy Routing",
    text: "Expose development, staging, and production environments over clean path-based URLs (/p/my-app/staging) routed dynamically through Nginx without raw ports.",
  },
  {
    num: "02",
    version: "v1.4",
    tag: "CI/CD Authentication",
    badge: "New",
    title: "Bearer API Access Tokens",
    text: "Generate secure vg_live_... API Bearer tokens with SHA-256 token hashing for GitHub Actions, GitLab CI, and external automation scripts.",
  },
  {
    num: "03",
    version: "v1.4",
    tag: "Stage Configuration",
    badge: "New",
    title: "Per-Environment Variable Overrides",
    text: "Configure stage-specific environment variables for development, staging, and production that seamlessly override global project defaults.",
  },
  {
    num: "04",
    version: "v1.4",
    tag: "Background Engine",
    badge: "New",
    title: "Native Engine Health Monitor",
    text: "Continuous background thread inspecting PostgreSQL database latency, Redis pub/sub state, container lifecycles, and system threshold alerts.",
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
    text: "Dev to Staging to Production pipeline. Build once on the first stage, then promote identical Docker images upstream without rebuilding.",
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
      { text: "$ versiongate deploy --project api-backend --branch main", cls: "text-zinc-100 font-semibold" },
      { text: "[ INFO ] Enqueued deployment job #d89f2a (project: api-backend)", cls: "text-zinc-400" },
      { text: "[ INFO ] Building Docker image versiongate-api-backend:172200142...", cls: "text-zinc-300" },
      { text: "[ INFO ] Starting container api-backend_green on host port 3101", cls: "text-zinc-300" },
      { text: "[ OK ] Health check PASS http://127.0.0.1:3101/health (200 OK)", cls: "text-emerald-400 font-semibold" },
      { text: "[ OK ] Atomic Nginx upstream rewrite: /p/api-backend/production -> :3101", cls: "text-emerald-400 font-semibold" },
      { text: "[ OK ] Deployment v14 completed in 42s with ZERO downtime!", cls: "text-emerald-400 font-bold" },
    ],
  },
  {
    id: "rollback",
    label: "Instant Warm Swap",
    lines: [
      { text: "$ versiongate rollback --project api-backend --env production", cls: "text-zinc-100 font-semibold" },
      { text: "[ INFO ] Rollback initiated: v14 -> v13", cls: "text-amber-400 font-semibold" },
      { text: "[ WARM-SWAP ] Found cached Docker image versiongate-api-backend:v13", cls: "text-emerald-400" },
      { text: "[ WARM-SWAP ] Launching container api-backend_blue on port 3100...", cls: "text-emerald-400" },
      { text: "[ OK ] Health check PASS http://127.0.0.1:3100/health (200 OK)", cls: "text-emerald-400" },
      { text: "[ OK ] Traffic switched to port 3100 in 1.4 seconds", cls: "text-emerald-400 font-semibold" },
      { text: "[ OK ] Rollback completed instantly! Zero Downtime.", cls: "text-emerald-400 font-bold" },
    ],
  },
  {
    id: "tokens",
    label: "Bearer Tokens",
    lines: [
      { text: "$ curl -X POST https://your-server.com/api/v1/auth/tokens \\", cls: "text-zinc-100 font-semibold" },
      { text: "    -H 'Cookie: session=...' -d '{\"name\":\"GitHub Actions CI\"}'", cls: "text-zinc-400" },
      { text: "[ OK ] Created API Access Token: vg_live_8f3a9e421c7d...", cls: "text-emerald-400 font-semibold" },
      { text: "$ curl -X POST https://your-server.com/api/v1/deploy \\", cls: "text-zinc-100 font-semibold" },
      { text: "    -H 'Authorization: Bearer vg_live_8f3a9e421c7d...' \\", cls: "text-zinc-300" },
      { text: "    -d '{\"projectId\":\"proj_123\",\"environmentId\":\"env_prod\"}'", cls: "text-zinc-300" },
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
    code: "# Dashboard -> Integrations -> Connect GitHub\n# Create project -> Push code -> Automatic Zero-Downtime Deploy!",
  },
] as const;

export default function Home() {
  const [activeTab, setActiveTab] = useState<"deploy" | "rollback" | "tokens">("deploy");

  const currentTab = TERMINAL_TABS.find((t) => t.id === activeTab) ?? TERMINAL_TABS[0];

  return (
    <div className="min-h-screen bg-black text-white bg-tech-grid">
      <SiteHeader active="features" />

      {/* Hero Section */}
      <section className="relative border-b border-zinc-800/80 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-3 rounded border border-zinc-700/80 bg-zinc-900/80 px-3 py-1 font-mono text-xs text-zinc-300">
                <span className="font-bold text-white">Engine Release</span>
                <span>VersionGate v1.4 Stable</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.05]">
                Command the Cluster.
              </h1>

              <p className="max-w-xl text-sm leading-relaxed text-zinc-400 font-mono">
                Self-hosted zero-downtime deployment engine for your VPS. Atomic blue-green slot swaps, instant warm-swap rollbacks, path-based stage routing, and Bearer token CI/CD pipelines.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="#get-started"
                  className="rounded bg-white px-6 py-3 font-mono text-xs font-bold text-black transition hover:bg-zinc-200"
                >
                  Deploy Now
                </Link>
                <Link
                  href={GITHUB_REPO}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded border border-zinc-700 bg-zinc-900/80 px-6 py-3 font-mono text-xs font-semibold text-white transition hover:bg-zinc-800"
                >
                  GitHub Repo
                </Link>
                <Link
                  href="/docs"
                  className="px-4 py-3 font-mono text-xs text-zinc-400 hover:text-white transition"
                >
                  Docs
                </Link>
              </div>

              <div className="pt-4 flex items-center gap-6 font-mono text-xs text-zinc-500 border-t border-zinc-800/80">
                <div>License: MIT</div>
                <div>Control: 100% Self-Hosted</div>
                <div>Cloud Lock-In: Zero</div>
              </div>
            </div>

            {/* Interactive Terminal Demo */}
            <div className="lg:col-span-6">
              <div className="rounded border border-zinc-800 bg-[#050506] shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 bg-[#0a0a0c]">
                  <div className="flex items-center gap-3 font-mono text-xs text-zinc-400">
                    <span className="text-zinc-600">///</span>
                    <span className="font-bold text-white">VersionGate CLI Execution</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Engine Active
                  </span>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-800/80 bg-[#0a0a0c] px-2 pt-1 gap-1">
                  {TERMINAL_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`px-3 py-1.5 font-mono text-xs rounded-t transition-all ${
                        activeTab === tab.id
                          ? "bg-[#050506] text-white font-bold border-t-2 border-white"
                          : "text-zinc-500 hover:text-zinc-300"
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

                <div className="border-t border-zinc-800 bg-[#0a0a0c] px-4 py-2 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>Engine: 127.0.0.1:9090</span>
                  <span>Active Slot: GREEN (:3101)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-zinc-800/80 bg-zinc-950/60 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800">
            {STATS.map((s, idx) => (
              <div key={s.label} className={`space-y-1 ${idx > 0 ? "sm:pl-6" : ""} ${idx >= 2 ? "pt-4 sm:pt-0" : ""}`}>
                <p className="font-mono text-xs text-zinc-500 font-medium">{s.label}</p>
                <p className="text-2xl font-black tracking-tight text-white font-mono">{s.value}</p>
                <p className="text-xs text-zinc-400 font-mono">[ {s.note} ]</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Release v1.4 Highlights Section */}
      <section id="updates" className="border-b border-zinc-800/80 py-24 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 font-mono text-[10px] font-bold text-zinc-300">
                <span>Release v1.4 Highlights</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Latest Engine Features</h2>
              <p className="mt-2 font-mono text-xs text-zinc-400">
                Recent architecture additions & platform upgrades
              </p>
            </div>
            <span className="font-mono text-xs text-zinc-500">[ Updated July 2026 ]</span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {RELEASE_HIGHLIGHTS.map((u) => (
              <div
                key={u.title}
                className="group relative flex flex-col justify-between rounded border border-zinc-800 bg-[#0a0a0c] p-6 transition-all duration-200 hover:border-zinc-500"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-zinc-500">{u.num} //</span>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[9px] font-bold text-white border border-zinc-700">
                      {u.badge}
                    </span>
                  </div>
                  <span className="block font-mono text-[10px] text-zinc-400 mb-1">
                    {u.tag}
                  </span>
                  <h3 className="mb-2 font-mono text-sm font-bold text-white group-hover:text-zinc-200">
                    {u.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-zinc-400 font-mono">{u.text}</p>
                </div>
                <div className="mt-6 border-t border-zinc-800/80 pt-3 flex items-center justify-between font-mono text-[10px] text-zinc-500">
                  <span>Engine {u.version}</span>
                  <span className="text-white font-semibold">[ Available Now ]</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="border-b border-zinc-800/80 py-24 bg-zinc-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Built for Production</h2>
            <p className="mt-2 font-mono text-xs text-zinc-400">
              Enterprise deployment capability on your single server or cluster
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.mod}
                className="rounded border border-zinc-800 bg-[#0a0a0c] p-6 transition hover:border-zinc-700"
              >
                <span className="font-mono text-xs font-bold text-zinc-500">0{f.mod} //</span>
                <h3 className="mt-2 mb-2 font-mono text-sm font-bold text-white">
                  {f.title}
                </h3>
                <p className="text-xs leading-relaxed text-zinc-400 font-mono">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="border-b border-zinc-800/80 py-24 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Why VersionGate?</h2>
            <p className="mt-2 font-mono text-xs text-zinc-400">
              Compare VersionGate against cloud PaaS vendor lock-in and manual VPS setups
            </p>
          </div>

          <div className="rounded border border-zinc-800 bg-[#0a0a0c] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-[#121215] text-zinc-400">
                    <th className="p-4 font-semibold">Feature</th>
                    <th className="p-4 font-bold text-white bg-zinc-900/60 border-x border-zinc-800">VersionGate Engine</th>
                    <th className="p-4 font-semibold">Cloud PaaS (Vercel / Heroku)</th>
                    <th className="p-4 font-semibold">Traditional VPS Scripts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {PAAS_COMPARISON.map((c, i) => (
                    <tr key={i} className="hover:bg-zinc-900/30">
                      <td className="p-4 font-medium text-white">{c.feature}</td>
                      <td className="p-4 font-bold text-white bg-zinc-900/20 border-x border-zinc-800">{c.versionGate}</td>
                      <td className="p-4 text-zinc-400">{c.cloudPaaS}</td>
                      <td className="p-4 text-zinc-400">{c.traditionalVPS}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Guide */}
      <section id="get-started" className="py-24 bg-zinc-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 font-mono text-[10px] font-bold text-zinc-300">
              <span>5-Minute Bootstrap</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Get Up and Running Fast</h2>
            <p className="mt-2 text-xs text-zinc-400 font-mono">
              Run VersionGate on any Ubuntu/Debian VPS. Bootstrap handles Docker, PostgreSQL, Redis, and Nginx automatically.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {GET_STARTED_STEPS.map((s) => (
              <div key={s.step} className="rounded border border-zinc-800 bg-[#0a0a0c] overflow-hidden">
                <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3 bg-[#121215]">
                  <span className="font-mono text-sm font-bold text-white">{s.step} //</span>
                  <h3 className="font-mono text-xs font-bold text-white">{s.title}</h3>
                </div>
                <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-zinc-300 bg-[#050506]">
                  {s.code}
                </pre>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded border border-zinc-700 bg-zinc-900/80 p-8">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white">Ready to Command Your Cluster?</h3>
              <p className="mt-1 text-xs text-zinc-400 font-mono">Join developers self-hosting zero-downtime Docker deploys on their own infrastructure.</p>
            </div>
            <Link
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="rounded bg-white px-6 py-3 font-mono text-xs font-bold text-black transition hover:bg-zinc-200"
            >
              Get Started on GitHub
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
