import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const GITHUB_REPO = "https://github.com/dinexh/VersionGate";

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth="1.7">
        <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m13.4-6.4-2.1 2.1M9.7 14.3l-2.1 2.1m0-8.8 2.1 2.1m4.6 4.6 2.1 2.1" strokeLinecap="round" />
      </svg>
    ),
    title: "Zero-Downtime Deploys",
    text: "Seamless swaps between blue and green slots. Nginx traffic only switches once the new container passes health checks.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth="1.7">
        <path d="M7 8l-4 4 4 4m10-8 4 4-4 4M14 4l-4 16" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Git-Backed Workflow",
    text: "Connect the GitHub App, pick a repo and branch, and every push auto-deploys. Signed webhooks, no manual URLs.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth="1.7">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Self-Hosted Control",
    text: "Your VPS, your data. Postgres state, Docker containers, and encrypted secrets never leave your server.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth="1.7">
        <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3z" strokeLinejoin="round" />
        <path d="M19 16l.9 2.6L22.5 19l-2.6.9L19 22.5l-.9-2.6L15.5 19l2.6-.4L19 16z" strokeLinejoin="round" />
      </svg>
    ),
    title: "AI-Powered CI",
    text: "Generate a GitHub Actions pipeline for any project with one API call, powered by Gemini. Optional and bring-your-own-key.",
  },
] as const;

const CHECKLIST = [
  "Built-in job queue & live log streaming",
  "Automatic rollback on failed deploys",
  "Crash recovery reconciles state on restart",
] as const;

const CLI_LINES = [
  { text: "$ bun run preflight", cls: "text-white" },
  { text: "[✔] docker daemon reachable", cls: "text-emerald-400" },
  { text: "[✔] versiongate-net network exists", cls: "text-emerald-400" },
  { text: "[✔] nginx config writable", cls: "text-emerald-400" },
  { text: "$ pm2 start ecosystem.config.cjs", cls: "text-white" },
  { text: "VersionGate ▸ engine listening on :9090", cls: "text-sky-300" },
  { text: "VersionGate ▸ reconciliation complete", cls: "text-sky-300" },
  { text: "VersionGate ▸ ready — open /setup", cls: "text-emerald-400" },
] as const;

