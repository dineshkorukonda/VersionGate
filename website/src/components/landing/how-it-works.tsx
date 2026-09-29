"use client";

import { useState } from "react";

interface Step {
  id: string;
  number: string;
  title: string;
  badge: string;
  summary: string;
  details: string[];
  command: string;
  codeSnippet: string;
}

const STEPS: Step[] = [
  {
    id: "step-1",
    number: "01",
    title: "Git Push & Ingress Webhook",
    badge: "Ingress & Lock",
    summary:
      "Push to your GitHub repository or dispatch an API trigger. VersionGate authenticates the event and queues the build.",
    details: [
      "Cryptographic HMAC-SHA256 signature verification validates authentic GitHub webhook origin",
      "Git remote branches are resolved using ephemeral installation tokens for private repos",
      "PostgreSQL distributed lock is acquired to prevent concurrent overlapping deploys on the same environment",
    ],
    command: "POST /api/webhooks/:secret  |  POST /api/v1/deploy",
    codeSnippet: `// 1. Webhook HMAC validation & job enqueuing
const valid = verifyHmacSha256(rawBody, signature, secret);
if (!valid) throw new UnauthorizedError("Invalid HMAC signature");

await queue.add("deploy-job", {
  projectId: "proj_94b1",
  environmentId: "env_prod",
  commitSha: "a99bcfd",
  branch: "main"
});`,
  },
  {
    id: "step-2",
    number: "02",
    title: "Stack Detection & Isolated Build",
    badge: "Idle Slot Build",
    summary:
      "The worker auto-detects your runtime and spins up the new version on an isolated idle slot, while production traffic continues uninterrupted.",
    details: [
      "Detects Bun, pnpm, Node, Python (uv/poetry), Rust (Cargo), Go, or existing Dockerfiles",
      "Builds the container image or sets up the bare-metal PM2 process on the idle port (e.g. 3101)",
      "The active slot (e.g. 3100) continues serving 100% of live user requests without interruption",
    ],
    command: "src/worker/handlers/deploy.handler.ts  |  detectRuntime()",
    codeSnippet: `// 2. Identify idle slot & compile container/process
const idleSlot = activeSlot === "blue" ? "green" : "blue";
const targetPort = idleSlot === "green" ? 3101 : 3100;

console.log(\`[BUILD] Compiling slot \${idleSlot} on port :\${targetPort}\`);
await docker.buildImage({ tag: \`app:\${commitSha}\`, context });
await docker.runContainer({ port: targetPort, slot: idleSlot });`,
  },
  {
    id: "step-3",
    number: "03",
    title: "Dual-Host Resilient Health Probes",
    badge: "Automated Validation",
    summary:
      "Automated probes test your endpoints before any user traffic is allowed to reach the new version.",
    details: [
      "Probes endpoints (/health, /api/health, /ping) over IPv4 127.0.0.1 and localhost candidates",
      "Validates HTTP 200 OK status codes and healthy response payloads across a warm-up window",
      "If health checks fail, the deployment is aborted cleanly with zero impact on production",
    ],
    command: "src/services/validation.service.ts  |  GET /health -> 200 OK",
    codeSnippet: `// 3. Proactive health probe verification
const probe = await validateHealthProbe({
  host: "127.0.0.1",
  port: targetPort,
  path: "/health",
  maxAttempts: 15,
  intervalMs: 1000
});

if (!probe.ok) {
  await abortDeployment("Health check failed on idle slot");
}`,
  },
  {
    id: "step-4",
    number: "04",
    title: "Atomic Upstream Cutover & Warm Cache",
    badge: "Zero Downtime",
    summary:
      "Nginx repoints traffic to the new healthy slot with zero dropped requests, keeping the old slot cached for instant rollback.",
    details: [
      "Nginx upstream configuration is atomically rewritten and reloaded via nginx -s reload",
      "All active in-flight HTTP connections complete without interruption or connection resets",
      "The previous container is kept in warm standby cache for sub-2-second instant rollbacks",
    ],
    command: "nginx -s reload  |  POST /api/v1/projects/:id/rollback",
    codeSnippet: `// 4. Atomic Nginx upstream rewrite & warm-swap retention
await writeNginxUpstream({
  upstreamName: "web_app_production",
  activePort: targetPort
});
await exec("nginx -s reload");

console.log("[OK] Traffic cutover complete. 0 dropped packets.");
await cacheWarmSlot(activeSlot); // Ready for < 2s rollback`,
  },
];

