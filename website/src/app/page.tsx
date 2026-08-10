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
    <div className="landing-shell min-h-screen">
      <div className="border-b border-[#3effa8] bg-[#3effa8]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <p className="font-mono text-[11px] font-semibold tracking-[0.08em] text-black">
            Self-hosted zero-downtime Docker deploys on metal you control
          </p>
          <Link
            href="/docs/quick-start"
            className="shrink-0 font-mono text-[11px] font-semibold tracking-[0.12em] text-black underline-offset-2 hover:underline"
          >
            QUICK START →
          </Link>
        </div>
      </div>

      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <HeroDeployVisual />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent lg:via-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 lg:hidden" />

        <div className="relative mx-auto flex min-h-[100vh] max-w-7xl items-center px-4 pb-28 pt-28 sm:px-6 lg:pb-24 lg:pt-32">
          <div className="max-w-xl landing-fade-up lg:max-w-[34rem]">
            <p className="font-display text-[clamp(3.4rem,9vw,6.5rem)] font-bold uppercase leading-[0.9] tracking-[-0.05em] text-white">
              Version
              <br />
              Gate
            </p>
            <h1 className="mt-8 max-w-lg font-display text-[clamp(1.35rem,2.6vw,1.85rem)] font-medium uppercase leading-[1.15] tracking-[-0.02em] text-white">
              Zero-downtime deploys that keep a warm slot ready.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/60">
              Push to GitHub. VersionGate builds on the idle slot, proves health, then rewrites Nginx — with rollback as a local image swap.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/docs"
                className="bg-[#3effa8] px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110"
              >
                Read documentation
              </Link>
              <Link
                href={GITHUB_REPO}
                target="_blank"
                rel="noreferrer"
                className="border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
              >
                GitHub repository
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem — typographic, long breath */}
      <section className="border-t border-white/10 py-28 sm:py-36">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="landing-eyebrow">The gap</p>
          <h2 className="landing-headline mt-6 text-[clamp(2rem,5vw,3.4rem)] text-white">
            Shipping got fast.
            <br />
            Recovery stayed manual.
          </h2>
          <div className="landing-prose mt-10 space-y-6">
            <p>
              CI/CD solved the push problem. Images land constantly, manifests churn, and every VPS becomes a miniature fleet. What did not improve is the moment after a bad deploy — when traffic is already wrong and the previous revision is a rebuild away.
            </p>
            <p>
              Flat restart scripts treat a CSS tweak like a schema migration. Dashboards fire the same alarm for both, or miss the outage entirely while someone digs for the last known-good tag.
            </p>
            <p className="emphasis">
              VersionGate is different. It keeps two slots warm, proves the next revision before the rewrite, and makes rollback a local image swap — not a prayer and a rebuild.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture-loop" className="border-t border-white/10 py-28 sm:py-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="landing-eyebrow">Architecture</p>
            <h2 className="landing-headline mt-6 text-[clamp(2rem,4.5vw,3.1rem)] text-white">
              Four steps.
              <br />
              One blue-green loop.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/55">
              From idle-slot build to warm-swap recovery — slot isolation, health gates, atomic upstream rewrites.
            </p>
          </div>

          <div className="mt-16 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {LOOP.map((item) => (
              <article key={item.step} className="bg-black p-7 sm:p-8">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-xs text-[#3effa8]">{item.step} //</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                    {item.label}
                  </span>
                </div>
                <h3 className="mt-8 font-display text-lg font-semibold uppercase tracking-[-0.02em] text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/50">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Deep dive feature strip */}
      <section className="border-t border-white/10 py-28 sm:py-36">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <p className="landing-eyebrow">Warm swap</p>
            <h2 className="landing-headline mt-6 text-[clamp(1.8rem,3.8vw,2.7rem)] text-white">
              The rollback that already has the image.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/55">
              Other tools rebuild to go back. VersionGate keeps the previous slot warm and flips upstream when health says so — usually under two seconds.
            </p>
          </div>
          <div className="border border-white/10 bg-[#050505] p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono text-[11px]">
              <span className="text-white/45">rollback stream</span>
              <span className="text-[#3effa8]">1.48s</span>
            </div>
            <div className="mt-4 space-y-2 font-mono text-[12px] leading-relaxed text-white/65">
              <p>[ INFO ] Rollback → commit 3a1f8b</p>
              <p>[ OK ] Cache hit versiongate-web-app:v13</p>
              <p>[ WARN-SWAP ] Skip rebuild</p>
              <p>[ OK ] Health 200 · 8ms</p>
              <p className="text-[#3effa8]">[ OK ] Upstream → BLUE · warm-swap complete</p>
            </div>
          </div>
        </div>
      </section>

      {/* Simulator */}
      <section id="sandbox" className="border-t border-white/10 py-28 sm:py-36">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="landing-eyebrow">Simulator</p>
            <h2 className="landing-headline mt-6 text-[clamp(1.8rem,3.8vw,2.7rem)] text-white">
              Watch a deploy, rollback, and token flow.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/55">
              Same log grammar and JSON payloads the engine emits in production.
            </p>
          </div>
          <ExecutionSandbox />
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="border-t border-white/10 bg-white/[0.02] py-28 sm:py-36">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="landing-eyebrow">Capabilities</p>
            <h2 className="landing-headline mt-6 text-[clamp(1.8rem,3.8vw,2.7rem)] text-white">
              Engine surface area, command-ready.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/55">
              Filter by category and copy the CLI that drives each capability.
            </p>
          </div>
          <CapabilityGrid />
        </div>
      </section>

      {/* Pipeline */}
      <section id="architecture" className="border-t border-white/10 py-28 sm:py-36">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="landing-eyebrow">Pipeline</p>
            <h2 className="landing-headline mt-6 text-[clamp(1.8rem,3.8vw,2.7rem)] text-white">
              From signed webhook to Nginx reload.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/55">
              Trace ingestion through Redis locks, idle-slot builds, health gates, and atomic upstream swaps.
            </p>
          </div>
          <TopologyVisualizer />
        </div>
      </section>

      {/* Install */}
      <section id="install" className="border-t border-white/10 py-28 sm:py-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="landing-eyebrow">Install</p>
            <h2 className="landing-headline mt-6 text-[clamp(1.8rem,3.8vw,2.7rem)] text-white">
              Two files.
              <br />
              Zero rewrite.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/55">
              Bootstrap one host, then trigger deploys from CI with a Bearer token.
            </p>
          </div>

          <div className="mt-14 grid gap-4 lg:grid-cols-2">
            <div className="border border-white/10 bg-[#050505] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <span className="font-mono text-xs text-white/45">install.sh</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#3effa8]">
                  Step 1 of 2
                </span>
              </div>
              <pre className="mt-4 overflow-x-auto font-mono text-[13px] leading-relaxed text-white/85">
                <code>{INSTALL_CMD}</code>
              </pre>
            </div>

            <div className="border border-white/10 bg-[#050505] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <span className="font-mono text-xs text-white/45">deploy.yml</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#3effa8]">
                  Step 2 of 2
                </span>
              </div>
              <pre className="mt-4 overflow-x-auto font-mono text-[13px] leading-relaxed text-white/85">
                <code>{`curl -X POST "$VG_URL/api/v1/deploy" \\
  -H "Authorization: Bearer $VG_TOKEN" \\
  -d '{"project":"web-app","env":"production"}'`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* QnA */}
      <section id="qna" className="border-t border-white/10 bg-white/[0.02] py-28 sm:py-36">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="landing-eyebrow">Knowledge base</p>
            <h2 className="landing-headline mt-6 text-[clamp(1.8rem,3.8vw,2.7rem)] text-white">
              Verified answers from the field.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/55">
              Troubleshooting threads with concrete snippets for proxy paths, rollbacks, and token scopes.
            </p>
          </div>
          <CommunityQnA />
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/10 py-28 sm:py-40">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="landing-eyebrow">Start small</p>
          <h2 className="landing-headline mt-6 text-[clamp(1.9rem,4vw,3rem)] text-white">
            One service.
            <br />
            One deploy window.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/55">
            See what zero downtime feels like when rollback already has the image.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs/quick-start"
              className="bg-[#3effa8] px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110"
            >
              Quick start
            </Link>
            <Link
              href="/changelog"
              className="border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
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
