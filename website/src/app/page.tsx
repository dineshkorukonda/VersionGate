import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const GITHUB_REPO = "https://github.com/dinexh/VersionGate";

const STATS = [
  { label: "Deploy Speed", value: "< 90s" },
  { label: "Uptime SLA", value: "99.9%" },
  { label: "Zero Downtime", value: "Blue/Green" },
  { label: "Self-Hosted", value: "MIT" },
] as const;

const FEATURES = [
  {
    mod: "MOD_01",
    title: "Zero-Downtime Deploys",
    text: "Blue-green slot swaps with health checks before traffic moves. Nginx upstream rewrites keep users on one URL.",
  },
  {
    mod: "MOD_02",
    title: "Git-Backed Workflow",
    text: "Connect the GitHub App, pick a repo and branch, and every push auto-deploys with signed webhooks.",
  },
  {
    mod: "MOD_03",
    title: "Self-Hosted Control",
    text: "Your VPS, your data. Postgres state, Docker containers, and encrypted secrets never leave your server.",
  },
  {
    mod: "MOD_04",
    title: "Environment Promotion",
    text: "Dev → staging → production chain. Promote upstream images without rebuilding on each stage.",
  },
] as const;

const COMPONENTS = [
  {
    tag: "API",
    title: "Fastify Engine",
    text: "REST API on :9090. Handles projects, deploy triggers, webhooks, setup wizard, and serves the built dashboard as static files.",
  },
  {
    tag: "Worker",
    title: "Job Queue",
    text: "Background worker runs build/deploy/rollback jobs. Streams live logs to the dashboard over WebSockets.",
  },
  {
    tag: "DB",
    title: "PostgreSQL + Prisma",
    text: "Source of truth for projects, deployments, environments, jobs, and encrypted env vars. Crash-safe state markers.",
  },
  {
    tag: "Runtime",
    title: "Docker + Nginx",
    text: "Docker CLI builds and runs containers on blue/green slots. Nginx upstream rewrites switch traffic atomically.",
  },
] as const;

const PIPELINE_STEPS = [
  { step: "01", label: "Acquire lock", detail: "409 if a deploy is already running for this project" },
  { step: "02", label: "Git clone / pull", detail: "Fetch the configured branch into the project workspace" },
  { step: "03", label: "Pick idle slot", detail: "ACTIVE=BLUE → deploy GREEN on basePort+1, and vice versa" },
  { step: "04", label: "Docker build & run", detail: "Image tagged versiongate-<name>:<timestamp>, container on idle port" },
  { step: "05", label: "Health check", detail: "GET :port/health with retries — traffic only moves on PASS" },
  { step: "06", label: "Traffic switch", detail: "Nginx upstream rewrite + reload; old slot marked ROLLED_BACK" },
] as const;

const GET_STARTED_STEPS = [
  {
    step: "01",
    title: "Clone & install",
    code: "git clone https://github.com/dinexh/VersionGate\ncd VersionGate && bun install\ncd dashboard && bun run build && cd ..",
  },
  {
    step: "02",
    title: "Verify the host",
    code: "docker network create versiongate-net\nbun run preflight",
  },
  {
    step: "03",
    title: "Start the engine",
    code: "pm2 start ecosystem.config.cjs\npm2 save",
  },
  {
    step: "04",
    title: "Run setup wizard",
    code: "Open http://your-server:9090/setup\n→ PostgreSQL URL, domain, admin account",
  },
  {
    step: "05",
    title: "Connect GitHub & deploy",
    code: "Integrations → Connect GitHub\n→ Create project → push to branch",
  },
] as const;

