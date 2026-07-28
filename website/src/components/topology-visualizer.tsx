"use client";

import { useState } from "react";

export function TopologyVisualizer() {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      title: "01 // Git Webhook Ingress",
      desc: "GitHub webhook sends a signed POST payload (/api/webhooks/github) verified with HMAC SHA-256.",
      payload: "X-Hub-Signature-256: sha256=8f92a1c...",
    },
    {
      title: "02 // Redis Mutex & Lock",
      desc: "Acquires an atomic distributed lock on project:environment in Redis to prevent concurrent deploy race conditions.",
      payload: "SET lock:project:web-app:production PX 300000 NX",
    },
    {
      title: "03 // Idle Slot Compilation",
      desc: "Determines idle container slot (GREEN on port 3101), pulls repository code, and builds Docker image.",
      payload: "docker build -t versiongate-web-app:v14 .",
    },
    {
      title: "04 // Health Verification",
      desc: "Launches GREEN container on port 3101 and verifies health endpoint (GET http://127.0.0.1:3101/health).",
      payload: "GET /health -> 200 OK (Latency: 12ms)",
    },
    {
      title: "05 // Atomic Nginx Swap",
      desc: "Generates new Nginx upstream configuration mapping to port 3101 and executes graceful Nginx reload.",
      payload: "nginx -s reload -> Upstream swapped in 0 ms downtime",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Interactive Step Buttons */}
      <div className="grid gap-2 sm:grid-cols-5">
        {steps.map((step, idx) => (
          <button
            key={idx}
            onClick={() => setActiveStep(idx)}
            className={`p-3 text-left rounded-md font-mono text-xs border transition ${
              activeStep === idx
                ? "bg-primary text-primary-foreground border-primary font-semibold shadow-sm"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
            }`}
          >
            <div>{step.title}</div>
          </button>
        ))}
      </div>

      {/* Detail Inspector Card */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="font-mono text-sm font-bold text-foreground">
            {steps[activeStep].title}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            Step {activeStep + 1} of {steps.length}
          </span>
        </div>

        <p className="font-sans text-xs text-muted-foreground leading-relaxed">
          {steps[activeStep].desc}
        </p>

        <div className="space-y-1">
          <span className="font-mono text-[10px] text-muted-foreground uppercase">System Operation Payload</span>
          <pre className="p-3 bg-muted border border-border font-mono text-xs text-foreground rounded-md overflow-x-auto">
            {steps[activeStep].payload}
          </pre>
        </div>
      </div>
    </div>
  );
}
