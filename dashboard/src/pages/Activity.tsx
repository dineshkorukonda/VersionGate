import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DonutChart } from "@/components/charts/DonutChart";
import { ActivityLineChart, type ActivityDayPoint } from "@/components/charts/ActivityLineChart";
import { Link } from "react-router-dom";
import { type JobRecord } from "@/lib/api";
import { useAllDeployments } from "@/hooks/use-deployments";
import { useRecentJobs } from "@/hooks/use-recent-jobs";
import { queryKeys } from "@/hooks/query-keys";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { AggregateJobLogStream } from "@/components/AggregateJobLogStream";
import { DeploymentList } from "@/components/DeploymentList";
import {
  DeploymentLogFilters,
  filterDeployments,
  type DeploymentEnvFilter,
  type DeploymentStatusFilter,
} from "@/components/DeploymentLogFilters";
import { jobArtifactLabel } from "@/lib/job-display";
import { sortDeploymentsNewestFirst } from "@/lib/deployment-log-display";
import { cn } from "@/lib/utils";

function buildLast7DayBuckets(jobs: JobRecord[]): ActivityDayPoint[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);
  const keys: string[] = [];
  const labelByKey = new Map<string, string>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    keys.push(key);
    labelByKey.set(
      key,
      d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    );
  }
  const counts = new Map<string, ActivityDayPoint>();
  for (const key of keys) {
    counts.set(key, { day: labelByKey.get(key) ?? key, deploy: 0, rollback: 0, other: 0 });
  }
  for (const j of jobs) {
    const key = j.createdAt.slice(0, 10);
    const row = counts.get(key);
    if (!row) continue;
    const t = j.type.toUpperCase();
    if (t.includes("ROLLBACK")) row.rollback += 1;
    else if (t.includes("DEPLOY") || t.includes("PROMOTE")) row.deploy += 1;
    else row.other += 1;
  }
  return keys.map((k) => counts.get(k)!);
}

