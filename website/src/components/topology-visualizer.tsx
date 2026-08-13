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
      <div className="grid gap-2 sm:grid-cols-5">
        {steps.map((step, idx) => (
          <button
            key={idx}
            onClick={() => setActiveStep(idx)}
            className={`border p-3 text-left font-mono text-xs transition ${
              activeStep === idx
                ? "border-[#3effa8] bg-[#3effa8] font-semibold text-black"
                : "border-white/15 bg-black text-white/50 hover:border-white/30 hover:text-white"
            }`}
          >
            <div>{step.title}</div>
          </button>
        ))}
      </div>

      <div className="space-y-4 border border-white/10 bg-black p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="font-mono text-sm font-bold text-white">
            {steps[activeStep].title}
          </span>
          <span className="font-mono text-[10px] text-white/40">
            Step {activeStep + 1} of {steps.length}
          </span>
        </div>

        <p className="text-xs leading-relaxed text-white/55">
          {steps[activeStep].desc}
        </p>

        <div className="space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
            System Operation Payload
          </span>
          <pre className="overflow-x-auto border border-white/10 bg-white/[0.03] p-3 font-mono text-xs text-white/80">
            {steps[activeStep].payload}
          </pre>
        </div>
      </div>
    </div>
  );
}
