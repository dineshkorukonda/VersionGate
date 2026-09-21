import { useEffect, useMemo } from "react";
import { type ServerStats } from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useServerMetricHistory } from "@/hooks/use-server-metric-history";
import { useSystemHealth } from "@/hooks/use-system-health";
import { DonutChart } from "@/components/charts/DonutChart";
import { ServerNetworkLineChart, ServerResourceLineChart } from "@/components/charts/ServerLineCharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AggregateJobLogStream } from "@/components/AggregateJobLogStream";
import { extractVersionFromPreflightMessage, preflightStatusLabel } from "@/lib/preflight-display";
import { serviceLabelForPort } from "@/lib/port-labels";
import { cn } from "@/lib/utils";

function fmtBytes(n: number) {
  return n >= 1e9 ? `${(n / 1e9).toFixed(2)} GB` : n >= 1e6 ? `${(n / 1e6).toFixed(2)} MB` : `${Math.round(n)} B`;
}

function hostnameHint(): string {
  if (typeof window === "undefined") return "this host";
  return window.location.hostname || "this host";
}

export function SystemHealth() {
  const { data, isLoading, isFetching, isError, error, refetch } = useSystemHealth();
  const { history, push } = useServerMetricHistory();

  const preflight = data?.preflight ?? null;
  const dashboard = data?.dashboard ?? null;
  const engineHealth = data?.engineHealth ?? null;
  const stats = dashboard?.system_stats ?? null;

  useEffect(() => {
    if (stats) {
      push(stats as ServerStats);
    }
  }, [stats, push]);

  const securityItems = useMemo(() => {
    const items: { severity: "high" | "medium" | "low"; source: string; message: string }[] = [];
    if (preflight) {
      for (const c of preflight.checks) {
        if (c.ok) continue;
        if (c.severity === "required") items.push({ severity: "high", source: c.label, message: c.message });
        else if (c.severity === "recommended")
          items.push({ severity: "medium", source: c.label, message: c.message });
        else items.push({ severity: "low", source: c.label, message: c.message });
      }
    }
    if (dashboard?.alerts?.length) {
      for (const a of dashboard.alerts) {
        items.push({ severity: a.severity, source: a.type, message: a.message });
      }
    }
    return items;
  }, [preflight, dashboard]);

  if (isLoading) {
    return (
      <div className="w-full space-y-6" role="status" aria-live="polite">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center" role="alert">
        <p className="text-sm text-neutral-300">
          {error instanceof Error ? error.message : "Failed to load system health telemetry."}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isFetching}
          onClick={() => void refetch()}
          className="border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white text-xs"
        >
          {isFetching ? "Retrying..." : "Retry"}
        </Button>
      </div>
    );
  }

  const loadAvg = stats.load_avg?.map((x) => x.toFixed(2)).join(" / ") ?? "—";
  const memFree = Math.max(0, 100 - stats.memory_percent);
  const ports = dashboard?.listening_ports ?? [];
  const connections = dashboard?.connections ?? [];
  const processes = dashboard?.top_processes ?? [];
  const sentRate = stats.network_sent_rate ?? 0;
  const recvRate = stats.network_recv_rate ?? 0;

  return (
    <div className="w-full space-y-8 font-sans">
      <div className="flex flex-col gap-4 border-b border-neutral-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span>System</span>
            <span>/</span>
            <span className="text-neutral-200">Observability</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            System Health & Telemetry
          </h1>
          <p className="text-xs text-neutral-400">
            Real-time host resource allocation and background daemon signals on{" "}
            <span className="font-mono text-neutral-300">{hostnameHint()}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => void refetch()}
            className="border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:text-white text-xs h-8"
          >
            {isFetching ? "Scanning..." : "Re-run Checks"}
          </Button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-800 bg-[#0a0a0a] p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>CPU Utilization</span>
            <span className="font-mono text-neutral-500">load {loadAvg}</span>
          </div>
          <p className="font-mono text-2xl font-bold text-white">{stats.cpu_percent.toFixed(1)}%</p>
          <Progress value={Math.min(100, stats.cpu_percent)} className="h-1 bg-neutral-800" />
        </div>

        <div className="rounded-xl border border-neutral-800 bg-[#0a0a0a] p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Memory Allocation</span>
            <span className="font-mono text-[11px] text-neutral-500">
              {fmtBytes(stats.memory_used)} / {fmtBytes(stats.memory_total)}
            </span>
          </div>
          <p className="font-mono text-2xl font-bold text-white">{stats.memory_percent.toFixed(1)}%</p>
          <Progress value={Math.min(100, stats.memory_percent)} className="h-1 bg-neutral-800" />
        </div>

        <div className="rounded-xl border border-neutral-800 bg-[#0a0a0a] p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Disk Space Used</span>
            <span className="font-mono text-[11px] text-neutral-500">root filesystem</span>
          </div>
          <p className="font-mono text-2xl font-bold text-white">{stats.disk_percent.toFixed(1)}%</p>
          <Progress value={Math.min(100, stats.disk_percent)} className="h-1 bg-neutral-800" />
        </div>

        <div className="rounded-xl border border-neutral-800 bg-[#0a0a0a] p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Network Throughput</span>
            <span className="font-mono text-[11px] text-neutral-500">live I/O delta</span>
          </div>
          <p className="font-mono text-xl font-bold text-white">
            ↑{fmtBytes(sentRate)}/s · ↓{fmtBytes(recvRate)}/s
          </p>
          <Progress
            value={Math.min(100, ((sentRate + recvRate) / (1024 * 1024)) * 15)}
            className="h-1 bg-neutral-800"
          />
        </div>
      </section>

      {engineHealth ? (
        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-semibold text-white">Engine Control Plane</h3>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border",
                    engineHealth.status === "ok"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      engineHealth.status === "ok" ? "bg-emerald-500" : "bg-amber-500"
                    )}
                  />
                  {engineHealth.status.toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-neutral-500 font-mono">Telemetry Daemon Active</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 pt-1">
              <div className="rounded-lg border border-neutral-800 bg-black/40 p-4">
                <span className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">
                  Database Link
                </span>
                <p className="mt-1 font-mono text-sm font-semibold text-white">
                  {engineHealth.database.connected
                    ? `Connected (${engineHealth.database.latencyMs}ms latency)`
                    : "Disconnected"}
                </p>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-black/40 p-4">
                <span className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">
                  Pub/Sub Event Bus
                </span>
                <p className="mt-1 font-mono text-sm font-semibold text-white">
                  {engineHealth.redis.connected ? "Active & Synchronized" : "Local Event Loop"}
                </p>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-black/40 p-4">
                <span className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">
                  Container Fleet
                </span>
                <p className="mt-1 font-mono text-sm font-semibold text-white">
                  {engineHealth.containers.healthyCount} / {engineHealth.containers.totalActive} healthy slots
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
            Host daemon continuously watches container memory pressure and port allocation.
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Host Toolchain & Dependencies</h3>
            <p className="mt-1 text-xs text-neutral-400">
              Preflight verification of Docker, Git, Bun, reverse proxy, and essential host utilities.
            </p>
          </div>
          {preflight && (
            <span className="text-xs text-neutral-500 font-mono">
              Last checked {new Date(preflight.checkedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        {preflight ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800 text-neutral-500 text-xs">
                  <TableHead className="pl-6">Dependency</TableHead>
                  <TableHead>Detected Version</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead className="pr-6 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preflight.checks.map((c) => {
                  const ver = extractVersionFromPreflightMessage(c.message);
                  const st = preflightStatusLabel(c);
                  return (
                    <TableRow key={c.id} className="border-neutral-800/50 text-xs hover:bg-neutral-900/40">
                      <TableCell className="pl-6 font-medium text-white">{c.label}</TableCell>
                      <TableCell className="font-mono text-neutral-300">{ver}</TableCell>
                      <TableCell className="text-neutral-400">Local Node</TableCell>
                      <TableCell className="pr-6 text-right">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border",
                            c.ok
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full shrink-0",
                              c.ok ? "bg-emerald-500" : "bg-amber-500"
                            )}
                          />
                          {st}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-neutral-500">
            Could not fetch preflight dependency checks.
          </div>
        )}

        <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
          All mandatory tools must be present for Docker and PM2 builds to succeed.
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a] lg:col-span-2">
          <div className="p-6">
            <h3 className="text-base font-semibold text-white">Host Resource History</h3>
            <p className="mt-1 text-xs text-neutral-400">Utilization over time (%).</p>
            <div className="mt-4">
              <ServerResourceLineChart data={history} />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
          <div className="p-6">
            <h3 className="text-base font-semibold text-white">Memory Allocation</h3>
            <p className="mt-1 text-xs text-neutral-400">Used vs free memory.</p>
            <div className="mt-4 flex justify-center">
              <DonutChart
                data={[
                  { name: "Used", value: stats.memory_percent },
                  { name: "Free", value: memFree },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
        <div className="p-6">
          <h3 className="text-base font-semibold text-white">Network Bandwidth Rate</h3>
          <p className="mt-1 text-xs text-neutral-400">Transmission and receipt deltas.</p>
          <div className="mt-4">
            <ServerNetworkLineChart data={history} />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Active Listening Ports</h3>
            <p className="mt-1 text-xs text-neutral-400">
              Host socket bindings inspected via <code className="font-mono text-neutral-300">ss -tln</code>.
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-500">{ports.length} sockets open</span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-800 text-neutral-500 text-xs">
                <TableHead className="pl-6">Port</TableHead>
                <TableHead>Identified Service</TableHead>
                <TableHead>Binding Address</TableHead>
                <TableHead className="pr-6 text-right">Exposure</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ports.map((p, i) => {
                const pub =
                  p.address === "*" ||
                  p.address === "0.0.0.0" ||
                  p.address === "[::]" ||
                  p.address === "::";
                return (
                  <TableRow key={`${p.address}-${p.port}-${i}`} className="border-neutral-800/50 text-xs hover:bg-neutral-900/40">
                    <TableCell className="pl-6 font-mono font-semibold text-white">:{p.port}</TableCell>
                    <TableCell className="text-neutral-300">{serviceLabelForPort(p.port)}</TableCell>
                    <TableCell className="font-mono text-neutral-400">{p.address}</TableCell>
                    <TableCell className="pr-6 text-right">
                      {pub ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-400">
                          <span className="size-1.5 rounded-full bg-sky-400" />
                          Public Internet
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-neutral-400">
                          <span className="size-1.5 rounded-full bg-neutral-600" />
                          Loopback Only
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
          Reverse proxy automatically shields private blue/green ports behind Nginx.
        </div>
      </div>

      {connections.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
          <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Active TCP Connections</h3>
              <p className="mt-1 text-xs text-neutral-400">
                Live peer connections sampled from the network socket table.
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-500">{connections.length} established</span>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800 text-neutral-500 text-xs">
                  <TableHead className="pl-6">Local Address</TableHead>
                  <TableHead>Remote Address</TableHead>
                  <TableHead className="pr-6 text-right">Socket State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.slice(0, 15).map((c, i) => (
                  <TableRow key={`${c.local_address}-${c.remote_address}-${i}`} className="border-neutral-800/50 text-xs hover:bg-neutral-900/40">
                    <TableCell className="pl-6 font-mono text-neutral-300">{c.local_address}</TableCell>
                    <TableCell className="font-mono text-neutral-400">{c.remote_address}</TableCell>
                    <TableCell className="pr-6 text-right font-mono text-neutral-400">{c.state}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
            Showing top 15 sampled TCP sockets.
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
        <div className="p-6 border-b border-neutral-800">
          <h3 className="text-base font-semibold text-white">Host Top Processes</h3>
          <p className="mt-1 text-xs text-neutral-400">
            Resource intensive processes sampled from host cgroups.
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-800 text-neutral-500 text-xs">
                <TableHead className="pl-6">PID</TableHead>
                <TableHead>Process Name</TableHead>
                <TableHead>CPU %</TableHead>
                <TableHead className="pr-6 text-right">Memory %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processes.slice(0, 15).map((p) => (
                <TableRow key={`${p.pid}-${p.name}`} className="border-neutral-800/50 text-xs hover:bg-neutral-900/40">
                  <TableCell className="pl-6 font-mono text-neutral-400">#{p.pid}</TableCell>
                  <TableCell className="max-w-[240px] truncate font-mono text-white font-medium">
                    {p.name}
                  </TableCell>
                  <TableCell className="font-mono text-neutral-300">{p.cpu_percent.toFixed(1)}%</TableCell>
                  <TableCell className="pr-6 text-right font-mono text-neutral-300">
                    {p.memory_percent.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
          Showing top 15 host processes sorted by utilization.
        </div>
      </div>

      {securityItems.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-amber-500/30 bg-[#0a0a0a]">
          <div className="p-6 border-b border-neutral-800">
            <h3 className="text-base font-semibold text-amber-400">Security & Resource Signals</h3>
            <p className="mt-1 text-xs text-neutral-400">Open warnings reported by preflight inspection.</p>
          </div>

          <div className="divide-y divide-neutral-800">
            {securityItems.map((item, i) => (
              <div key={`${item.source}-${i}`} className="p-4 flex items-start gap-3">
                <span className="mt-0.5 size-2 rounded-full bg-amber-500 shrink-0" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-white text-xs">{item.source}</span>
                  <p className="text-xs text-neutral-400">{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Global Cluster Logs</h3>
        <AggregateJobLogStream title="Main cluster logs (job tail)" pollMs={6000} />
      </div>
    </div>
  );
}
