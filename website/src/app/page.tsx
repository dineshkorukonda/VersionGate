"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CapabilityGrid } from "@/components/capability-grid";
import { ExecutionSandbox } from "@/components/execution-sandbox";
import { TopologyVisualizer } from "@/components/topology-visualizer";
import { CommunityQnA } from "@/components/community-qna";

const GITHUB_REPO = "https://github.com/dineshkorukonda/VersionGate";

const QUICK_STATS = [
  { label: "WARM ROLLBACK", value: "< 2 SEC", desc: "Local image warm swap" },
  { label: "ZERO DOWNTIME", value: "0 MS", desc: "Atomic Nginx rewrite" },
  { label: "SLOT ARCHITECTURE", value: "BLUE / GREEN", desc: "Isolated port allocation" },
  { label: "INFRASTRUCTURE", value: "100% SELF-HOSTED", desc: "On-premise Postgres & Redis" },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground bg-grid-pattern transition-colors">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative border-b border-border py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-12">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-border bg-muted/60 px-3 py-1 font-mono text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Engine Release</span>
              <span>VersionGate v1.4 Stable</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-[1.05] text-foreground">
              Command the Cluster.
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground font-sans">
              Self-hosted zero-downtime deployment engine for your VPS. Blue-green slot swaps, instant warm-swap rollbacks, path-based stage routing, and Bearer token CI/CD pipelines.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/docs"
                className="rounded-md bg-primary px-6 py-3 font-sans text-xs font-semibold text-primary-foreground transition hover:opacity-90 shadow-sm"
              >
                Read Documentation
              </Link>
              <Link
                href={GITHUB_REPO}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-border bg-card px-6 py-3 font-sans text-xs font-semibold text-foreground transition hover:bg-muted"
              >
                GitHub Repository
              </Link>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-6 border-t border-border">
            {QUICK_STATS.map((s) => (
              <div key={s.label} className="space-y-1">
                <p className="font-mono text-[10px] uppercase text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-black tracking-tight text-foreground font-sans">{s.value}</p>
                <p className="text-xs text-muted-foreground font-mono">[ {s.desc} ]</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Execution Sandbox */}
      <section id="sandbox" className="border-b border-border py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded border border-border bg-muted px-2.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
              <span>Interactive CLI & API Sandbox</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">Live Execution Matrix</h2>
            <p className="mt-1 font-sans text-xs text-muted-foreground">
              Test execution scenarios and inspect real-time log outputs and JSON payloads.
            </p>
          </div>

          <ExecutionSandbox />
        </div>
      </section>

      {/* Capability Cards Directory */}
      <section id="capabilities" className="border-b border-border py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded border border-border bg-muted px-2.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
              <span>Capability Directory</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">Engine Capabilities & CLI Commands</h2>
            <p className="mt-1 font-sans text-xs text-muted-foreground">
              Filter by capability category and inspect specification details.
            </p>
          </div>

          <CapabilityGrid />
        </div>
      </section>

      {/* Infrastructure Node Topology Visualizer */}
      <section id="architecture" className="border-b border-border py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded border border-border bg-muted px-2.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
              <span>Architecture Pipeline</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">Infrastructure Topology Map</h2>
            <p className="mt-1 font-sans text-xs text-muted-foreground">
              Trace request ingestion from git webhooks to atomic Nginx upstream reloads.
            </p>
          </div>

          <TopologyVisualizer />
        </div>
      </section>

      {/* Community Q&A Knowledge Base */}
      <section id="qna" className="border-b border-border py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded border border-border bg-muted px-2.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
              <span>Community Q&A & Troubleshooting</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">Knowledge Base & Verified Solutions</h2>
            <p className="mt-1 font-sans text-xs text-muted-foreground">
              StackOverflow-style technical Q&A threads with code snippets and upvoted solutions.
            </p>
          </div>

          <CommunityQnA />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
