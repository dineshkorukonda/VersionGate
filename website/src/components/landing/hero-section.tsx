"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardPreview } from "./dashboard-preview";

const INSTALL_CMD = "curl -fsSL https://versiongate.tech/install.sh | sudo bash";

export function HeroSection() {
  const [copied, setCopied] = useState(false);

  const copyInstall = () => {
    navigator.clipboard.writeText(INSTALL_CMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.07]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-medium text-primary">Self-hosted deployment engine</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Deploy to your VPS with zero downtime
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-400 sm:text-lg">
              VersionGate is an open-source PaaS you run on your own server. Git webhooks,
              blue/green slot routing, PM2 or Docker, database studio, and TLS — without cloud lock-in.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="#install"
                className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-medium text-white transition hover:bg-primary/90"
              >
                Install on your server
              </Link>
              <Link
                href="#demo-video"
                className="inline-flex h-11 items-center rounded-lg border border-neutral-700 bg-neutral-900 px-5 text-sm font-mono text-neutral-200 transition hover:border-neutral-500 hover:text-white"
              >
                [ WATCH REEL // 20s ]
              </Link>
              <Link
                href="/docs/quick-start"
                className="inline-flex h-11 items-center rounded-lg border border-neutral-800 bg-neutral-950 px-4 text-sm font-medium text-neutral-400 transition hover:border-neutral-700 hover:text-white"
              >
                Docs
              </Link>
            </div>

            <div className="mt-6 max-w-lg rounded-lg border border-neutral-800 bg-neutral-950 p-3">
              <div className="flex items-center justify-between gap-3">
                <code className="truncate font-mono text-xs text-neutral-300">{INSTALL_CMD}</code>
                <button
                  type="button"
                  onClick={copyInstall}
                  className="shrink-0 rounded-md border border-neutral-700 px-2.5 py-1 text-xs font-medium text-neutral-300 transition hover:border-neutral-500 hover:text-white"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-neutral-500">
              <span>MIT licensed</span>
              <span>Open source</span>
              <span>No vendor lock-in</span>
            </div>
          </div>

          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
