"use client";

import { useState } from "react";

export type Scenario = "deploy" | "rollback" | "tokens";

export function ExecutionSandbox() {
  const [activeScenario, setActiveScenario] = useState<Scenario>("deploy");

  const scenarios: Record<Scenario, { title: string; logs: string[]; jsonResponse: object }> = {
    deploy: {
      title: "Blue/Green Zero-Downtime Deployment",
      logs: [
        "[ INFO ] Job #4912 enqueued (Project: web-app, Environment: production)",
        "[ INFO ] Inspecting container slots: BLUE (:3100) ACTIVE | GREEN (:3101) IDLE",
        "[ INFO ] Building image tag versiongate-web-app:v14 from git commit 8f92a1c...",
        "[ INFO ] Launching target container slot GREEN on host port 3101",
        "[ OK ] Health check passed: http://127.0.0.1:3101/health returned 200 OK in 14ms",
        "[ OK ] Atomically reloaded Nginx upstream config versiongate_web-app -> 127.0.0.1:3101",
        "[ INFO ] Decommissioned legacy container slot BLUE (:3100)",
        "[ OK ] Deployment completed with 0 ms downtime.",
      ],
      jsonResponse: {
        status: "SUCCESS",
        jobId: "job_4912",
        project: "web-app",
        environment: "production",
        slot: "GREEN",
        port: 3101,
        durationMs: 1420,
        healthCheck: { status: 200, latencyMs: 14 },
      },
    },
    rollback: {
      title: "Sub-Second Warm-Swap Rollback",
      logs: [
        "[ INFO ] Rollback job #4913 initiated -> targeting previous commit 3a1f8b",
        "[ OK ] Local Docker image cache hit: versiongate-web-app:v13 exists",
        "[ WARN-SWAP ] Skipping git clone and container build compilation",
        "[ INFO ] Starting cached container on slot BLUE (:3100)",
        "[ OK ] Health check passed: http://127.0.0.1:3100/health returned 200 OK in 8ms",
        "[ OK ] Reloaded Nginx upstream -> 127.0.0.1:3100",
        "[ OK ] Warm-swap rollback completed in 1.48s.",
      ],
      jsonResponse: {
        status: "SUCCESS",
        jobId: "job_4913",
        mode: "WARM_SWAP",
        imageTag: "versiongate-web-app:v13",
        slot: "BLUE",
        port: 3100,
        durationMs: 1480,
      },
    },
    tokens: {
      title: "Bearer Token Generation & Verification",
      logs: [
        "[ REQUEST ] POST /api/v1/auth/tokens (Name: GitHub Actions CI)",
        "[ INFO ] Generated SHA-256 token hash: vg_live_8f92a1c4b7e6d5a3...",
        "[ OK ] Token registered successfully with scopes: ['deploy:write', 'project:read']",
        "[ REQUEST ] POST /api/v1/deploy -H 'Authorization: Bearer vg_live_8f92a1c...'",
        "[ OK ] Token authenticated successfully for user: dineshkorukonda",
      ],
      jsonResponse: {
        status: "OK",
        token: "vg_live_8f92a1c4b7e6d5a3...",
        createdAt: new Date().toISOString(),
        scopes: ["deploy:write", "project:read"],
      },
    },
  };

  const current = scenarios[activeScenario];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        {(Object.keys(scenarios) as Scenario[]).map((key) => (
          <button
            key={key}
            onClick={() => setActiveScenario(key)}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] transition ${
              activeScenario === key
                ? "bg-[#3effa8] font-semibold text-black"
                : "border border-white/15 text-white/55 hover:border-white/30 hover:text-white"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 border border-white/10 bg-black p-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-mono text-xs font-semibold text-white">{current.title}</span>
            <span className="font-mono text-[10px] text-white/40">[ Real-time Stream ]</span>
          </div>

          <div className="min-h-[220px] space-y-2 overflow-x-auto border border-white/10 bg-white/[0.03] p-3 font-mono text-xs">
            {current.logs.map((line, idx) => (
              <div key={idx} className="leading-relaxed text-white/70">
                {line}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 border border-white/10 bg-black p-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-mono text-xs font-semibold text-white">API Telemetry Payload</span>
            <span className="font-mono text-[10px] text-[#3effa8]">[ 200 OK ]</span>
          </div>

          <pre className="min-h-[220px] overflow-x-auto border border-white/10 bg-white/[0.03] p-3 font-mono text-xs text-white/70">
            {JSON.stringify(current.jsonResponse, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
