"use client";

import { useState } from "react";

export interface TopologyNode {
  id: string;
  step: string;
  name: string;
  sub: string;
  desc: string;
  tech: string;
  status: "ACTIVE" | "READY" | "STANDBY";
}

const NODES: TopologyNode[] = [
  {
    id: "ingress",
    step: "01",
    name: "GitHub / API Ingress",
    sub: "Signed Webhook or Bearer Token",
    desc: "Ingresses git pushes, tag promotions, or authenticated REST API calls (/api/v1/deploy).",
    tech: "HMAC SHA-256 Webhook / Bearer vg_live_...",
    status: "ACTIVE",
  },
  {
    id: "fastify",
    step: "02",
    name: "Fastify API & Lock Engine",
    sub: "Port 9090 Server",
    desc: "Validates payload, acquires Redis distributed deployment lock for the environment, and appends job to SQL queue.",
    tech: "Bun Runtime + PostgreSQL 16 + Redis 6379",
    status: "ACTIVE",
  },
  {
    id: "worker",
    step: "03",
    name: "Worker Pipeline & Build",
    sub: "Isolated BuildContext",
    desc: "Executes git checkout, generates dockerfile, and runs Docker BuildKit with layer caching.",
    tech: "Docker BuildKit + Docker Engine Socket",
    status: "ACTIVE",
  },
  {
    id: "slots",
    step: "04",
    name: "Blue / Green Container Slots",
    sub: "Port :3100 (Blue) / :3101 (Green)",
    desc: "Deploys container into the currently idle slot port, injects environment variables, and executes health validation.",
    tech: "Docker Container Runtime + Health Validator",
    status: "ACTIVE",
  },
  {
    id: "nginx",
    step: "05",
    name: "Nginx Atomic Traffic Swap",
    sub: "Reverse Proxy & Upstream Reload",
    desc: "Switches upstream server target atomically via Nginx reload without dropping active HTTP connections.",
    tech: "Nginx Upstream Reload + Stage Path Proxy",
    status: "ACTIVE",
  },
];

export function TopologyVisualizer() {
  const [activeNodeId, setActiveNodeId] = useState<string>("slots");
  const selectedNode = NODES.find((n) => n.id === activeNodeId) ?? NODES[0];

  return (
    <div className="space-y-6">
      {/* Node Chain Bar */}
      <div className="grid gap-3 sm:grid-cols-5">
        {NODES.map((node) => {
          const isSelected = activeNodeId === node.id;
          return (
            <button
              key={node.id}
              onClick={() => setActiveNodeId(node.id)}
              className={`p-4 rounded border text-left transition-all ${
                isSelected
                  ? "border-white bg-zinc-900 shadow-lg"
                  : "border-zinc-800 bg-[#0a0a0c] hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-zinc-500 font-bold">{node.step} //</span>
                <span className={`px-1.5 py-0.5 font-mono text-[8px] rounded border font-bold ${
                  isSelected ? "bg-white text-black border-white" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                }`}>
                  {node.status}
                </span>
              </div>
              <p className="font-mono text-xs font-bold text-white truncate">{node.name}</p>
              <p className="font-mono text-[10px] text-zinc-400 truncate mt-0.5">{node.sub}</p>
            </button>
          );
        })}
      </div>

      {/* Selected Node Details Card */}
      <div className="rounded border border-zinc-800 bg-[#0a0a0c] p-6 space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-white">STEP {selectedNode.step}</span>
            <span className="font-mono text-xs text-zinc-400">/ {selectedNode.name}</span>
          </div>
          <span className="font-mono text-[10px] text-zinc-500 uppercase">Architecture Telemetry</span>
        </div>

        <p className="font-mono text-xs text-zinc-300 leading-relaxed">
          {selectedNode.desc}
        </p>

        <div className="pt-2 flex items-center gap-2">
          <span className="font-mono text-[10px] text-zinc-500 uppercase">Tech Stack:</span>
          <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
            {selectedNode.tech}
          </span>
        </div>
      </div>
    </div>
  );
}
