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
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 -translate-x-1/2 h-[500px] w-[800px] max-w-full rounded-full bg-primary/10 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-zinc-900/90 px-3.5 py-1.5">
            <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              v2.9.5
            </span>
            <span className="text-xs text-muted-foreground">
              DB Studio and bare-metal PM2 engine
            </span>
            <Link href="/changelog" className="text-xs font-medium text-foreground hover:text-primary transition">
              View release
            </Link>
          </div>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Zero-downtime deploys.{" "}
            <span className="bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
              Self-hosted freedom.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Deploy Docker containers and host PM2 services on your own server.
            Git webhook builds, blue/green warm-swap routing, integrated database studio,
            and Certbot TLS with zero vendor lock-in.
          </p>

          <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="#install"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Deploy engine
            </Link>
            <Link
              href="/docs"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-zinc-900 px-6 text-sm font-medium text-foreground transition hover:border-primary/60"
            >
              Documentation
            </Link>
            <Link
              href="https://github.com/dineshkorukonda/VersionGate"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border/80 bg-zinc-950 px-4 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              GitHub
            </Link>
          </div>

          <div className="mx-auto mt-6 max-w-xl">
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-zinc-950 p-2.5">
              <div className="flex items-center gap-3 overflow-x-auto pl-2 font-mono text-xs text-zinc-300">
                <span className="text-primary select-none">$</span>
                <code className="whitespace-nowrap">{INSTALL_CMD}</code>
              </div>
              <button
                type="button"
                onClick={copyInstall}
                className="ml-3 shrink-0 rounded-md border border-border/60 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-300 transition hover:border-primary/50 hover:text-primary"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-14 rounded-xl border border-border/60 bg-zinc-950 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between border-b border-border/60 bg-zinc-900 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-3 text-xs text-zinc-400">versiongate-dashboard</span>
            </div>

            <div className="flex items-center gap-1 text-xs">
              {(["slots", "db", "logs", "telemetry"] as PreviewTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-md px-2.5 py-1 capitalize transition ${
                    activeTab === tab
                      ? "bg-zinc-800 text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "slots" ? "Blue-Green" : tab === "db" ? "DB Studio" : tab === "logs" ? "Logs" : "Telemetry"}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-zinc-950 text-xs">
            {activeTab === "slots" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-foreground">api.versiongate.internal</span>
                      <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        Live
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      main · 55244e0 · Production
                    </p>
                  </div>
                  <span className="rounded-md border border-border/60 px-2 py-1 text-[11px] text-zinc-400">
                    Upstream: 127.0.0.1:3001
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-emerald-500/50 bg-emerald-950/10 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-emerald-400">Slot A · Port 3001</span>
                      <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-black">Active</span>
                    </div>
                    <div className="mt-3 space-y-1.5 text-zinc-300 text-[11px]">
                      <p className="flex justify-between"><span className="text-muted-foreground">Image</span><span>versiongate-api:20260917</span></p>
                      <p className="flex justify-between"><span className="text-muted-foreground">Health</span><span className="text-emerald-400">HTTP 200 (8ms)</span></p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-zinc-900/40 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-300">Slot B · Port 3002</span>
                      <span className="rounded-md border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">Standby</span>
                    </div>
                    <div className="mt-3 space-y-1.5 text-zinc-400 text-[11px]">
                      <p className="flex justify-between"><span className="text-muted-foreground">Previous</span><span>versiongate-api:20260916</span></p>
                      <p className="flex justify-between"><span className="text-muted-foreground">Rollback</span><span className="text-zinc-300">Ready</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "db" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <span className="font-semibold text-foreground">versiongate_prod · PostgreSQL 16</span>
                  <span className="text-muted-foreground">0.42ms latency</span>
                </div>
                <div className="rounded-lg border border-border/60 bg-black p-3 font-mono text-[11px] text-emerald-400">
                  <p className="text-zinc-500">SELECT id, name, status FROM deployments LIMIT 3;</p>
                </div>
              </div>
            )}

            {activeTab === "logs" && (
              <div className="space-y-1.5 rounded-lg bg-black p-4 font-mono text-[11px] leading-relaxed">
                <p className="text-zinc-500">10:14:01 Acquired deployment lock</p>
                <p className="text-zinc-400">10:14:05 Docker image built (182MB)</p>
                <p className="text-emerald-400">10:14:07 Health probe passed · Nginx reloaded</p>
                <p className="text-emerald-400 font-medium">10:14:07 Deployment completed in 6.48s</p>
              </div>
            )}

            {activeTab === "telemetry" && (
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  { label: "24h Requests", value: "1.8M", sub: "99.99% 2xx" },
                  { label: "Avg Latency", value: "14ms", sub: "p95: 22ms" },
                  { label: "Memory", value: "148 MB", sub: "of 8 GB" },
                  { label: "Active Slots", value: "12/12", sub: "All healthy" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-border/60 bg-zinc-900/40 p-3">
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-lg font-bold text-foreground">{stat.value}</p>
                    <p className="text-[10px] text-emerald-400">{stat.sub}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
