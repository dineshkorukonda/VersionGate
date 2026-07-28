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
      {/* Scenario Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {(Object.keys(scenarios) as Scenario[]).map((key) => (
          <button
            key={key}
            onClick={() => setActiveScenario(key)}
            className={`px-3 py-1.5 font-mono text-xs rounded-md transition ${
              activeScenario === key
                ? "bg-primary text-primary-foreground font-semibold"
                : "bg-muted text-muted-foreground border border-border hover:text-foreground"
            }`}
          >
            {key.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Terminal Sandbox Display */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Terminal Log Stream */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="font-mono text-xs font-semibold text-foreground">{current.title}</span>
            <span className="font-mono text-[10px] text-muted-foreground">[ Real-time Stream ]</span>
          </div>

          <div className="font-mono text-xs space-y-2 p-3 bg-muted rounded-md border border-border overflow-x-auto min-h-[220px]">
            {current.logs.map((line, idx) => (
              <div key={idx} className="text-foreground leading-relaxed">
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* JSON Telemetry Response */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="font-mono text-xs font-semibold text-foreground">API Telemetry Payload</span>
            <span className="font-mono text-[10px] text-muted-foreground">[ 200 OK ]</span>
          </div>

          <pre className="p-3 bg-muted border border-border font-mono text-xs text-foreground rounded-md overflow-x-auto min-h-[220px]">
            {JSON.stringify(current.jsonResponse, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
