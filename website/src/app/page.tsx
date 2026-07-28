"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CapabilityGrid } from "@/components/capability-grid";
import { ExecutionSandbox } from "@/components/execution-sandbox";
import { TopologyVisualizer } from "@/components/topology-visualizer";
import { CostCalculator } from "@/components/cost-calculator";
import { CommunityQnA } from "@/components/community-qna";

const GITHUB_REPO = "https://github.com/dineshkorukonda/VersionGate";

const QUICK_STATS = [
  { label: "WARM ROLLBACK", value: "< 2 SEC", desc: "Local image warm swap" },
  { label: "ZERO DOWNTIME", value: "0 MS", desc: "Atomic Nginx rewrite" },
  { label: "SLOT ARCHITECTURE", value: "BLUE / GREEN", desc: "Isolated port allocation" },
  { label: "INFRASTRUCTURE", value: "100% SELF-HOSTED", desc: "On-premise Postgres & Redis" },
] as const;

export default function Home() {
  const [copiedInstall, setCopiedInstall] = useState(false);

  const handleCopyInstall = () => {
    navigator.clipboard.writeText("npx versiongate init");
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white bg-tech-grid">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative border-b border-zinc-800/80 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-12">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-3 rounded border border-zinc-700/80 bg-zinc-900/80 px-3 py-1 font-mono text-xs text-zinc-300">
              <span className="font-bold text-white">Engine Release</span>
              <span>VersionGate v1.4 Stable</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-[1.05]">
              Command the Cluster.
            </h1>

            <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 font-mono">
              Self-hosted zero-downtime deployment engine for your VPS. Blue-green slot swaps, instant warm-swap rollbacks, path-based stage routing, and Bearer token CI/CD pipelines.
            </p>

            {/* Quick Install Command Box */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center rounded border border-zinc-700 bg-zinc-900/90 px-4 py-3 font-mono text-xs text-zinc-200">
                <span className="text-zinc-500 mr-2">$</span>
                <span className="font-bold text-white">npx versiongate init</span>
                <button
                  onClick={handleCopyInstall}
                  className="ml-4 font-mono text-[10px] text-emerald-400 font-bold hover:underline"
                >
                  {copiedInstall ? "[ Copied! ]" : "[ Copy ]"}
                </button>
              </div>

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
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-4 border-t border-zinc-800/80">
            {QUICK_STATS.map((s) => (
              <div key={s.label} className="space-y-1">
                <p className="font-mono text-[10px] uppercase text-zinc-500">{s.label}</p>
                <p className="text-2xl font-black tracking-tight text-white font-mono">{s.value}</p>
                <p className="text-xs text-zinc-400 font-mono">[ {s.desc} ]</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Execution Sandbox */}
      <section id="sandbox" className="border-b border-zinc-800/80 py-20 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 font-mono text-[10px] font-bold text-zinc-300">
              <span>Interactive CLI & API Sandbox</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Live Execution Matrix</h2>
            <p className="mt-1 font-mono text-xs text-zinc-400">
              Test execution scenarios and inspect real-time log outputs and JSON payloads.
            </p>
          </div>

          <ExecutionSandbox />
        </div>
      </section>

      {/* Capability Cards Directory (skills.sh style) */}
      <section id="capabilities" className="border-b border-zinc-800/80 py-20 bg-zinc-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 font-mono text-[10px] font-bold text-zinc-300">
              <span>Capability Directory</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Engine Capabilities & CLI Commands</h2>
            <p className="mt-1 font-mono text-xs text-zinc-400">
              Filter by capability category and copy CLI commands directly.
            </p>
          </div>

          <CapabilityGrid />
        </div>
      </section>

      {/* Infrastructure Node Topology Visualizer */}
      <section id="architecture" className="border-b border-zinc-800/80 py-20 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 font-mono text-[10px] font-bold text-zinc-300">
              <span>Architecture Pipeline</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Infrastructure Topology Map</h2>
            <p className="mt-1 font-mono text-xs text-zinc-400">
              Trace request ingestion from git webhooks to atomic Nginx upstream reloads.
            </p>
          </div>

          <TopologyVisualizer />
        </div>
      </section>

      {/* Interactive VPS Cost Calculator */}
      <section id="calculator" className="border-b border-zinc-800/80 py-20 bg-zinc-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 font-mono text-[10px] font-bold text-zinc-300">
              <span>Cost Calculator</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Self-Hosted Infrastructure ROI</h2>
            <p className="mt-1 font-mono text-xs text-zinc-400">
              Calculate annual savings compared to expensive cloud PaaS vendor lock-in.
            </p>
          </div>

          <CostCalculator />
        </div>
      </section>

      {/* Community Q&A Knowledge Base (Stack Overflow Style) */}
      <section id="qna" className="border-b border-zinc-800/80 py-20 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 font-mono text-[10px] font-bold text-zinc-300">
              <span>Community Q&A & Troubleshooting</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Knowledge Base & Verified Solutions</h2>
            <p className="mt-1 font-mono text-xs text-zinc-400">
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
