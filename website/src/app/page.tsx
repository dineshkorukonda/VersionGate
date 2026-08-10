"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CapabilityGrid } from "@/components/capability-grid";
import { ExecutionSandbox } from "@/components/execution-sandbox";
import { TopologyVisualizer } from "@/components/topology-visualizer";
import { CommunityQnA } from "@/components/community-qna";
import { HeroDeployVisual } from "@/components/hero-deploy-visual";

const GITHUB_REPO = "https://github.com/dineshkorukonda/VersionGate";
const INSTALL_CMD = "curl -fsSL https://versiongate.tech/install.sh | sudo bash";

const LOOP = [
  {
    step: "01",
    label: "Build",
    title: "Idle slot compilation",
    body: "Pull the commit, build on the idle blue or green slot, and keep live traffic on the active upstream.",
  },
  {
    step: "02",
    label: "Prove",
    title: "Health-gated promotion",
    body: "Hit the container health endpoint on the isolated host port. No rewrite until the new revision answers clean.",
  },
  {
    step: "03",
    label: "Swap",
    title: "Atomic Nginx rewrite",
    body: "Reload upstream mapping in place. Request loss stays at zero while the previous slot stays warm.",
  },
  {
    step: "04",
    label: "Recover",
    title: "Warm-swap rollback",
    body: "Reuse the cached image on the sibling slot. Rollbacks land in under two seconds without a rebuild.",
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen landing-atmosphere text-foreground transition-colors">
      <SiteHeader />

      {/* Hero — brand first, one composition, full-bleed visual */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0">
          <HeroDeployVisual />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20 lg:via-background/70 lg:to-transparent" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-7xl items-center px-4 py-20 sm:px-6 lg:min-h-[92vh]">
          <div className="max-w-xl landing-fade-up">
            <p className="font-display landing-hero-brand text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              VersionGate
            </p>
            <h1 className="mt-5 max-w-xl font-display text-2xl font-medium leading-snug tracking-tight text-foreground/90 sm:text-3xl lg:text-[2rem]">
              Zero-downtime Docker deploys on metal you control.
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Self-hosted blue-green engine. Push to GitHub — we build, health-check, and swap traffic with zero downtime.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/docs"
                className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Read documentation
              </Link>
              <Link
                href={GITHUB_REPO}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-border bg-background/50 px-5 py-2.5 text-sm font-semibold text-foreground backdrop-blur-sm transition hover:bg-muted"
              >
                GitHub repository
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem narrative */}
      <section className="border-b border-border py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="landing-eyebrow">The gap</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Shipping got fast. Recovery stayed manual.
          </h2>
          <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              CI/CD solved the push problem. Images land constantly, manifests churn, and every VPS becomes a miniature
              fleet. What did not improve is the moment after a bad deploy — when traffic is already wrong and the
              previous revision is a rebuild away.
            </p>
            <p>
              Flat restart scripts treat a CSS tweak like a schema migration. Dashboards fire the same alarm for both,
              or miss the outage entirely while someone digs for the last known-good tag.
            </p>
            <p className="text-foreground/90">
              VersionGate is different. It keeps two slots warm, proves the next revision before the rewrite, and
              makes rollback a local image swap — not a prayer and a rebuild.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture loop */}
      <section id="architecture-loop" className="border-b border-border py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="landing-eyebrow">Architecture</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Four steps. One blue-green loop.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              From idle-slot build to warm-swap recovery, VersionGate executes with slot isolation and atomic upstream
              rewrites.
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {LOOP.map((item) => (
              <article key={item.step} className="bg-card p-6 sm:p-7">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-xs text-primary">{item.step} //</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {item.label}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Live sandbox */}
      <section id="sandbox" className="border-b border-border py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          <div className="max-w-2xl">
            <p className="landing-eyebrow">Simulator</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Watch a deploy, rollback, and token flow.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Switch scenarios and inspect the same log grammar and JSON payloads the engine emits in production.
            </p>
          </div>
          <ExecutionSandbox />
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="border-b border-border bg-muted/20 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          <div className="max-w-2xl">
            <p className="landing-eyebrow">Capabilities</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Engine surface area, command-ready.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Filter by category and copy the CLI that drives each capability.
            </p>
          </div>
          <CapabilityGrid />
        </div>
      </section>

      {/* Topology */}
      <section id="architecture" className="border-b border-border py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          <div className="max-w-2xl">
            <p className="landing-eyebrow">Pipeline</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              From signed webhook to Nginx reload.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Trace ingestion through Redis locks, idle-slot builds, health gates, and atomic upstream swaps.
            </p>
          </div>
          <TopologyVisualizer />
        </div>
      </section>

      {/* Install — two commands */}
      <section id="install" className="border-b border-border py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="landing-eyebrow">Install</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              One host. One command. Your metal.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Bootstrap Docker, Bun, firewall rules, and Setup Mode on a fresh VPS — then wire GitHub and ship.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                <span className="font-mono text-xs text-muted-foreground">install.sh</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">Step 1 of 2</span>
              </div>
              <pre className="mt-4 overflow-x-auto font-mono text-[13px] leading-relaxed text-foreground">
                <code>{INSTALL_CMD}</code>
              </pre>
              <p className="mt-4 text-sm text-muted-foreground">
                Installs host packages, configures ports 80/443/9090/5173, and launches Setup Mode.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                <span className="font-mono text-xs text-muted-foreground">deploy.yml</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">Step 2 of 2</span>
              </div>
              <pre className="mt-4 overflow-x-auto font-mono text-[13px] leading-relaxed text-foreground">
                <code>{`# GitHub Actions
- name: Deploy via VersionGate
  run: |
    curl -X POST "$VG_URL/api/v1/deploy" \\
      -H "Authorization: Bearer $VG_TOKEN" \\
      -H "Content-Type: application/json" \\
      -d '{"project":"web-app","env":"production"}'`}</code>
              </pre>
              <p className="mt-4 text-sm text-muted-foreground">
                Trigger deploys with Bearer tokens — no session cookies, no dashboard click required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community */}
      <section id="qna" className="border-b border-border bg-muted/20 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          <div className="max-w-2xl">
            <p className="landing-eyebrow">Knowledge base</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Verified answers from the field.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Troubleshooting threads with concrete snippets for proxy paths, rollbacks, and token scopes.
            </p>
          </div>
          <CommunityQnA />
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-b border-border py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="landing-eyebrow">Start small</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Start with one service. One deploy window. See what zero downtime feels like on your own host.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Open documentation · Self-hosted installer · Live decision traces in the dashboard
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs/quick-start"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Quick start
            </Link>
            <Link
              href="/changelog"
              className="rounded-md border border-border bg-card/40 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Changelog
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
