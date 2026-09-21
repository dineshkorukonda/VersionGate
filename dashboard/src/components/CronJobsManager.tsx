import { useState, useEffect } from "react";
import {
  listCronJobs,
  createCronJob,
  updateCronJob,
  deleteCronJob,
  triggerCronJob,
  getCronJobLogs,
  getServerCapacitySpecs,
  type CronJob,
  type CronJobLog,
  type ServerCapacitySpecs,
  type Project,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  projectId?: string;
  project?: Project | null;
  projects?: Project[];
}

const CRON_PRESETS = [
  { label: "Every Minute", value: "* * * * *" },
  { label: "Every 5 Min", value: "*/5 * * * *" },
  { label: "Every 15 Min", value: "*/15 * * * *" },
  { label: "Hourly", value: "0 * * * *" },
  { label: "Daily", value: "0 0 * * *" },
  { label: "Weekly", value: "0 0 * * 1" },
];

export function CronJobsManager({ projectId, projects = [] }: Props) {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [specs, setSpecs] = useState<ServerCapacitySpecs | null>(null);

  // Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState("*/15 * * * *");
  const [targetType, setTargetType] = useState<"HTTP" | "COMMAND">("HTTP");
  const [httpMethod, setHttpMethod] = useState<"GET" | "POST" | "PUT">("GET");
  const [httpPath, setHttpPath] = useState("/api/cron");
  const [command, setCommand] = useState("");
  const [timeoutSeconds, setTimeoutSeconds] = useState(60);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || "");
  const [deleteTarget, setDeleteTarget] = useState<CronJob | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Logs Drawer State
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [activeJobForLogs, setActiveJobForLogs] = useState<CronJob | null>(null);
  const [logs, setLogs] = useState<CronJobLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [triggeringJobId, setTriggeringJobId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await listCronJobs(projectId);
      setJobs(res.cronJobs || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load cron jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchJobs();
    void getServerCapacitySpecs()
      .then((data: ServerCapacitySpecs) => setSpecs(data))
      .catch(() => {});
  }, [projectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please provide a name for this cron job");
      return;
    }
    if (!schedule.trim() || schedule.trim().split(/\s+/).length !== 5) {
      toast.error("Schedule must be a valid 5-part cron expression (e.g. */15 * * * *)");
      return;
    }
    if (targetType === "COMMAND" && !command.trim()) {
      toast.error("Please specify a shell command to execute");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createCronJob({
        name: name.trim(),
        schedule: schedule.trim(),
        targetType,
        httpMethod: targetType === "HTTP" ? httpMethod : undefined,
        httpPath: targetType === "HTTP" ? httpPath.trim() || "/" : undefined,
        command: targetType === "COMMAND" ? command.trim() : undefined,
        timeoutSeconds,
        projectId: selectedProjectId || projectId || undefined,
      });

      toast.success(`Cron job "${res.cronJob.name}" scheduled`);
      setModalOpen(false);
      setName("");
      setSchedule("*/15 * * * *");
      setHttpPath("/api/cron");
      setCommand("");
      void fetchJobs();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create cron job");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (job: CronJob) => {
    try {
      const updated = await updateCronJob(job.id, { enabled: !job.enabled });
      setJobs((prev) => prev.map((j) => (j.id === job.id ? updated.cronJob : j)));
      toast.success(updated.cronJob.enabled ? `${job.name} enabled` : `${job.name} paused`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update cron job");
    }
  };

  const handleDelete = async (job: CronJob) => {
    try {
      await deleteCronJob(job.id);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      toast.success(`Cron job ${job.name} removed`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete cron job");
    }
  };

  const handleRunNow = async (job: CronJob) => {
    setTriggeringJobId(job.id);
    try {
      const res = await triggerCronJob(job.id);
      if (res.status === "SUCCESS") {
        toast.success(`${job.name} executed successfully in ${res.durationMs}ms`);
      } else {
        toast.error(`Execution failed: ${res.output}`);
      }
      void fetchJobs();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to trigger cron job");
    } finally {
      setTriggeringJobId(null);
    }
  };

  const openLogs = async (job: CronJob) => {
    setActiveJobForLogs(job);
    setLogsModalOpen(true);
    setLogsLoading(true);
    try {
      const res = await getCronJobLogs(job.id, 50);
      setLogs(res.logs || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      setLogsLoading(false);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Vercel Container */}
      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
        <div className="p-6 border-b border-neutral-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">
                Scheduled Tasks
              </h3>
              <span className="rounded-full border border-neutral-800 bg-neutral-900 px-2.5 py-0.5 text-xs font-mono text-neutral-400">
                {jobs.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              Automated recurring HTTP webhook dispatches and in-container command routines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {specs && (
              <div className="hidden md:flex flex-col items-end text-right font-mono text-[11px] text-neutral-400">
                <span className="text-emerald-400">
                  Max concurrent: {specs.recommendations.cron.maxConcurrentJobs}
                </span>
                <span>
                  Host: {specs.hardware.cpuCores} cores · {specs.hardware.totalMemoryGb} GB
                </span>
              </div>
            )}
            <Button
              onClick={() => setModalOpen(true)}
              size="sm"
              className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs h-8"
            >
              + New Cron Job
            </Button>
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-500">
            Loading scheduled jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-medium text-white">No scheduled cron jobs configured</p>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Create scheduled tasks to trigger database cleanups, search indexing, report generation, or health checks.
            </p>
            <Button
              onClick={() => setModalOpen(true)}
              size="sm"
              className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs h-8"
            >
              Configure First Cron Job
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-500">
                  <th className="px-6 py-3 font-medium">Name / Schedule</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Last Run / Status</th>
                  <th className="px-4 py-3 font-medium">State</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-white">{job.name}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 font-mono text-[11px] text-neutral-300">
                          {job.schedule}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          {job.timeoutSeconds}s timeout
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded border px-1.5 py-0.5 text-[10px] font-mono uppercase",
                            job.targetType === "HTTP"
                              ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                              : "border-purple-500/30 bg-purple-500/10 text-purple-400"
                          )}
                        >
                          {job.targetType}
                        </span>
                        {job.targetType === "HTTP" ? (
                          <span className="text-neutral-300 font-mono text-xs">
                            {job.httpMethod} <span className="text-neutral-400">{job.httpPath}</span>
                          </span>
                        ) : (
                          <code className="text-neutral-300 font-mono text-xs">{job.command}</code>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {job.lastStatus ? (
                        <div>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border",
                              job.lastStatus === "SUCCESS"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                : job.lastStatus === "RUNNING"
                                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                                  : "border-red-500/30 bg-red-500/10 text-red-400"
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full shrink-0",
                                job.lastStatus === "SUCCESS"
                                  ? "bg-emerald-500"
                                  : job.lastStatus === "RUNNING"
                                    ? "bg-amber-500 animate-pulse"
                                    : "bg-red-500"
                              )}
                            />
                            {job.lastStatus}
                          </span>
                          <div className="mt-1 text-[11px] text-neutral-500 font-mono">
                            {job.lastRunAt ? new Date(job.lastRunAt).toLocaleTimeString() : "Never"}
                            {job.lastDurationMs != null && ` (${job.lastDurationMs}ms)`}
                          </div>
                        </div>
                      ) : (
                        <span className="text-neutral-500 text-xs">Pending initial run</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(job)}
                        className={cn(
                          "h-7 text-xs",
                          job.enabled
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            : "border-neutral-800 text-neutral-400 hover:text-white"
                        )}
                      >
                        {job.enabled ? "Active" : "Paused"}
                      </Button>
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={triggeringJobId === job.id}
                          onClick={() => handleRunNow(job)}
                          className="h-7 text-xs border-neutral-800 text-neutral-300 hover:text-white"
                        >
                          {triggeringJobId === job.id ? "Running..." : "Run Now"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openLogs(job)}
                          className="h-7 text-xs border-neutral-800 text-neutral-300 hover:text-white"
                        >
                          Logs
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteTarget(job)}
                          className="h-7 text-xs border-red-900/40 text-red-400 hover:bg-red-950/20"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
          Cron runners execute in dedicated isolated worker threads.
        </div>
      </div>

      {/* Create Cron Job Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md border-neutral-800 bg-[#0a0a0a] text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-white">
              Schedule Cron Job
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Configure scheduled cron automation with host resource limits.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2 text-xs">
            <div className="space-y-1.5">
              <label htmlFor="cron-name" className="text-xs font-medium text-neutral-300">
                Task Identifier
              </label>
              <Input
                id="cron-name"
                placeholder="e.g. daily-db-cleanup or cache-warmup"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-black border-neutral-800 text-xs text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">Schedule Preset</label>
              <div className="grid grid-cols-3 gap-1.5">
                {CRON_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setSchedule(preset.value)}
                    className={cn(
                      "rounded-md border py-1.5 text-center text-xs transition-colors",
                      schedule === preset.value
                        ? "border-white bg-neutral-900 text-white font-medium"
                        : "border-neutral-800 bg-black text-neutral-400 hover:text-white"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cron-schedule" className="text-xs font-medium text-neutral-300">
                Cron Expression
              </label>
              <Input
                id="cron-schedule"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="*/15 * * * *"
                className="bg-black border-neutral-800 font-mono text-xs text-emerald-400"
              />
              <p className="text-[11px] text-neutral-500">
                Standard 5-part cron syntax (<code className="text-neutral-400">min hour day month weekday</code>)
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">Target Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType("HTTP")}
                  className={cn(
                    "rounded-md border py-2 text-center text-xs font-medium transition-colors",
                    targetType === "HTTP"
                      ? "border-white bg-neutral-900 text-white"
                      : "border-neutral-800 bg-black text-neutral-400 hover:text-white"
                  )}
                >
                  HTTP Webhook
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType("COMMAND")}
                  className={cn(
                    "rounded-md border py-2 text-center text-xs font-medium transition-colors",
                    targetType === "COMMAND"
                      ? "border-white bg-neutral-900 text-white"
                      : "border-neutral-800 bg-black text-neutral-400 hover:text-white"
                  )}
                >
                  Shell Command
                </button>
              </div>
            </div>

            {targetType === "HTTP" ? (
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1 space-y-1.5">
                  <label htmlFor="cron-method" className="text-xs font-medium text-neutral-300">
                    Method
                  </label>
                  <select
                    id="cron-method"
                    value={httpMethod}
                    onChange={(e) => setHttpMethod(e.target.value as "GET" | "POST" | "PUT")}
                    className="w-full rounded-md border border-neutral-800 bg-black px-2 py-2 text-xs text-white outline-none"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>
                <div className="col-span-3 space-y-1.5">
                  <label htmlFor="cron-path" className="text-xs font-medium text-neutral-300">
                    Endpoint Path
                  </label>
                  <Input
                    id="cron-path"
                    value={httpPath}
                    onChange={(e) => setHttpPath(e.target.value)}
                    placeholder="/api/cron"
                    className="bg-black border-neutral-800 font-mono text-xs text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label htmlFor="cron-cmd" className="text-xs font-medium text-neutral-300">
                  Shell Command
                </label>
                <Input
                  id="cron-cmd"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="bun run cleanup.ts or python -m scripts.sync"
                  className="bg-black border-neutral-800 font-mono text-xs text-white"
                />
              </div>
            )}

            {projects.length > 0 && !projectId && (
              <div className="space-y-1.5">
                <label htmlFor="cron-proj" className="text-xs font-medium text-neutral-300">
                  Target Project
                </label>
                <select
                  id="cron-proj"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full rounded-md border border-neutral-800 bg-black px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="">Global / Host-Level</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="cron-timeout" className="text-xs font-medium text-neutral-300">
                Execution Timeout (Seconds)
              </label>
              <Input
                id="cron-timeout"
                type="number"
                min="5"
                max="3600"
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
                className="bg-black border-neutral-800 text-xs text-white"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-neutral-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:text-white text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs h-8"
              >
                {submitting ? "Scheduling..." : "Create Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Logs Modal */}
      <Dialog open={logsModalOpen} onOpenChange={setLogsModalOpen}>
        <DialogContent className="max-w-3xl border-neutral-800 bg-[#050505] text-white">
          <DialogHeader className="border-b border-neutral-800 pb-3">
            <DialogTitle className="text-base font-semibold text-white">
              Cron Execution History: {activeJobForLogs?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Last 50 automated executions and runtime output streams.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-auto py-2 space-y-2">
            {logsLoading ? (
              <div className="p-8 text-center text-xs text-neutral-500 font-mono">
                Loading execution logs...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500 font-mono">
                No execution history recorded yet.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-neutral-800 bg-black/60 p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium border",
                        log.status === "SUCCESS"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-red-500/30 bg-red-500/10 text-red-400"
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full shrink-0",
                          log.status === "SUCCESS" ? "bg-emerald-500" : "bg-red-500"
                        )}
                      />
                      {log.status}
                    </span>
                    <span className="font-mono text-[11px] text-neutral-500">
                      {new Date(log.createdAt).toLocaleString()} ({log.durationMs}ms)
                    </span>
                  </div>
                  {log.output && (
                    <pre className="mt-2 max-h-40 overflow-auto rounded border border-neutral-800/80 bg-[#030303] p-2 font-mono text-[11px] text-neutral-300 whitespace-pre-wrap">
                      {log.output}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Delete cron schedule "${deleteTarget?.name}"?`}
        description="This will permanently remove the scheduled job. Any in-flight executions will finish but no new runs will be queued."
        confirmLabel="Delete Schedule"
        onConfirm={() => {
          if (deleteTarget) void handleDelete(deleteTarget);
        }}
      />
    </div>
  );
}
