"use client";

import { useState } from "react";

interface Step {
  num: string;
  title: string;
  code: string;
  desc: string;
}

const STEPS: Step[] = [
  {
    num: "01",
    title: "Git push / webhook trigger",
    code: "POST /api/webhooks/github",
    desc: "Webhook validates HMAC signature, parses ref branch, and acquires a distributed deploy lock.",
  },
  {
    num: "02",
    title: "Stack detection and build",
    code: "ensureDockerfile() | PM2 spawn",
    desc: "Scans lockfiles, builds an isolated Docker image or configures a host PM2 process.",
  },
  {
    num: "03",
    title: "Idle port health probe",
    code: "GET http://127.0.0.1:3002/health",
    desc: "Starts the new build on the idle slot and polls the health path for HTTP 200.",
  },
  {
    num: "04",
    title: "Atomic traffic cutover",
    code: "switchTrafficTo() & nginx -s reload",
    desc: "Rewrites the Nginx upstream and reloads. Previous slot stays cached for instant rollback.",
  },
];

export function PipelineShowcase() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="architecture" className="py-20 border-t border-border/40 bg-zinc-950 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Deployment lifecycle</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How zero-downtime deployment works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Every code push goes through a four-stage pipeline so production never drops an active connection.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, idx) => (
            <button
              key={step.num}
              type="button"
              onClick={() => setActiveStep(idx)}
              className={`cursor-pointer rounded-lg border p-6 text-left transition ${
                activeStep === idx
                  ? "border-primary bg-zinc-900"
                  : "border-border/60 bg-zinc-950 hover:border-border"
              }`}
            >
              <span className="text-xs font-semibold text-primary">{step.num}</span>
              <h3 className="mt-4 text-sm font-semibold text-foreground">{step.title}</h3>
              <div className="mt-3 rounded-md bg-black/70 p-2 font-mono text-[10px] text-zinc-300">
                <code>{step.code}</code>
              </div>
              <p className="mt-4 text-xs text-zinc-400 leading-relaxed">{step.desc}</p>
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-border/60 bg-zinc-900/40 p-6 text-sm text-zinc-300">
          <p className="font-medium text-foreground">Warm-swap rollback</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            VersionGate caches previous Docker image tags locally. Rollbacks skip git clone and docker build,
            start the previous container, validate health, and flip the Nginx upstream back in under 1.2 seconds.
          </p>
        </div>
      </div>
    </section>
  );
}