export function HowItWorks() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const activeStep = STEPS[activeStepIndex];

  return (
    <section id="architecture" className="border-t border-neutral-800 bg-[#060606] py-24 scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-400">
            How It Works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            From Git Push to Atomic Traffic Switch
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-neutral-400 sm:text-base">
            Every step is automated, isolated on an idle slot, and backed by instantaneous rollback capabilities.
          </p>
        </div>

        {/* Step Navigation Progress Bar */}
        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STEPS.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setActiveStepIndex(idx)}
              className={`rounded-xl border p-4 text-left transition-all ${
                activeStepIndex === idx
                  ? "border-white/80 bg-neutral-900/90 shadow-lg shadow-white/5"
                  : "border-neutral-800/80 bg-neutral-950/40 hover:border-neutral-700 hover:bg-neutral-900/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-mono text-xs font-bold ${
                    activeStepIndex === idx ? "text-white" : "text-neutral-500"
                  }`}
                >
                  Step {step.number}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-[9px] uppercase ${
                    activeStepIndex === idx
                      ? "bg-white/10 text-white font-semibold border border-white/20"
                      : "bg-neutral-900 text-neutral-500"
                  }`}
                >
                  {step.badge}
                </span>
              </div>
              <h3 className="mt-2 font-sans text-sm font-semibold text-white">
                {step.title}
              </h3>
            </button>
          ))}
        </div>

        {/* Active Step Deep Dive Card */}
        <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 lg:p-10 shadow-2xl">
          <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Left: Step Details */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 font-mono text-sm font-bold text-white border border-neutral-700">
                  {activeStep.number}
                </span>
                <div>
                  <h3 className="text-xl font-bold text-white sm:text-2xl">
                    {activeStep.title}
                  </h3>
                  <span className="font-mono text-xs text-neutral-400">
                    Phase {activeStep.number} of 04
                  </span>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-neutral-300 sm:text-base">
                {activeStep.summary}
              </p>

              <div className="space-y-3 pt-2">
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Key Mechanics & Architecture
                </p>
                <ul className="space-y-2.5">
                  {activeStep.details.map((detail, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-3 text-xs sm:text-sm text-neutral-300">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-[10px] font-bold text-white">
                        ✓
                      </span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Command callout */}
              <div className="rounded-lg border border-neutral-800/80 bg-[#050505] p-3 font-mono text-xs text-neutral-400">
                <span className="text-neutral-500 block mb-1 text-[10px] uppercase">Engine Execution Route</span>
                <code className="text-neutral-200">{activeStep.command}</code>
              </div>
            </div>

            {/* Right: Code / Architecture Simulator */}
            <div className="lg:col-span-6">
              <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#070707] shadow-xl">
                <div className="flex items-center justify-between border-b border-neutral-800 bg-[#0d0d0f] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-600" />
                    <span className="font-mono text-xs text-neutral-300">
                      versiongate-worker // pipeline-step-{activeStep.number}.ts
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-white">
                    STATUS: OK
                  </span>
                </div>

                <div className="p-4 overflow-x-auto">
                  <pre className="font-mono text-xs leading-relaxed text-neutral-300">
                    <code>{activeStep.codeSnippet}</code>
                  </pre>
                </div>

                <div className="border-t border-neutral-800 bg-[#09090b] px-4 py-2.5 flex items-center justify-between text-[11px] font-mono text-neutral-500">
                  <span>Slot Blue: :3100</span>
                  <span className="text-white">Slot Green: :3101</span>
                  <span>Zero-Downtime Guarantee: 100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