const PRICING_FEATURES = [
  "Unlimited projects",
  "Zero-downtime deploys",
  "GitHub App integration",
  "Environment promotion chain",
  "Community support",
] as const;

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5 shrink-0 text-success" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
      <path d="M8.5 12.2l2.3 2.3 4.7-4.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="features" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% -10%, #dbe7ff 0%, rgba(219,231,255,0.35) 45%, transparent 75%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 pb-10 pt-16 text-center sm:px-6 sm:pt-24">
          <div className="animate-fade-up mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5 font-mono text-[11px] font-medium tracking-wide text-muted-foreground shadow-sm">
            <span className="size-1.5 rounded-full bg-success animate-pulse-dot" />
            v1.0 · STABLE · MIT LICENSED
          </div>
          <h1 className="animate-fade-up text-4xl font-bold leading-[1.12] tracking-tight sm:text-6xl">
            Self-hosted zero-downtime Docker deploys on{" "}
            <span className="text-primary">your own server.</span>
          </h1>
          <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg [animation-delay:80ms]">
            The power of Vercel-style workflows without the cloud lock-in. Git-backed,
            blue-green routing, and built-in health checks for your VPS.
          </p>
          <div className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3 [animation-delay:140ms]">
            <Link
              href={GITHUB_REPO}
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition hover:opacity-90"
            >
              Get Started for Free
            </Link>
            <Link
              href="/docs"
              className="rounded-full border border-border bg-white px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
            >
              View Documentation
            </Link>
          </div>
        </div>

        {/* Blue-green slot strip (mirrors real dashboard slot badges) */}
        <div className="relative mx-auto max-w-5xl px-4 pb-20 sm:px-6">
          <div className="animate-fade-up rounded-2xl border border-border bg-white p-4 shadow-xl shadow-primary/5 sm:p-6 [animation-delay:200ms]">
            <div className="mb-4 flex items-center justify-between px-1">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                projects / api-backend / production
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-success">
                <span className="size-1.5 rounded-full bg-success animate-pulse-dot" />
                LIVE
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Project</div>
                <div className="mt-2 text-lg font-semibold">api-backend</div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">main · webhook auto-deploy</div>
              </div>
              <div className="rounded-xl border-2 border-primary bg-primary-soft/60 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-primary">Active</div>
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">:3101</span>
                </div>
                <div className="mt-2 text-lg font-semibold text-primary">Slot Green</div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">v2.0.4 · healthy · serving traffic</div>
              </div>
              <div className="rounded-xl border border-dashed border-border bg-white p-5">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Stand by</div>
                  <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">:3100</span>
                </div>
                <div className="mt-2 text-lg font-semibold text-muted-foreground">Slot Blue</div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">idle · waiting for next deploy</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Built for Production Scale</h2>
            <p className="mt-3 text-muted-foreground">
              Enterprise-grade deployment features, simplified for individual servers and small clusters.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <article key={f.title} className="rounded-2xl border border-border bg-white p-6 transition hover:shadow-md hover:shadow-primary/5">
                <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                  {f.icon}
                </div>
                <h3 className="mb-2 font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* High availability */}
      <section className="py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">
              Architecture
            </div>
            <h2 className="text-3xl font-bold leading-tight tracking-tight">
              Built for High-Availability
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              VersionGate orchestrates Docker containers using blue-green slots and Nginx upstream
              rewrites. Deploys target the idle slot — live traffic never moves until the new
              container is confirmed healthy.
            </p>
            <ul className="mt-6 space-y-3">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium">
                  <CheckIcon />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-border shadow-lg shadow-primary/5">
              <div className="flex items-center gap-2 bg-navy px-4 py-2.5">
                <span className="size-2.5 rounded-full bg-red-400/90" />
                <span className="size-2.5 rounded-full bg-amber-300/90" />
                <span className="size-2.5 rounded-full bg-emerald-400/90" />
                <span className="ml-2 font-mono text-[11px] text-white/50">Command Line Interface</span>
              </div>
              <div className="space-y-1.5 bg-terminal p-5 font-mono text-[12.5px] leading-relaxed">
                {CLI_LINES.map((l, i) => (
                  <div key={i} className={l.cls}>
                    {l.text}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-white p-5">
                <h3 className="mb-1.5 text-sm font-semibold">Built-in Metrics</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Host CPU, memory, disk, and per-project deploy history right in the dashboard.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-white p-5">
                <h3 className="mb-1.5 text-sm font-semibold">Encrypted Secrets</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Project env vars encrypted at rest with AES-256. Keys never leave your server.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Simple, Transparent Pricing</h2>
            <p className="mt-3 text-muted-foreground">
              We believe in the power of open-source. Start self-hosting today.
            </p>
          </div>
          <div className="mx-auto max-w-md">
            <div className="relative rounded-3xl border-2 border-primary bg-white p-8 shadow-xl shadow-primary/10">
              <span className="absolute -top-3.5 right-8 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                Recommended
              </span>
              <div className="font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">
                Open Source
              </div>
              <div className="mt-1 text-sm text-muted-foreground">Self-hosted</div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-bold tracking-tight">$0</span>
                <span className="text-muted-foreground">/ forever</span>
              </div>
              <ul className="mt-6 space-y-3">
                {PRICING_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm font-medium">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={GITHUB_REPO}
                className="mt-8 block rounded-full bg-primary py-3 text-center text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:opacity-90"
              >
                Install Now
              </Link>
              <p className="mt-4 text-center font-mono text-[11px] text-muted-foreground">
                git clone github.com/dinexh/VersionGate
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dark CTA */}
      <section className="bg-navy py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to reclaim your servers?
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-white/60">
            Stop paying for cloud overhead. Get the Vercel developer experience on your own
            hardware in under 5 minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={GITHUB_REPO}
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-navy transition hover:bg-white/90"
            >
              Get Started for Free
            </Link>
            <Link
              href="/docs/quick-start"
              className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60"
            >
              Read the Quick Start
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
