"use client";

import { useState } from "react";

export function FeatureShowcase() {
  const [activeSlot, setActiveSlot] = useState<"green" | "blue">("green");
  const [runtimeTab, setRuntimeTab] = useState<"pm2" | "docker">("pm2");
  const [queryState, setQueryState] = useState<"idle" | "running" | "done">("done");

  const runSampleQuery = () => {
    setQueryState("running");
    setTimeout(() => {
      setQueryState("done");
    }, 600);
  };

  return (
    <section id="features" className="border-t border-neutral-800 bg-[#020202] py-24 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Platform Architecture
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Everything on your hardware, engineered for zero downtime
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-400">
            VersionGate replaces the deploy layer of proprietary cloud PaaS with self-hosted,
            production-tested primitives on your own VPS.
          </p>
        </div>

        {/* Feature 1: Blue/Green Zero Downtime */}
        <div className="mt-20 grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 font-mono text-xs text-neutral-300">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              Atomic Upstream Switch
            </div>
            <h3 className="text-2xl font-bold text-white sm:text-3xl">
              Blue/Green zero-downtime deploys
            </h3>
            <p className="text-sm leading-relaxed text-neutral-300">
              Every production environment is allocated two dedicated slots. VersionGate builds on the
              idle port, runs multi-host health probes against your application, and atomically
              reloads Nginx upstream with zero dropped TCP connections.
            </p>
            <div className="space-y-2 pt-2 font-mono text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="text-white">✓</span>
                <span>Warm-swap rollback reuses cached images in under 2 seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white">✓</span>
                <span>Dual-host validation probes testing 127.0.0.1 and localhost</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white">✓</span>
                <span>Zero connection drops via atomic nginx -s reload</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl">
              {/* Terminal Window Header */}
              <div className="flex items-center justify-between border-b border-neutral-800 bg-[#0a0a0a] px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-neutral-700" />
                  <div className="h-3 w-3 rounded-full bg-neutral-700" />
                  <div className="h-3 w-3 rounded-full bg-neutral-700" />
                  <span className="ml-2 font-mono text-xs text-neutral-400">
                    traffic-router // nginx-upstream.conf
                  </span>
                </div>
                <span className="rounded bg-neutral-800 px-2 py-0.5 font-mono text-[10px] font-semibold text-neutral-200 border border-neutral-700">
                  LIVE CUTOVER READY
                </span>
              </div>

              {/* Slot Cards View */}
              <div className="p-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Slot Green (Slot 1) */}
                  <div
                    onClick={() => setActiveSlot("green")}
                    className={`cursor-pointer rounded-lg border p-4 transition ${
                      activeSlot === "green"
                        ? "border-white/80 bg-neutral-900/90 shadow-lg shadow-white/5"
                        : "border-neutral-800 bg-[#0d0d0d] opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-white">
                        SLOT A (v14)
                      </span>
                      <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[9px] font-bold text-white">
                        {activeSlot === "green" ? "100% TRAFFIC" : "IDLE"}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1 font-mono text-xs text-neutral-400">
                      <p>Port: <span className="text-white">127.0.0.1:3101</span></p>
                      <p>Health: <span className="text-white">200 OK (14ms)</span></p>
                      <p>SHA: <span className="text-neutral-300">a99bcfd (HEAD)</span></p>
                    </div>
                  </div>

                  {/* Slot Blue (Slot 2) */}
                  <div
                    onClick={() => setActiveSlot("blue")}
                    className={`cursor-pointer rounded-lg border p-4 transition ${
                      activeSlot === "blue"
                        ? "border-white/80 bg-neutral-900/90 shadow-lg shadow-white/5"
                        : "border-neutral-800 bg-[#0d0d0d] opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-white">
                        SLOT B (v13)
                      </span>
                      <span className="rounded bg-neutral-800 px-2 py-0.5 font-mono text-[9px] font-medium text-neutral-400">
                        {activeSlot === "blue" ? "100% TRAFFIC" : "WARM CACHED"}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1 font-mono text-xs text-neutral-400">
                      <p>Port: <span className="text-white">127.0.0.1:3100</span></p>
                      <p>Health: <span className="text-neutral-300">200 OK (Standby)</span></p>
                      <p>SHA: <span className="text-neutral-300">f87e24a (Previous)</span></p>
                    </div>
                  </div>
                </div>

                {/* Live Nginx Upstream snippet */}
                <div className="rounded-lg border border-neutral-800 bg-[#050505] p-4 font-mono text-xs text-neutral-300">
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 pb-2 border-b border-neutral-800">
                    <span>upstream versiongate_backend</span>
                    <span className="text-white">active: 310{activeSlot === "green" ? "1" : "0"}</span>
                  </div>
                  <pre className="pt-2 text-[11px] text-neutral-400">
{`upstream web_app_production {
    server 127.0.0.1:310${activeSlot === "green" ? "1" : "0"}; # Active slot
    keepalive 64;
}`}
                  </pre>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-800/80">
                    <span>Nginx cutover latency: <strong className="text-white">0.4ms</strong></span>
                    <button
                      onClick={() => setActiveSlot(activeSlot === "green" ? "blue" : "green")}
                      className="rounded bg-white/10 px-2 py-1 text-[10px] text-white hover:bg-white/20 transition"
                    >
                      Simulate Cutover Swap ↺
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Dual Engine Docker & PM2 */}
        <div className="mt-28 grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:order-2 lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 font-mono text-xs text-neutral-300">
              Dual Execution Engine
            </div>
            <h3 className="text-2xl font-bold text-white sm:text-3xl">
              Docker containers or bare-metal PM2
            </h3>
            <p className="text-sm leading-relaxed text-neutral-300">
              Run full containerized stacks with Docker, or run processes directly on bare metal with
              PM2 for maximum performance and zero virtualization overhead.
            </p>
            <div className="space-y-2 pt-2 font-mono text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="text-white">✓</span>
                <span>Auto-detects Bun, pnpm, Node.js, Python (uv/poetry), Rust (Cargo), and Go</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white">✓</span>
                <span>Automatic ecosystem.config.cjs injection & dependency resolution</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white">✓</span>
                <span>Real-time CPU %, memory metrics, and PM2 process restart supervisor</span>
              </div>
            </div>
          </div>

          <div className="lg:order-1 lg:col-span-7">
            <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-800 bg-[#0a0a0a] px-4 py-2.5">
                <div className="flex gap-2">
                  <button
                    onClick={() => setRuntimeTab("pm2")}
                    className={`rounded px-3 py-1 font-mono text-xs transition ${
                      runtimeTab === "pm2"
                        ? "bg-white text-black font-bold"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Bare-Metal PM2 Engine
                  </button>
                  <button
                    onClick={() => setRuntimeTab("docker")}
                    className={`rounded px-3 py-1 font-mono text-xs transition ${
                      runtimeTab === "docker"
                        ? "bg-white text-black font-bold"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Docker Container Engine
                  </button>
                </div>
                <span className="font-mono text-[10px] text-neutral-500">AUTO-STACK DETECT</span>
              </div>

              <div className="p-5 font-mono text-xs leading-relaxed space-y-3 bg-[#070707]">
                {runtimeTab === "pm2" ? (
                  <>
                    <div className="flex items-center justify-between text-neutral-500 pb-2 border-b border-neutral-800">
                      <span>Stack: <strong className="text-white">Next.js / Bun Runtime</strong></span>
                      <span className="text-neutral-300">Engine: Host PM2 Supervisor</span>
                    </div>
                    <div className="space-y-1 text-neutral-300 text-[11px]">
                      <p className="text-neutral-500">$ versiongate deploy --runtime pm2</p>
                      <p className="text-neutral-400">[INFO] Detected bun.lockb — using Bun package manager</p>
                      <p className="text-neutral-400">[INFO] Injecting node_modules/.bin into execution PATH</p>
                      <p className="text-neutral-200">[PM2] App &apos;api-service-slot-a&apos; launched on host port 3201</p>
                      <p className="text-neutral-400">[METRICS] Memory: 62.4 MB | CPU: 0.2% | Uptime: 4d 12h</p>
                      <p className="text-white">[OK] Health check passed at http://127.0.0.1:3201/health</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-neutral-500 pb-2 border-b border-neutral-800">
                      <span>Stack: <strong className="text-white">Rust / Cargo Microservice</strong></span>
                      <span className="text-neutral-300">Engine: Docker Multi-Stage Build</span>
                    </div>
                    <div className="space-y-1 text-neutral-300 text-[11px]">
                      <p className="text-neutral-500">$ versiongate deploy --runtime docker</p>
                      <p className="text-neutral-400">[DOCKER] Synthesizing optimized multi-stage build</p>
                      <p className="text-neutral-400">[CACHE] Reusing layer hash 48ef9c (0.8s)</p>
                      <p className="text-neutral-200">[CONTAINER] Starting rust-worker:v14 on internal port 4001</p>
                      <p className="text-neutral-400">[PROBE] Testing container health via 127.0.0.1:4001/live</p>
                      <p className="text-white">[OK] Container status healthy. Zero host port collision.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3: Database Studio */}
        <div className="mt-28 grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 font-mono text-xs text-neutral-300">
              In-Browser Console
            </div>
            <h3 className="text-2xl font-bold text-white sm:text-3xl">
              Database studio built right in
            </h3>
            <p className="text-sm leading-relaxed text-neutral-300">
              Provision PostgreSQL, Redis, MySQL, or MongoDB in 1 click with persistent Docker
              volumes. Inspect table schemas, run raw SQL and Redis queries, and link credentials
              directly into your app environment variables without leaving the dashboard.
            </p>
            <div className="space-y-2 pt-2 font-mono text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="text-white">✓</span>
                <span>Interactive SQL, Redis, and Mongo query runners with execution telemetry</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white">✓</span>
                <span>Export live query records directly to JSON or CSV</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white">✓</span>
                <span>Automatic 1-click DATABASE_URL injection into project settings</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-800 bg-[#0a0a0a] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-neutral-900 border border-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold text-neutral-300">
                    POSTGRESQL 16
                  </span>
                  <span className="font-mono text-xs text-white">auth-database-cluster</span>
                </div>
                <button
                  onClick={runSampleQuery}
                  className="rounded bg-white px-3 py-1 font-mono text-[10px] font-bold text-black hover:bg-neutral-200 transition"
                >
                  {queryState === "running" ? "Running..." : "▶ Run SQL"}
                </button>
              </div>

              {/* SQL Editor Area */}
              <div className="p-4 bg-[#060606] border-b border-neutral-800 font-mono text-xs text-neutral-300">
                <code>SELECT id, name, environment, slot, status, latency_ms FROM deployments ORDER BY id DESC LIMIT 3;</code>
              </div>

              {/* Query Result Grid */}
              <div className="p-4 bg-[#0a0a0c] overflow-x-auto font-mono text-xs">
                <div className="text-[10px] text-neutral-500 mb-2 flex items-center justify-between">
                  <span>Query executed in <strong className="text-white">2.1 ms</strong> (3 rows returned)</span>
                  <span className="text-neutral-400">[ Export CSV ]</span>
                </div>
                <table className="w-full text-left text-neutral-300 text-[11px]">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-500">
                      <th className="pb-2">id</th>
                      <th className="pb-2">name</th>
                      <th className="pb-2">environment</th>
                      <th className="pb-2">slot</th>
                      <th className="pb-2">status</th>
                      <th className="pb-2">latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    <tr>
                      <td className="py-2 text-neutral-500">#492</td>
                      <td className="py-2 text-white">web-api</td>
                      <td className="py-2 text-neutral-400">production</td>
                      <td className="py-2 text-white font-semibold">slot_a</td>
                      <td className="py-2 text-white font-semibold">ACTIVE</td>
                      <td className="py-2 text-neutral-400">0.8 ms</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-neutral-500">#491</td>
                      <td className="py-2 text-white">web-api</td>
                      <td className="py-2 text-neutral-400">production</td>
                      <td className="py-2 text-neutral-400">slot_b</td>
                      <td className="py-2 text-neutral-400">STANDBY</td>
                      <td className="py-2 text-neutral-400">1.2 ms</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-neutral-500">#490</td>
                      <td className="py-2 text-white">billing-service</td>
                      <td className="py-2 text-neutral-400">production</td>
                      <td className="py-2 text-white font-semibold">slot_a</td>
                      <td className="py-2 text-white font-semibold">ACTIVE</td>
                      <td className="py-2 text-neutral-400">0.6 ms</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 4: Deployments Feed */}
        <div className="mt-28 grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:order-2 lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 font-mono text-xs text-neutral-300">
              Vercel-Style Observability
            </div>
            <h3 className="text-2xl font-bold text-white sm:text-3xl">
              Deployments you can actually read & debug
            </h3>
            <p className="text-sm leading-relaxed text-neutral-300">
              Clear, transparent deployment feeds that surface commit messages, Git authors, branch
              names, duration, and full live streaming logs — giving you the clarity you need to debug
              production releases in seconds.
            </p>
            <div className="space-y-2 pt-2 font-mono text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="text-white">✓</span>
                <span>Global and per-project deployment feeds with commit metadata</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white">✓</span>
                <span>Real-time WebSocket log streaming with ANSI color rendering</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white">✓</span>
                <span>One-click warm-swap rollback button on every historical release</span>
              </div>
            </div>
          </div>

          <div className="lg:order-1 lg:col-span-7">
            <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-800 bg-[#0a0a0a] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-white" />
                  <span className="font-mono text-xs font-semibold text-white">
                    Production Deployment // web-app
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-neutral-800 px-2 py-0.5 font-mono text-[10px] text-neutral-300">
                    Duration: 28s
                  </span>
                  <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] font-bold text-white border border-white/20">
                    READY
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4 bg-[#080808]">
                {/* Commit info bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-800/80 bg-[#0d0d0f] p-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-white">feat(auth): add bearer tokens & rate limiting</p>
                    <p className="font-mono text-[11px] text-neutral-400">
                      main @ <span className="text-white">8f3a9e4</span> by dinesh
                    </p>
                  </div>
                  <button className="rounded border border-neutral-700 bg-neutral-900 px-2.5 py-1 font-mono text-[11px] text-neutral-300 hover:text-white transition">
                    Instant Rollback ↺
                  </button>
                </div>

                {/* Log terminal */}
                <div className="rounded-lg border border-neutral-800 bg-black p-4 font-mono text-xs leading-relaxed space-y-1 text-neutral-400">
                  <p className="text-neutral-500">14:02:18 [QUEUE] Enqueued deployment job #job_77b2</p>
                  <p className="text-neutral-300">14:02:20 [BUILD] Compiling container image versiongate-app:v14</p>
                  <p className="text-neutral-300">14:02:34 [BOOT] Starting healthy container on idle slot green (port 3101)</p>
                  <p className="text-neutral-200">14:02:41 [HEALTH] GET http://127.0.0.1:3101/health → 200 OK (passed)</p>
                  <p className="text-white font-semibold">14:02:42 [NGINX] Atomic upstream rewrite: switched traffic to 3101</p>
                  <p className="text-neutral-400">14:02:44 [COMPLETE] Deployment live with 0ms downtime.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
