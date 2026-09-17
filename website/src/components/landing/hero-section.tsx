"use client";

import { useState } from "react";
import Link from "next/link";

const INSTALL_CMD = "curl -fsSL https://versiongate.tech/install.sh | sudo bash";

type PreviewTab = "slots" | "db" | "logs" | "telemetry";

export function HeroSection() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<PreviewTab>("slots");

  const copyInstall = () => {
    navigator.clipboard.writeText(INSTALL_CMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 lg:pt-24">
      {/* Subtle Background Glows & Grid */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-15" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 -translate-x-1/2 h-[500px] w-[800px] max-w-full rounded-full bg-primary/10 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Announcement Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/90 px-3.5 py-1.5 shadow-sm backdrop-blur transition-all hover:border-primary/50">
            <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-primary uppercase">
              NEW v2.9.5
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              In-Dashboard DB Studio &amp; Bare-Metal PM2 Engine
            </span>
            <Link
              href="/changelog"
              className="font-mono text-xs font-medium text-foreground hover:text-primary transition"
            >
              [ View Release &rarr; ]
            </Link>
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto mt-6 max-w-4xl font-mono text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Zero-Downtime Deploys.{" "}
            <span className="bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
              Self-Hosted Freedom.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Deploy Docker containers and host PM2 services directly to your own server.
            Git webhook builds, Blue/Green warm-swap slot routing, integrated database studio,
            and Certbot TLS — with zero vendor lock-in.
          </p>

          {/* Actions & Quick Install Box */}
          <div className="mx-auto mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <div className="flex w-full flex-wrap items-center justify-center gap-3 sm:w-auto">
              <Link
                href="#install"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 font-mono text-xs font-semibold uppercase tracking-wider text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-98"
              >
                [ Deploy Engine ]
              </Link>
              <Link
                href="/docs"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-6 font-mono text-xs font-semibold uppercase tracking-wider text-foreground transition hover:border-primary/60 hover:bg-zinc-900/40 active:scale-98"
              >
                [ Documentation ]
              </Link>
              <Link
                href="https://github.com/dineshkorukonda/VersionGate"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border/80 bg-zinc-950/60 px-4 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:border-border hover:text-foreground"
              >
                [ GitHub ]
              </Link>
            </div>
          </div>

          {/* One-Line Command Box */}
          <div className="mx-auto mt-6 max-w-xl">
            <div className="group relative flex items-center justify-between rounded-lg border border-border/80 bg-zinc-950/90 p-2.5 shadow-md">
              <div className="flex items-center gap-3 overflow-x-auto pl-2 font-mono text-xs text-zinc-300">
                <span className="text-primary select-none">$</span>
                <code className="whitespace-nowrap">{INSTALL_CMD}</code>
              </div>
              <button
                type="button"
                onClick={copyInstall}
                className="ml-3 shrink-0 rounded border border-border/60 bg-zinc-900/80 px-3 py-1 font-mono text-[11px] font-medium text-zinc-300 transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
              >
                {copied ? "[ COPIED ]" : "[ COPY ]"}
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Live Dashboard Preview Frame */}
        <div className="mt-14 rounded-xl border border-border/70 bg-zinc-950 shadow-2xl overflow-hidden">
          {/* Mac / Terminal Window Chrome */}
          <div className="flex flex-wrap items-center justify-between border-b border-border/70 bg-zinc-900/90 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-3 font-mono text-xs text-zinc-400">
                versiongate-dashboard // control-plane
              </span>
            </div>

            {/* Interactive Preview Tabs */}
            <div className="flex items-center gap-1 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("slots")}
                className={`rounded px-2.5 py-1 transition ${
                  activeTab === "slots"
                    ? "bg-zinc-800 text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                01 // Blue-Green Slots
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("db")}
                className={`rounded px-2.5 py-1 transition ${
                  activeTab === "db"
                    ? "bg-zinc-800 text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                02 // DB Studio
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("logs")}
                className={`rounded px-2.5 py-1 transition ${
                  activeTab === "logs"
                    ? "bg-zinc-800 text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                03 // Realtime Logs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("telemetry")}
                className={`rounded px-2.5 py-1 transition ${
                  activeTab === "telemetry"
                    ? "bg-zinc-800 text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                04 // Telemetry
              </button>
            </div>
          </div>

          {/* Tab View Content */}
          <div className="p-6 bg-zinc-950 font-mono text-xs">
            {activeTab === "slots" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-foreground">
                        api.versiongate.internal
                      </span>
                      <span className="border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        [ TRAFFIC LIVE ]
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Git Ref: refs/heads/main &middot; Commit: 55244e0 &middot; Target: Production
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="border border-border/80 px-2 py-1 text-[11px] text-zinc-400">
                      Upstream: 127.0.0.1:3001
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Slot A - Blue */}
                  <div className="rounded border border-emerald-500/50 bg-emerald-950/10 p-4 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-emerald-400">
                        SLOT A (BLUE) &mdash; PORT 3001
                      </span>
                      <span className="rounded bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-black uppercase">
                        [ ACTIVE LIVE ]
                      </span>
                    </div>
                    <div className="mt-3 space-y-1.5 text-zinc-300 text-[11px]">
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Image:</span>
                        <span>versiongate-api:20260917-1014</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Health Probe:</span>
                        <span className="text-emerald-400">HTTP 200 OK (8ms)</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Traffic Routing:</span>
                        <span>100% via Nginx Upstream</span>
                      </p>
                    </div>
                  </div>

                  {/* Slot B - Green */}
                  <div className="rounded border border-border/60 bg-zinc-900/40 p-4 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-300">
                        SLOT B (GREEN) &mdash; PORT 3002
                      </span>
                      <span className="border border-border/80 px-2 py-0.5 text-[10px] text-muted-foreground uppercase">
                        [ STANDBY / WARM ]
                      </span>
                    </div>
                    <div className="mt-3 space-y-1.5 text-zinc-400 text-[11px]">
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Previous Tag:</span>
                        <span>versiongate-api:20260916-1802</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Warm-Swap State:</span>
                        <span className="text-zinc-300">Cached (Instant Rollback Ready)</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Lock State:</span>
                        <span>RELEASED</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded border border-border/40 bg-zinc-900/30 p-3 text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>Zero-Downtime Rule: Pre-checks HTTP 200 before atomic Nginx upstream reload. If failure occurs, traffic never switches.</span>
                  <span className="text-primary font-semibold shrink-0">[ ZERO DROPPED PACKETS ]</span>
                </div>
              </div>
            )}

            {activeTab === "db" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">DB Studio: versiongate_prod (PostgreSQL 16)</span>
                    <span className="border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      [ CONTAINER LIVE ]
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Latency: 0.42ms</span>
                    <span className="text-muted-foreground">&middot;</span>
                    <span className="text-zinc-300">Port: 5432</span>
                  </div>
                </div>

                {/* SQL Query Console Mockup */}
                <div className="rounded border border-border/60 bg-black p-3 font-mono text-[11px] text-emerald-400">
                  <p className="text-zinc-500">-- Query runner (Executed in 4.2ms | 3 rows returned)</p>
                  <p className="text-zinc-200 mt-1">
                    SELECT id, name, environment, status, deployed_at FROM deployments ORDER BY deployed_at DESC LIMIT 3;
                  </p>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto rounded border border-border/60">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-zinc-900/90 text-zinc-300 uppercase tracking-wider">
                      <tr>
                        <th className="p-2.5 border-b border-border/40">id</th>
                        <th className="p-2.5 border-b border-border/40">name</th>
                        <th className="p-2.5 border-b border-border/40">environment</th>
                        <th className="p-2.5 border-b border-border/40">status</th>
                        <th className="p-2.5 border-b border-border/40">deployed_at</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30 text-zinc-400">
                      <tr>
                        <td className="p-2.5 text-zinc-200">dep_98a7bc</td>
                        <td className="p-2.5 text-zinc-200">core-engine</td>
                        <td className="p-2.5">production</td>
                        <td className="p-2.5 text-emerald-400 font-semibold">[ ACTIVE ]</td>
                        <td className="p-2.5">2026-09-17 10:14:22</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-zinc-200">dep_76f31d</td>
                        <td className="p-2.5 text-zinc-200">analytics-worker</td>
                        <td className="p-2.5">production</td>
                        <td className="p-2.5 text-emerald-400 font-semibold">[ ACTIVE ]</td>
                        <td className="p-2.5">2026-09-17 09:48:10</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-zinc-200">dep_44c9e2</td>
                        <td className="p-2.5 text-zinc-200">web-portal</td>
                        <td className="p-2.5">staging</td>
                        <td className="p-2.5 text-cyan-400 font-semibold">[ LIVE_STAGE ]</td>
                        <td className="p-2.5">2026-09-17 08:30:00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "logs" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2 text-zinc-400 text-[11px]">
                  <span>Job Stream: job_deploy_884920 &middot; Pipeline: BlueGreenDeployer</span>
                  <span className="text-emerald-400 font-semibold">[ STREAMING WS / 100% ]</span>
                </div>
                <div className="space-y-1.5 rounded bg-black p-4 text-[11px] leading-relaxed">
                  <p className="text-zinc-500">10:14:01.120 [INFO] Acquired deployment lock for project 'core-engine'</p>
                  <p className="text-zinc-400">10:14:02.304 [BUILD] Detected stack: Bun / TypeScript &middot; synthesized isolated Dockerfile</p>
                  <p className="text-zinc-400">10:14:05.890 [BUILD] Docker image built successfully: versiongate-core:20260917-1014 (182MB)</p>
                  <p className="text-zinc-400">10:14:06.120 [SLOT] Starting container on idle host port 3001 (SLOT_A)</p>
                  <p className="text-zinc-300">10:14:07.450 [HEALTH] Polling HTTP GET http://127.0.0.1:3001/health ...</p>
                  <p className="text-emerald-400">10:14:07.462 [HEALTH] Probe passed: HTTP 200 OK (12ms)</p>
                  <p className="text-zinc-300">10:14:07.510 [PROXY] Atomic cutover: rewrote Nginx upstream -&gt; 127.0.0.1:3001 &amp; reloaded</p>
                  <p className="text-emerald-400 font-semibold">10:14:07.600 [SUCCESS] Deployment completed in 6.48s &middot; Zero dropped connections</p>
                </div>
              </div>
            )}

            {activeTab === "telemetry" && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded border border-border/60 bg-zinc-900/40 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">24h Requests</p>
                    <p className="mt-1 text-lg font-bold text-foreground">1,842,910</p>
                    <p className="text-[10px] text-emerald-400 mt-0.5">99.998% 2xx Status</p>
                  </div>
                  <div className="rounded border border-border/60 bg-zinc-900/40 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Latency</p>
                    <p className="mt-1 text-lg font-bold text-foreground">14.2 ms</p>
                    <p className="text-[10px] text-emerald-400 mt-0.5">p95: 22ms &middot; p99: 38ms</p>
                  </div>
                  <div className="rounded border border-border/60 bg-zinc-900/40 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Memory RSS</p>
                    <p className="mt-1 text-lg font-bold text-foreground">148 MB</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Host Total: 8.0 GB</p>
                  </div>
                  <div className="rounded border border-border/60 bg-zinc-900/40 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Slots</p>
                    <p className="mt-1 text-lg font-bold text-foreground">12 / 12</p>
                    <p className="text-[10px] text-emerald-400 mt-0.5">All Probes Healthy</p>
                  </div>
                </div>

                <div className="rounded border border-border/50 bg-zinc-900/20 p-3 text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>Automated 30-second audit monitors host CPU, RAM, PostgreSQL latency, Redis buffer, and SSL certificate expiration.</span>
                  <span className="text-emerald-400 font-semibold">[ HOST OPERATIONAL ]</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
