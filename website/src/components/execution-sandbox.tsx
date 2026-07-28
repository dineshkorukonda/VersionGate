"use client";

import { useState } from "react";

export interface SandboxScenario {
  id: string;
  name: string;
  command: string;
  description: string;
  payload: Record<string, unknown>;
  logs: string[];
}

const SCENARIOS: SandboxScenario[] = [
  {
    id: "deploy-zero",
    name: "Zero-Downtime Blue/Green Deploy",
    command: "versiongate deploy --project api-service --env production",
    description: "Compiles Docker container in idle green slot, runs health check on port 3101, then rewrites Nginx upstream atomically.",
    payload: {
      jobId: "job_99f8a12",
      project: "api-service",
      environment: "production",
      targetPort: 3101,
      healthCheck: "http://127.0.0.1:3101/health (200 OK)",
      upstreamStatus: "REWRITTEN",
      downtimeMs: 0,
    },
    logs: [
      "[ INFO ] Enqueued deployment job #job_99f8a12 for project: api-service",
      "[ INFO ] Target environment: production (App Port: 8080 -> Host Port: 3101)",
      "[ INFO ] Building Docker image versiongate-api-service:v14...",
      "[ INFO ] Container api-service_green started successfully on host port 3101",
      "[ OK ] Validation check PASS http://127.0.0.1:3101/health (200 OK in 18ms)",
      "[ OK ] Nginx upstream configuration updated: /p/api-service/production -> 127.0.0.1:3101",
      "[ OK ] Stopped legacy container api-service_blue on host port 3100",
      "[ OK ] Deployment v14 completed cleanly in 38.4s with 0 ms downtime!",
    ],
  },
  {
    id: "warm-swap",
    name: "Instant Warm-Swap Rollback",
    command: "versiongate rollback --project api-service --env production",
    description: "Sub-second rollback reusing locally cached Docker image versiongate-api-service:v13.",
    payload: {
      jobId: "job_77b31c9",
      project: "api-service",
      rolledBackFrom: "v14",
      restoredTo: "v13",
      imageSource: "LOCAL_DOCKER_CACHE",
      warmSwapDurationMs: 1420,
      status: "COMPLETED",
    },
    logs: [
      "[ INFO ] Initiating rollback for project api-service, env production",
      "[ INFO ] Rollback target: v14 -> v13",
      "[ WARM-SWAP ] Detected cached Docker image: versiongate-api-service:v13",
      "[ WARM-SWAP ] Spinning up instant warm container api-service_blue on port 3100...",
      "[ OK ] Validation check PASS http://127.0.0.1:3100/health (200 OK in 12ms)",
      "[ OK ] Traffic switched to port 3100 in 1.4 seconds",
      "[ OK ] Rollback completed instantly! Zero Downtime.",
    ],
  },
  {
    id: "api-token-gen",
    name: "Bearer Token Generation & CI Trigger",
    command: "versiongate tokens create --name 'GitHub Actions Pipeline'",
    description: "Generates a persistent vg_live_... Bearer token and triggers a headless API deployment.",
    payload: {
      tokenId: "tok_8f3a9e",
      name: "GitHub Actions Pipeline",
      tokenPrefix: "vg_live_8f3a",
      bearerHeader: "Authorization: Bearer vg_live_8f3a9e421c7d...",
      expiresAt: null,
      createdAt: "2026-07-29T00:30:00Z",
    },
    logs: [
      "$ curl -X POST https://my-server.com/api/v1/auth/tokens \\",
      "    -H 'Cookie: session=...' -d '{\"name\":\"GitHub Actions Pipeline\"}'",
      "[ OK ] Token generated: vg_live_8f3a9e421c7d9a30b42f1...",
      "$ curl -X POST https://my-server.com/api/v1/deploy \\",
      "    -H 'Authorization: Bearer vg_live_8f3a9e421c7d...' \\",
      "    -d '{\"projectId\":\"proj_123\",\"environmentId\":\"env_prod\"}'",
      "HTTP/1.1 202 Accepted",
      "{\"jobId\":\"job_99a8\",\"status\":\"QUEUED\",\"message\":\"Deployment enqueued\"}",
    ],
  },
];

export function ExecutionSandbox() {
  const [activeId, setActiveId] = useState<string>("deploy-zero");
  const scenario = SCENARIOS.find((s) => s.id === activeId) ?? SCENARIOS[0];

  return (
    <div className="rounded border border-zinc-800 bg-[#050506] shadow-2xl overflow-hidden">
      {/* Sandbox Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 px-4 py-3 bg-[#0a0a0c] gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-zinc-500">///</span>
          <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
            Interactive Engine Sandbox
          </span>
        </div>
        <div className="flex items-center gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`px-3 py-1 font-mono text-xs rounded transition ${
                activeId === s.id
                  ? "bg-white text-black font-bold"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Description & CLI Command Box */}
      <div className="p-4 border-b border-zinc-800 bg-black/60 space-y-2">
        <p className="font-mono text-xs text-zinc-400">{scenario.description}</p>
        <div className="p-3 bg-[#0a0a0c] border border-zinc-800 font-mono text-xs text-emerald-400 rounded">
          $ {scenario.command}
        </div>
      </div>

      {/* Output Grid */}
      <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
        {/* Execution Logs */}
        <div className="p-4 space-y-2 font-mono text-xs leading-relaxed bg-[#050506]">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-900 pb-1 mb-2">
            Execution Log Output Stream
          </div>
          {scenario.logs.map((log, idx) => (
            <div
              key={idx}
              className={
                log.includes("[ OK ]")
                  ? "text-emerald-400 font-semibold"
                  : log.includes("[ WARM-SWAP ]")
                  ? "text-sky-300 font-semibold"
                  : log.includes("[ INFO ]")
                  ? "text-zinc-300"
                  : "text-zinc-400"
              }
            >
              {log}
            </div>
          ))}
        </div>

        {/* JSON Payload Response */}
        <div className="p-4 space-y-2 font-mono text-xs bg-[#0a0a0c]">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-900 pb-1 mb-2">
            JSON Telemetry Payload Response
          </div>
          <pre className="overflow-x-auto text-zinc-300 leading-relaxed">
            {JSON.stringify(scenario.payload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
