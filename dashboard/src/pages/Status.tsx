import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getSystemStatusOverview,
  checkAutoDeploy,
  type ComprehensiveStatusReport,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export function Status() {
  const [report, setReport] = useState<ComprehensiveStatusReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingSync, setCheckingSync] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deployingProjectId, setDeployingProjectId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "OUT_OF_SYNC" | "HEALTHY" | "PM2" | "DOCKER">("ALL");

  const loadStatus = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await getSystemStatusOverview();
      setReport(data);
    } catch (err: unknown) {
      if (!silent) {
        toast.error(err instanceof Error ? err.message : "Failed to load system status");
      }
    } finally {
      if (!silent) setLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadStatus();
    const interval = setInterval(() => {
      void loadStatus(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRunAutoDeployCheck = async (projectId?: string) => {
    setCheckingSync(true);
    try {
      const res = await checkAutoDeploy({ projectId, forceDeploy: false });
      const triggered = res.results.filter((r) => r.deployTriggered);
      if (triggered.length > 0) {
        toast.success(`[ AUTO-DEPLOY ] Enqueued ${triggered.length} auto-deploy job(s) for updated commits`);
      } else {
        toast.success("[ OK ] All projects are fully synced with latest commits");
      }
      await loadStatus(true);
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "Auto-deploy check failed");
    } finally {
      setCheckingSync(false);
    }
  };

  const handleForceDeploy = async (projectId: string) => {
    setDeployingProjectId(projectId);
    try {
      const res = await checkAutoDeploy({ projectId, forceDeploy: true });
      const triggered = res.results.find((r) => r.projectId === projectId && r.deployTriggered);
      if (triggered) {
        toast.success(`[ DEPLOY ENQUEUED ] Job ${triggered.jobId?.slice(0, 8)} started for ${triggered.projectName}`);
      } else {
        toast.info("Deploy triggered");
      }
      await loadStatus(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to trigger deployment");
    } finally {
      setDeployingProjectId(null);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return "—";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  const filteredApps = (report?.applications ?? []).filter((app) => {
    if (filter === "OUT_OF_SYNC") return !app.isCommitSynced && app.latestCommit?.sha;
    if (filter === "HEALTHY") return app.status === "healthy";
    if (filter === "PM2") return app.serviceType === "pm2";
    if (filter === "DOCKER") return app.serviceType === "docker";
    return true;
  });

  return (
    <div className="w-full space-y-8 font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-neutral-800 pb-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-neutral-500 uppercase tracking-wider">
              01 // SYSTEM & APPLICATION STATUS
            </span>
            {report?.overallStatus === "operational" ? (
              <span className="rounded border border-emerald-500/40 bg-emerald-950/40 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
                [ ALL SYSTEMS OPERATIONAL ]
              </span>
            ) : report?.overallStatus === "degraded" ? (
              <span className="rounded border border-amber-500/40 bg-amber-950/40 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-400">
                [ SYSTEM DEGRADED ]
              </span>
            ) : (
              <span className="rounded border border-rose-500/40 bg-rose-950/40 px-2 py-0.5 font-mono text-[11px] font-semibold text-rose-400">
                [ SERVICE OUTAGE ]
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Functions & Subsystems Status
          </h1>
          <p className="text-sm text-neutral-400">
            Real-time telemetry, core engine subsystems, and commit-driven auto-deployment synchronization for all managed applications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={checkingSync}
            onClick={() => handleRunAutoDeployCheck()}
            className="border-neutral-800 bg-neutral-900 font-mono text-xs text-neutral-300 hover:text-white"
          >
            {checkingSync ? "[ Checking Commits... ]" : "[ Check & Sync Auto-Deploy ]"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={refreshing}
            onClick={() => void loadStatus(true)}
            className="border-neutral-800 font-mono text-xs text-neutral-400 hover:text-white"
          >
            {refreshing ? "[ Refreshing... ]" : "[ Refresh ]"}
          </Button>
        </div>
      </div>

      {loading && !report ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl bg-neutral-900" />
          <Skeleton className="h-64 w-full rounded-xl bg-neutral-900" />
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Card className="border-neutral-800 bg-[#0a0a0a]">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="font-mono text-[11px] text-neutral-500 uppercase">
                  Subsystems
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="font-mono text-xl font-bold text-white">
                  {report?.summary.operationalSubsystems} / {report?.summary.totalSubsystems}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">[ Operational ]</div>
              </CardContent>
            </Card>

            <Card className="border-neutral-800 bg-[#0a0a0a]">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="font-mono text-[11px] text-neutral-500 uppercase">
                  Applications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="font-mono text-xl font-bold text-white">
                  {report?.summary.healthyApplications} / {report?.summary.totalApplications}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                  {report?.summary.outOfSyncApplications ? (
                    <span className="text-amber-400 font-semibold">
                      {report.summary.outOfSyncApplications} pending deploy
                    </span>
                  ) : (
                    <span className="text-emerald-400">[ All Synced ]</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-800 bg-[#0a0a0a]">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="font-mono text-[11px] text-neutral-500 uppercase">
                  Auto-Deploy
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="font-mono text-xl font-bold text-emerald-400">
                  {report?.summary.autoDeployActiveCount} Active
                </div>
                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">[ Every Commit ]</div>
              </CardContent>
            </Card>

            <Card className="border-neutral-800 bg-[#0a0a0a]">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="font-mono text-[11px] text-neutral-500 uppercase">
                  Host CPU
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="font-mono text-xl font-bold text-white">
                  {report?.systemTelemetry.cpuPercent.toFixed(1)}%
                </div>
                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                  Load: {report?.systemTelemetry.loadAvg.map((l) => l.toFixed(2)).join(", ")}
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-800 bg-[#0a0a0a]">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="font-mono text-[11px] text-neutral-500 uppercase">
                  Host Memory
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="font-mono text-xl font-bold text-white">
                  {report?.systemTelemetry.memoryPercent.toFixed(1)}%
                </div>
                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                  {formatBytes(report?.systemTelemetry.memoryUsed)} used
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-800 bg-[#0a0a0a]">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="font-mono text-[11px] text-neutral-500 uppercase">
                  Uptime
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="font-mono text-xl font-bold text-white">
                  {Math.floor((report?.uptime ?? 0) / 86400)}d {Math.floor(((report?.uptime ?? 0) % 86400) / 3600)}h
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">[ Zero Downtime ]</div>
              </CardContent>
            </Card>
          </div>

          {/* Section 1: Commit-Driven Auto-Deployment Validator */}
          <Card className="border-neutral-800 bg-[#0a0a0a]">
            <CardHeader className="border-b border-neutral-800/80 pb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="font-mono text-sm uppercase tracking-wider text-white">
                    02 // Auto-Deployment & Commit Synchronization Checker
                  </CardTitle>
                  <CardDescription className="text-xs text-neutral-400">
                    Monitors every Git commit pushed to your GitHub repositories and ensures VersionGate triggers automated zero-downtime Blue/Green deployments.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 p-1">
                  {(["ALL", "OUT_OF_SYNC", "HEALTHY", "PM2", "DOCKER"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setFilter(tab)}
                      className={`rounded px-2.5 py-1 font-mono text-[10px] uppercase font-medium transition-colors ${
                        filter === tab
                          ? "bg-neutral-800 text-white font-semibold"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      {tab.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead className="border-b border-neutral-800 text-[11px] font-mono uppercase text-neutral-500">
                    <tr>
                      <th className="px-5 py-3">Application</th>
                      <th className="px-4 py-3">Runtime</th>
                      <th className="px-4 py-3">Active Slot / Port</th>
                      <th className="px-4 py-3">Git Branch</th>
                      <th className="px-4 py-3">Latest Commit</th>
                      <th className="px-4 py-3">Deployed Commit</th>
                      <th className="px-4 py-3">Sync Status</th>
                      <th className="px-4 py-3">Telemetry</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                    {filteredApps.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-8 text-center text-xs text-neutral-500 font-mono">
                          No applications found matching the current filter.
                        </td>
                      </tr>
                    ) : (
                      filteredApps.map((app) => (
                        <tr key={app.projectId} className="hover:bg-neutral-900/40 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`size-2 rounded-full ${
                                  app.status === "healthy"
                                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                                    : app.status === "degraded"
                                    ? "bg-amber-400 animate-pulse"
                                    : "bg-rose-400"
                                }`}
                              />
                              <div>
                                <Link
                                  to={`/projects/${app.projectId}`}
                                  className="font-semibold text-white hover:underline text-sm"
                                >
                                  {app.projectName}
                                </Link>
                                <div className="text-[10px] text-neutral-500 font-mono truncate max-w-[200px]">
                                  {app.repoUrl.replace(/^https?:\/\/(www\.)?/, "")}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="rounded border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 font-mono text-[10px] uppercase text-neutral-300">
                              {app.serviceType}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 font-mono text-xs">
                            {app.activeDeployment ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-emerald-400 font-bold">
                                  v{app.activeDeployment.version}
                                </span>
                                <span className="rounded bg-neutral-900 px-1 py-0.2 text-[9px] text-neutral-400 uppercase">
                                  {app.activeDeployment.color}
                                </span>
                                {app.activePort && (
                                  <span className="text-neutral-400 text-[11px]">
                                    :{app.activePort}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-neutral-500">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 font-mono text-xs text-neutral-400">
                            {app.branch}
                          </td>

                          <td className="px-4 py-3.5 font-mono text-xs">
                            {app.latestCommit ? (
                              <div>
                                <span className="text-neutral-200 font-bold">
                                  {app.latestCommit.sha.slice(0, 7)}
                                </span>
                                <div className="text-[10px] text-neutral-500 truncate max-w-[150px]" title={app.latestCommit.message}>
                                  {app.latestCommit.message}
                                </div>
                              </div>
                            ) : (
                              <span className="text-neutral-500">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 font-mono text-xs">
                            {app.activeDeployment?.commitSha ? (
                              <span className="text-neutral-300">
                                {app.activeDeployment.commitSha.slice(0, 7)}
                              </span>
                            ) : (
                              <span className="text-neutral-500">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 font-mono text-xs">
                            {app.isCommitSynced ? (
                              <span className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                                [ SYNCED ]
                              </span>
                            ) : app.latestCommit?.sha ? (
                              <span className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-950/40 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                                [ PENDING DEPLOY ]
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[10px] text-neutral-400">
                                [ UNINITIALIZED ]
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 font-mono text-[11px] text-neutral-400">
                            {app.metrics?.memoryBytes ? (
                              <div>
                                <span>{formatBytes(app.metrics.memoryBytes)}</span>
                                {app.metrics.cpuPercent !== undefined && (
                                  <span className="text-neutral-500 block text-[10px]">
                                    CPU: {app.metrics.cpuPercent}%
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span>—</span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5 font-mono">
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                disabled={deployingProjectId === app.projectId}
                                onClick={() => void handleForceDeploy(app.projectId)}
                                className="border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white text-[10px]"
                              >
                                {deployingProjectId === app.projectId ? "[ Deploying... ]" : "[ Deploy ]"}
                              </Button>
                              <Link
                                to={`/projects/${app.projectId}`}
                                className="rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-[10px] text-neutral-400 hover:text-white"
                              >
                                [ Manage ]
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Core Subsystems & Engine Functions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-mono text-sm uppercase tracking-wider text-white">
                  03 // Engine Subsystems & Core Functions
                </h2>
                <p className="text-xs text-neutral-400">
                  Status of all underlying orchestration components, network layers, and runtime processes.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(report?.subsystems ?? []).map((sub) => (
                <Card key={sub.id} className="border-neutral-800 bg-[#0a0a0a] transition-all hover:border-neutral-700">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">
                          {sub.category}
                        </span>
                        <CardTitle className="text-sm font-semibold text-white">
                          {sub.name}
                        </CardTitle>
                      </div>
                      <span
                        className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase font-semibold ${
                          sub.status === "operational"
                            ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-400"
                            : sub.status === "degraded"
                            ? "border-amber-500/40 bg-amber-950/40 text-amber-400"
                            : sub.status === "unconfigured"
                            ? "border-neutral-700 bg-neutral-900 text-neutral-400"
                            : "border-rose-500/40 bg-rose-950/40 text-rose-400"
                        }`}
                      >
                        [{sub.status}]
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 space-y-2">
                    <p className="text-xs text-neutral-400">
                      {sub.description}
                    </p>
                    {sub.latencyMs !== undefined && (
                      <div className="font-mono text-[11px] text-neutral-500">
                        Latency: <span className="text-emerald-400 font-bold">{sub.latencyMs}ms</span>
                      </div>
                    )}
                    {sub.details && Object.keys(sub.details).length > 0 && (
                      <div className="rounded bg-neutral-950 p-2 font-mono text-[10px] text-neutral-500 space-y-0.5 border border-neutral-900">
                        {Object.entries(sub.details).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span>{k}:</span>
                            <span className="text-neutral-300 font-semibold">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