const TERMINAL_LINES = [
  { text: "$ versiongate preflight", cls: "text-foreground" },
  { text: "[✔] docker daemon reachable", cls: "text-emerald-400" },
  { text: "[✔] postgres connected", cls: "text-emerald-400" },
  { text: "[✔] nginx config writable", cls: "text-emerald-400" },
  { text: "$ versiongate deploy api-backend", cls: "text-foreground" },
  { text: "[INFO] building slot green…", cls: "text-muted-foreground" },
  { text: "[INFO] health check passed :3101", cls: "text-emerald-400" },
  { text: "[INFO] traffic switched — zero downtime", cls: "text-emerald-400" },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="features" />

      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex border border-border bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                v1.0 · Stable · MIT Licensed
              </div>
              <h1 className="text-4xl font-bold uppercase leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Command
                <br />
                The Cluster.
              </h1>
              <p className="mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground">
                Self-hosted zero-downtime Docker deploys on your own server. Git-backed workflows, blue-green routing,
                and built-in health checks — without cloud lock-in.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="#get-started"
                  className="bg-primary px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-primary-foreground transition hover:opacity-90"
                >
                  Get Started
                </Link>
                <Link
                  href="/docs"
                  className="border border-border px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-foreground transition hover:bg-muted"
                >
                  Documentation
                </Link>
              </div>
            </div>

            <div className="border border-border bg-terminal">
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  deploy / api-backend
                </span>
                <span className="font-mono text-[10px] uppercase text-emerald-400">Live</span>
              </div>
              <div className="space-y-1.5 p-4 font-mono text-[12px] leading-relaxed">
                {TERMINAL_LINES.map((l, i) => (
                  <div key={i} className={l.cls}>
                    {l.text}
                  </div>
                ))}
              </div>
              <div className="border-t border-border px-4 py-3">
                <div className="mb-1 flex justify-between font-mono text-[10px] uppercase text-muted-foreground">
                  <span>Progress</span>
                  <span>87%</span>
                </div>
                <div className="h-1 bg-muted">
                  <div className="h-full w-[87%] bg-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-border sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="px-4 py-8 text-center sm:px-6">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="mt-2 text-2xl font-bold tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12">
            <h2 className="text-2xl font-bold uppercase tracking-tight">Built for Production</h2>
            <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Enterprise deployment features for individual servers
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <article key={f.mod} className="relative border border-border bg-card p-6">
                <span className="absolute right-4 top-4 font-mono text-[10px] text-muted-foreground">{f.mod}</span>
                <h3 className="mb-2 font-mono text-xs uppercase tracking-wider">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture — expanded */}
      <section id="architecture" className="border-y border-border bg-card py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Architecture</p>
            <h2 className="text-2xl font-bold uppercase tracking-tight">How VersionGate Works</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              A Fastify API plus background worker, backed by PostgreSQL. The engine orchestrates Docker builds and
              Nginx upstream rewrites — deploys always target the idle blue/green slot so live traffic never hits a
              cold container.
            </p>
          </div>

          {/* Component grid */}
          <div className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COMPONENTS.map((c) => (
              <div key={c.tag} className="border border-border bg-background p-5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{c.tag}</span>
                <h3 className="mt-2 font-mono text-xs uppercase tracking-wider">{c.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{c.text}</p>
              </div>
            ))}
          </div>

          {/* Request flow diagram */}
          <div className="mb-16 grid gap-6 lg:grid-cols-2">
            <div className="border border-border bg-terminal p-5 font-mono text-[11px] leading-relaxed">
              <p className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">Request flow</p>
              <p className="text-muted-foreground"># incoming deploy trigger</p>
              <p className="mt-1 text-foreground">GitHub webhook / POST /api/v1/deploy</p>
              <p className="mt-3 text-muted-foreground">↓</p>
              <p className="text-foreground">Fastify router → controller → service</p>
              <p className="mt-3 text-muted-foreground">↓</p>
              <p className="text-foreground">Prisma (state lock) + Job queue enqueue</p>
              <p className="mt-3 text-muted-foreground">↓</p>
              <p className="text-foreground">Worker: git pull → docker build → docker run</p>
              <p className="mt-3 text-muted-foreground">↓</p>
              <p className="text-emerald-400">Health check PASS → nginx upstream rewrite</p>
              <p className="mt-3 text-muted-foreground">↓</p>
              <p className="text-foreground">WebSocket log stream → Dashboard UI</p>
            </div>

            <div className="border border-border bg-terminal p-5 font-mono text-[11px] leading-relaxed">
              <p className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">Blue-green slots</p>
              <p className="text-muted-foreground"># per environment (e.g. production)</p>
              <p className="mt-2 text-foreground">slot_blue  :3100  [idle · waiting]</p>
              <p className="text-emerald-400">slot_green :3101  [active · serving traffic]</p>
              <p className="mt-4 text-muted-foreground"># nginx upstream (live)</p>
              <p className="text-foreground">proxy_pass http://127.0.0.1:3101;</p>
              <p className="mt-4 text-muted-foreground"># next deploy targets :3100</p>
              <p className="text-foreground">build → health → switch → retire green</p>
              <p className="mt-4 text-muted-foreground"># status lifecycle</p>
              <p className="text-foreground">PENDING → DEPLOYING → ACTIVE</p>
              <p className="text-amber-400">         └→ FAILED (rollback available)</p>
            </div>
          </div>

          {/* Pipeline steps */}
          <div className="mb-16">
            <h3 className="mb-6 font-mono text-xs uppercase tracking-wider">Deployment Pipeline</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PIPELINE_STEPS.map((s) => (
                <div key={s.step} className="flex gap-4 border border-border bg-background p-4">
                  <span className="shrink-0 font-mono text-lg font-bold text-muted-foreground">{s.step}</span>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-wider">{s.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Crash recovery + promotion */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="border border-border bg-background p-6">
              <h3 className="font-mono text-xs uppercase tracking-wider">Crash Recovery</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                On startup, reconciliation scans for deployments stuck in <code className="border border-border bg-muted px-1 font-mono text-xs">DEPLOYING</code>,
                stops orphaned containers, and marks them <code className="border border-border bg-muted px-1 font-mono text-xs">FAILED</code>.
                Active deployments are verified against <code className="border border-border bg-muted px-1 font-mono text-xs">docker inspect</code> — if the
                container is not running, state is corrected before the engine accepts requests.
              </p>
              <ul className="mt-4 space-y-2 font-mono text-xs text-muted-foreground">
                <li className="flex gap-2"><span className="text-foreground">→</span> Job queue survives worker restarts</li>
                <li className="flex gap-2"><span className="text-foreground">→</span> Automatic rollback on failed health checks</li>
                <li className="flex gap-2"><span className="text-foreground">→</span> Encrypted env vars persisted across reboots</li>
              </ul>
            </div>

            <div className="border border-border bg-background p-6">
              <h3 className="font-mono text-xs uppercase tracking-wider">Environment Promotion</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                New projects get development, staging, and production environments on separate host port ranges.
                Deploy to the first stage for a fresh build; <strong className="text-foreground">Promote</strong> reuses
                the upstream Docker image on the next stage without rebuilding.
              </p>
              <div className="mt-4 border border-border bg-terminal p-4 font-mono text-[11px] leading-relaxed">
                <p className="text-muted-foreground">dev :3000–3001</p>
                <p className="text-muted-foreground">  ↓ promote (reuse image)</p>
                <p className="text-muted-foreground">staging :3010–3011</p>
                <p className="text-muted-foreground">  ↓ promote (reuse image)</p>
                <p className="text-emerald-400">production :3100–3101  [live traffic]</p>
              </div>
              <Link
                href="/docs/architecture"
                className="mt-4 inline-flex font-mono text-[10px] uppercase tracking-wider text-foreground underline underline-offset-4 hover:opacity-80"
              >
                Full architecture docs →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Get Started */}
      <section id="get-started" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Get Started</p>
            <h2 className="text-2xl font-bold uppercase tracking-tight">Running in Under 5 Minutes</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              You need Bun, Docker, PostgreSQL, Nginx, and Git on a Linux VPS. The setup wizard handles database
              migrations, encryption keys, and Nginx configuration — no manual <code className="border border-border bg-muted px-1 font-mono text-xs">.env</code> editing required.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {GET_STARTED_STEPS.map((s) => (
              <div key={s.step} className="border border-border bg-card">
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                  <span className="font-mono text-lg font-bold text-muted-foreground">{s.step}</span>
                  <h3 className="font-mono text-xs uppercase tracking-wider">{s.title}</h3>
                </div>
                <pre className="overflow-x-auto bg-terminal p-4 font-mono text-[11px] leading-relaxed text-foreground/90">
                  {s.code}
                </pre>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href={GITHUB_REPO}
              className="bg-primary px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-primary-foreground transition hover:opacity-90"
            >
              Clone on GitHub
            </Link>
            <Link
              href="/docs/quick-start"
              className="border border-border px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-foreground transition hover:bg-muted"
            >
              Full Quick Start Guide
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
