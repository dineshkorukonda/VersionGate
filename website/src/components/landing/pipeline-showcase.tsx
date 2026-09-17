"use client";

import { useState } from "react";

interface Step {
  num: string;
  title: string;
  code: string;
  desc: string;
  status: string;
}

const STEPS: Step[] = [
  {
    num: "01 //",
    title: "Git Push / Webhook Trigger",
    code: "POST /api/webhooks/github -> deploy.handler",
    desc: "Webhook validates HMAC signature, parses ref branch, and acquires distributed deploy lock in Redis / Postgres.",
    status: "[ LOCK ACQUIRED ]",
  },
  {
    num: "02 //",
    title: "Stack Detection & Build",
    code: "ensureDockerfile(buildContext) | PM2 spawn",
    desc: "Pre-scans lockfiles (Bun, Cargo, uv, pnpm), builds isolated Docker image or configures host PM2 process.",
    status: "[ IMAGE COMPILED ]",
  },
  {
    num: "03 //",
    title: "Idle Port Health Probe",
    code: "GET http://127.0.0.1:3002/health -> 200 OK",
    desc: "Starts new build on idle slot. Polls configured health path for HTTP 200 status. If probe fails, build terminates immediately.",
    status: "[ PROBE VERIFIED ]",
  },
  {
    num: "04 //",
    title: "Atomic Traffic Cutover",
    code: "TrafficService.switchTrafficTo(slot) & nginx -s reload",
    desc: "Rewrites Nginx upstream configuration and executes atomic reload. Retires previous slot while keeping image cached for 1s rollback.",
    status: "[ 100% LIVE ]",
  },
];

export function PipelineShowcase() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="architecture" className="py-20 border-t border-border/40 bg-zinc-950/60 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            [ DEPLOYMENT LIFECYCLE ]
          </p>
          <h2 className="mt-2 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How Zero-Downtime Deployment Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Every code push goes through a strict four-stage pipeline ensuring your production
            application never drops a single active connection.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-4">
          {STEPS.map((step, idx) => (
            <div
              key={step.num}
              onClick={() => setActiveStep(idx)}
              className={`cursor-pointer rounded-lg border p-6 font-mono transition-all ${
                activeStep === idx
                  ? "border-primary bg-zinc-900/90 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                  : "border-border/60 bg-zinc-950/80 hover:border-border hover:bg-zinc-900/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary">{step.num}</span>
                <span className="text-[10px] text-zinc-400 font-semibold">{step.status}</span>
              </div>

              <h3 className="mt-4 text-sm font-bold text-foreground">
                {step.title}
              </h3>

              <div className="mt-3 rounded bg-black/70 p-2 text-[10px] text-zinc-300">
                <code>{step.code}</code>
              </div>

              <p className="mt-4 text-xs font-sans text-zinc-400 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Architecture Detail Box */}
        <div className="mt-8 rounded-lg border border-border/60 bg-zinc-900/40 p-6 font-mono text-xs text-zinc-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
            <div>
              <span className="text-primary font-semibold">[ FAIL-SAFE REVERSAL ]</span>
              <span className="ml-2 text-foreground font-medium">Warm-Swap Rollback Mechanism</span>
            </div>
            <span className="border border-border/80 px-2 py-0.5 text-[11px] text-zinc-400">
              POST /api/v1/projects/:id/rollback
            </span>
          </div>
          <p className="mt-4 text-xs font-sans leading-relaxed text-zinc-400">
            Because VersionGate caches previous Docker image tags locally on the server, rollbacks skip git clone and docker build entirely.
            Executing a rollback starts the previous container, validates its health probe, and flips the Nginx upstream back in less than 1.2 seconds.
          </p>
        </div>
      </div>
    </section>
  );
}