function exportJobsCsv(jobs: JobRecord[]) {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const header = ["createdAt", "projectId", "projectName", "type", "status", "artifactHint", "error"];
  const lines = [header.join(",")];
  for (const j of jobs) {
    lines.push(
      [
        esc(j.createdAt),
        esc(j.projectId),
        esc(j.project?.name ?? ""),
        esc(j.type),
        esc(j.status),
        esc(jobArtifactLabel(j)),
        esc(j.error ?? ""),
      ].join(",")
    );
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `versiongate-activity-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Exported activity CSV");
}

export function Activity() {
  const queryClient = useQueryClient();
  const { data: jobsData, isLoading: jobsLoading, isError: jobsError, isFetching: jobsFetching } = useRecentJobs(200);
  const { data: deployments = [], isLoading: deploymentsLoading, isFetching: deploymentsFetching } = useAllDeployments();
  const [activeTab, setActiveTab] = useState<"deployments" | "jobs">("deployments");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [depStatusFilter, setDepStatusFilter] = useState<DeploymentStatusFilter>("all");
  const [depEnvFilter, setDepEnvFilter] = useState<DeploymentEnvFilter>("all");
  const [chartMode, setChartMode] = useState<"all" | "deploy" | "rollback">("all");

  const jobs = jobsData?.jobs ?? [];
  const total = jobsData?.total ?? 0;
  const loading = jobsLoading || deploymentsLoading;
  const refreshing = jobsFetching || deploymentsFetching;

  useEffect(() => {
    if (jobsError) {
      toast.error("Failed to load activity");
    }
  }, [jobsError]);

  const filteredJobs = useMemo(() => {
    if (statusFilter === "all") return jobs;
    return jobs.filter((j) => j.status === statusFilter);
  }, [jobs, statusFilter]);

  const jobsByStatus = useMemo(() => {
    const m = new Map<string, number>();
    for (const j of jobs) {
      m.set(j.status, (m.get(j.status) ?? 0) + 1);
    }
    return [...m.entries()].map(([name, value]) => ({ name, value }));
  }, [jobs]);

  const dayBuckets = useMemo(() => buildLast7DayBuckets(jobs), [jobs]);

  const peak = useMemo(() => {
    let max = 0;
    for (const d of dayBuckets) max = Math.max(max, d.deploy + d.rollback + d.other);
    return max;
  }, [dayBuckets]);

  const filteredDeployments = useMemo(() => {
    const sorted = sortDeploymentsNewestFirst(deployments);
    return filterDeployments(sorted, depStatusFilter, depEnvFilter);
  }, [deployments, depStatusFilter, depEnvFilter]);

  const successRate = useMemo(() => {
    let ok = 0;
    let done = 0;
    for (const j of jobs) {
      if (j.status === "COMPLETE" || j.status === "FAILED" || j.status === "CANCELLED") {
        done++;
        if (j.status === "COMPLETE") ok++;
      }
    }
    if (done === 0) return null;
    return ((ok / done) * 100).toFixed(1);
  }, [jobs]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.recent(200) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.deployments.all });
  };

  return (
    <div className="w-full space-y-8 font-sans">
      <div className="flex flex-col gap-4 border-b border-neutral-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span>Audit</span>
            <span>/</span>
            <span className="text-neutral-200">Activity</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Activity & Event Log
          </h1>
          <p className="text-xs text-neutral-400">
            Global deployment events, automated builds, and rollback audit history across all projects.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-md border border-neutral-800 bg-black px-2.5 text-xs text-neutral-300 outline-none hover:border-neutral-700"
          >
            <option value="all">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="RUNNING">Running</option>
            <option value="COMPLETE">Complete</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:text-white text-xs h-8"
            onClick={() => exportJobsCsv(filteredJobs)}
          >
            Export CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:text-white text-xs h-8"
            onClick={refresh}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {!loading && jobs.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
            <div className="p-6 border-b border-neutral-800">
              <h3 className="text-base font-semibold text-white">Jobs by Status</h3>
              <p className="mt-1 text-xs text-neutral-400">
                Loaded {jobs.length} recent jobs ({total} total in database)
              </p>
            </div>
            <div className="p-6 flex justify-center">
              <DonutChart data={jobsByStatus} />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
            <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Execution Frequency (7 Days)</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  Peak: {peak} jobs/day · Success: {successRate != null ? `${successRate}%` : "—"}
                </p>
              </div>

              <div className="flex rounded-md border border-neutral-800 bg-black p-0.5">
                {(["all", "deploy", "rollback"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setChartMode(m)}
                    className={cn(
                      "rounded px-2 py-0.5 text-xs font-medium transition-colors capitalize",
                      chartMode === m ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6">
              <ActivityLineChart data={dayBuckets} highlight={chartMode} />
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex border-b border-neutral-800 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("deployments")}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === "deployments"
                ? "border-white text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            )}
          >
            Deployments ({deployments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("jobs")}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === "jobs"
                ? "border-white text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            )}
          >
            Jobs History ({jobs.length})
          </button>
        </div>

        {loading && (activeTab === "jobs" ? jobs.length === 0 : deployments.length === 0) ? (
          <div className="space-y-2 p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : activeTab === "jobs" ? (
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-neutral-800 text-neutral-500 text-xs">
                    <TableHead className="pl-6">Timestamp</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-6 text-right">Logs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-16 text-center text-xs text-neutral-500">
                        No jobs match this filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredJobs.map((job) => (
                      <TableRow key={job.id} className="border-neutral-800/50 text-xs hover:bg-neutral-900/40">
                        <TableCell className="pl-6 text-neutral-400">
                          {new Date(job.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium text-white">
                          <Link to={`/projects/${job.projectId}`} className="hover:underline text-white font-semibold">
                            {job.project?.name ?? "—"}
                          </Link>
                          <div className="font-mono text-[11px] text-neutral-500">
                            commit: {jobArtifactLabel(job)}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-neutral-300">{job.type}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border",
                              job.status === "COMPLETE"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                : job.status === "FAILED"
                                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                                  : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full shrink-0",
                                job.status === "COMPLETE"
                                  ? "bg-emerald-500"
                                  : job.status === "FAILED"
                                    ? "bg-red-500"
                                    : "bg-amber-500"
                              )}
                            />
                            {job.status}
                          </span>
                          {job.error ? (
                            <p className="mt-1 max-w-md truncate font-mono text-[11px] text-red-400" title={job.error}>
                              {job.error}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <Link
                            to={`/projects/${job.projectId}/deploy/${job.id}`}
                            className="inline-flex items-center justify-center rounded-md border border-neutral-800 bg-neutral-900/80 px-2.5 py-1 text-xs text-neutral-300 hover:text-white transition-colors"
                          >
                            View Log
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
              Showing {filteredJobs.length} of {total} jobs
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <DeploymentLogFilters
              statusFilter={depStatusFilter}
              envFilter={depEnvFilter}
              onStatusChange={setDepStatusFilter}
              onEnvChange={setDepEnvFilter}
              onClear={() => {
                setDepStatusFilter("all");
                setDepEnvFilter("all");
              }}
              count={filteredDeployments.length}
            />
            <DeploymentList
              deployments={filteredDeployments}
              showProject
              emptyMessage="No deployments match your filters."
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Live Aggregate System Stream</h3>
        <AggregateJobLogStream title="Aggregate job tail" pollMs={6000} />
      </div>
    </div>
  );
}
