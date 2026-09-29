"use client";

import { useState } from "react";
import Link from "next/link";

const INSTALL_CMD = "curl -fsSL https://versiongate.tech/install.sh | bash";

export function HeroSection() {
  const [copied, setCopied] = useState(false);

  const copyInstall = () => {
    navigator.clipboard.writeText(INSTALL_CMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1 text-xs font-mono text-neutral-700 shadow-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
          <span>Open Source Self-Hosted PaaS</span>
        </div>

        {/* Headline */}
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-neutral-950 sm:text-6xl sm:leading-[1.12]">
          Deploy to your VPS with zero downtime.
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
          VersionGate turns any Linux server into a production-grade deployment platform.
          Git-push deploys, blue/green traffic cutovers, built-in database management, and instant rollbacks on your own hardware.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="#install"
            className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
          >
            Get Started
          </Link>
          <a
            href="https://github.com/dineshkorukonda/VersionGate"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-300 bg-white px-6 text-sm font-medium text-neutral-900 shadow-xs transition hover:bg-neutral-50 hover:border-neutral-400"
          >
            Star on GitHub
          </a>
        </div>

        {/* One-line Install Pill */}
        <div className="mx-auto mt-6 max-w-md">
          <div className="flex items-center justify-between gap-3 rounded-full border border-neutral-200 bg-white px-4 py-2 shadow-xs">
            <span className="font-mono text-xs text-neutral-800 truncate">{INSTALL_CMD}</span>
            <button
              type="button"
              onClick={copyInstall}
              className="shrink-0 rounded-full bg-neutral-100 px-3 py-1 font-mono text-[11px] font-medium text-neutral-700 transition hover:bg-neutral-200 hover:text-neutral-950"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 font-mono text-xs text-neutral-500">
          <span>MIT Licensed</span>
          <span>•</span>
          <span>Zero Vendor Lock-in</span>
          <span>•</span>
          <span>Runs on $5 VPS</span>
        </div>

        {/* Interactive App Preview Card */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white text-left shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
          <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
              <span className="ml-2 font-mono text-xs text-neutral-500">
                production // web-api
              </span>
            </div>
            <span className="rounded-full bg-neutral-950 px-3 py-0.5 font-mono text-[10px] font-bold text-white">
              LIVE · 0ms DOWNTIME
            </span>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-neutral-200/90 bg-neutral-50/80 p-4">
                <span className="text-[11px] font-mono text-neutral-500 block">Active Slot</span>
                <span className="text-sm font-semibold text-neutral-900 mt-1 block">Slot A · Port 3101</span>
                <span className="text-[11px] text-neutral-600 font-mono">100% Live Traffic</span>
              </div>
              <div className="rounded-xl border border-neutral-200/90 bg-neutral-50/80 p-4">
                <span className="text-[11px] font-mono text-neutral-500 block">Standby Slot</span>
                <span className="text-sm font-semibold text-neutral-900 mt-1 block">Slot B · Port 3100</span>
                <span className="text-[11px] text-neutral-600 font-mono">Warm Rollback Ready (&lt; 2s)</span>
              </div>
              <div className="rounded-xl border border-neutral-200/90 bg-neutral-50/80 p-4">
                <span className="text-[11px] font-mono text-neutral-500 block">Health Check</span>
                <span className="text-sm font-semibold text-neutral-900 mt-1 block">200 OK · 12ms</span>
                <span className="text-[11px] text-neutral-600 font-mono">Dual-host verified</span>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 font-mono text-xs text-neutral-600 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-neutral-950 font-semibold">Latest deploy:</span>
                <span className="text-neutral-800">feat: add bearer tokens & rate limiting</span>
                <span className="text-neutral-500">(commit a99bcfd)</span>
              </div>
              <span className="text-neutral-500 text-[11px]">Duration: 28s</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
