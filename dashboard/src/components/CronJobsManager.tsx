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
import { toast } from "sonner";

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
  { label: "Daily (Midnight)", value: "0 0 * * *" },
  { label: "Weekly (Monday)", value: "0 0 * * 1" },
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
    } catch (err: any) {
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

      toast.success(`[ OK ] Cron job "${res.cronJob.name}" scheduled`);
      setModalOpen(false);
      setName("");
      setSchedule("*/15 * * * *");
      setHttpPath("/api/cron");
      setCommand("");
      void fetchJobs();
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "Failed to create cron job");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (job: CronJob) => {
    try {
      const updated = await updateCronJob(job.id, { enabled: !job.enabled });
      setJobs((prev) => prev.map((j) => (j.id === job.id ? updated.cronJob : j)));
      toast.success(updated.cronJob.enabled ? `[ ACTIVE ] ${job.name} enabled` : `[ PAUSED ] ${job.name} paused`);
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "Failed to update cron job");
    }
  };

  const handleDelete = async (job: CronJob) => {
    if (!confirm(`Delete cron schedule "${job.name}"?`)) return;
    try {
      await deleteCronJob(job.id);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      toast.success(`[ DELETED ] Cron job ${job.name} removed`);
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "Failed to delete cron job");
    }
  };

  const handleRunNow = async (job: CronJob) => {
    setTriggeringJobId(job.id);
    try {
      const res = await triggerCronJob(job.id);
      if (res.status === "SUCCESS") {
        toast.success(`[ OK ] ${job.name} executed successfully in ${res.durationMs}ms`);
      } else {
        toast.error(`[ ${res.status} ] Execution finished with error: ${res.output}`);
      }
      void fetchJobs();
    } catch (err: any) {
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
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      setLogsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Specs Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-neutral-800 bg-neutral-950 p-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-white">
              Scheduled Cron Jobs & Automation
            </h3>
            <span className="border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400">
              {jobs.length} TASKS
            </span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-neutral-400">
            Automated recurring HTTP webhook dispatches and in-container command routines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {specs && (
            <div className="hidden md:flex flex-col items-end text-right font-mono text-[10px] text-neutral-400">
              <span className="text-emerald-400">
                [ MAX CONCURRENT: {specs.recommendations.cron.maxConcurrentJobs} ]
              </span>
              <span>
                HOST: {specs.hardware.cpuCores} CORES / {specs.hardware.totalMemoryGb} GB
              </span>
            </div>
          )}
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-emerald-500 font-mono text-xs font-semibold text-black hover:bg-emerald-400"
          >
            + New Cron Job
          </Button>
        </div>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="border border-neutral-800 bg-neutral-950/60 p-8 text-center font-mono text-xs text-neutral-500">
          Loading scheduled jobs...
        </div>
      ) : jobs.length === 0 ? (
        <div className="border border-dashed border-neutral-800 bg-neutral-950/40 p-8 text-center">
          <p className="font-mono text-xs text-neutral-400">No scheduled cron jobs configured.</p>
          <p className="mt-1 font-mono text-[11px] text-neutral-600">
            Create scheduled tasks to trigger database cleanups, search indexing, report generation, or health checks.
          </p>
          <Button
            onClick={() => setModalOpen(true)}
            variant="outline"
            className="mt-4 border-neutral-800 font-mono text-xs text-neutral-300 hover:text-white"
          >
            Configure First Cron Job
          </Button>
        </div>
      ) : (
        <div className="border border-neutral-800 bg-neutral-950">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/50 text-[11px] uppercase tracking-wider text-neutral-400">
                <th className="px-4 py-2.5">Name / Schedule</th>
                <th className="px-4 py-2.5">Target</th>
                <th className="px-4 py-2.5">Status / Last Run</th>
                <th className="px-4 py-2.5">State</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-neutral-900/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{job.name}</div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="rounded bg-neutral-900 px-1.5 py-0.5 font-mono text-[11px] text-emerald-400 border border-neutral-800">
                        {job.schedule}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        Timeout: {job.timeoutSeconds}s
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`border px-1.5 py-0.5 text-[10px] font-semibold ${
                          job.targetType === "HTTP"
                            ? "border-blue-900/80 bg-blue-950/40 text-blue-400"
                            : "border-purple-900/80 bg-purple-950/40 text-purple-400"
                        }`}
                      >
                        [ {job.targetType} ]
                      </span>
                      {job.targetType === "HTTP" ? (
                        <span className="text-neutral-300">
                          {job.httpMethod} <code className="text-neutral-400">{job.httpPath}</code>
                        </span>
                      ) : (
                        <code className="text-neutral-300 text-[11px]">{job.command}</code>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {job.lastStatus ? (
                      <div>
                        <span
                          className={`inline-block border px-1.5 py-0.5 text-[10px] font-semibold ${
                            job.lastStatus === "SUCCESS"
                              ? "border-emerald-900/80 bg-emerald-950/40 text-emerald-400"
                              : job.lastStatus === "RUNNING"
                              ? "border-amber-900/80 bg-amber-950/40 text-amber-400 animate-pulse"
                              : "border-red-900/80 bg-red-950/40 text-red-400"
                          }`}
                        >
                          [ {job.lastStatus} ]
                        </span>
                        <div className="mt-0.5 text-[10px] text-neutral-500">
                          {job.lastRunAt ? new Date(job.lastRunAt).toLocaleTimeString() : "Never"}
                          {job.lastDurationMs != null && ` (${job.lastDurationMs}ms)`}
                        </div>
                      </div>
                    ) : (
                      <span className="text-neutral-600 text-[11px]">[ PENDING FIRST RUN ]</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(job)}
                      className={`border px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                        job.enabled
                          ? "border-emerald-800 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40"
                          : "border-neutral-800 bg-neutral-900 text-neutral-500 hover:text-white"
                      }`}
                    >
                      {job.enabled ? "[ ACTIVE ]" : "[ PAUSED ]"}
                    </button>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={triggeringJobId === job.id}
                        onClick={() => handleRunNow(job)}
                        className="h-7 border-neutral-800 font-mono text-[11px] text-neutral-300 hover:border-neutral-700 hover:text-white"
                      >
                        {triggeringJobId === job.id ? "Running..." : "Run Now"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openLogs(job)}
                        className="h-7 border-neutral-800 font-mono text-[11px] text-neutral-400 hover:border-neutral-700 hover:text-white"
                      >
                        Logs
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(job)}
                        className="h-7 border-neutral-800 font-mono text-[11px] text-red-400 hover:border-red-800 hover:bg-red-950/20"
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

      {/* Create Cron Job Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md border-neutral-800 bg-neutral-950 text-white font-mono">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm uppercase tracking-wider text-emerald-400">
              Schedule Cron Job
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Configure scheduled cron automation with host resource limits.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2 text-xs">
            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="cron-name" className="text-neutral-300">Job Identifier</label>
              <Input
                id="cron-name"
                placeholder="e.g. daily-db-cleanup or cache-warmup"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-neutral-800 bg-neutral-900 text-xs text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500"
              />
            </div>

            {/* Schedule Presets */}
            <div className="space-y-1.5">
              <label className="text-neutral-300">Schedule Preset</label>
              <div className="grid grid-cols-3 gap-1.5">
                {CRON_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setSchedule(preset.value)}
                    className={`border px-2 py-1.5 text-center text-[10px] uppercase transition-colors ${
                      schedule === preset.value
                        ? "border-emerald-500 bg-emerald-950/40 text-emerald-400 font-semibold"
                        : "border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cron Expression */}
            <div className="space-y-1.5">
              <label htmlFor="cron-schedule" className="text-neutral-300">5-Part Cron Expression</label>
              <Input
                id="cron-schedule"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="*/15 * * * *"
                className="border-neutral-800 bg-neutral-900 text-xs text-emerald-400 placeholder:text-neutral-600 focus-visible:ring-emerald-500"
              />
              <p className="text-[10px] text-neutral-500">
                Format: <code>minute hour day-of-month month day-of-week</code>
              </p>
            </div>

            {/* Target Type */}
            <div className="space-y-1.5">
              <label className="text-neutral-300">Target Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType("HTTP")}
                  className={`border px-3 py-2 text-center text-xs uppercase transition-colors ${
                    targetType === "HTTP"
                      ? "border-blue-500 bg-blue-950/40 text-blue-400 font-semibold"
                      : "border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-white"
                  }`}
                >
                  HTTP Webhook
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType("COMMAND")}
                  className={`border px-3 py-2 text-center text-xs uppercase transition-colors ${
                    targetType === "COMMAND"
                      ? "border-purple-500 bg-purple-950/40 text-purple-400 font-semibold"
                      : "border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-white"
                  }`}
                >
                  Shell Command
                </button>
              </div>
            </div>

            {/* HTTP Fields */}
            {targetType === "HTTP" ? (
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1 space-y-1.5">
                  <label htmlFor="cron-method" className="text-neutral-300">Method</label>
                  <select
                    id="cron-method"
                    value={httpMethod}
                    onChange={(e) => setHttpMethod(e.target.value as any)}
                    className="w-full border border-neutral-800 bg-neutral-900 px-2 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>
                <div className="col-span-3 space-y-1.5">
                  <label htmlFor="cron-path" className="text-neutral-300">Endpoint Path / URL</label>
                  <Input
                    id="cron-path"
                    value={httpPath}
                    onChange={(e) => setHttpPath(e.target.value)}
                    placeholder="/api/cron/cleanup"
                    className="border-neutral-800 bg-neutral-900 text-xs text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label htmlFor="cron-cmd" className="text-neutral-300">Command (Inside Container/Host)</label>
                <Input
                  id="cron-cmd"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="bun run cleanup.ts or npm run sync"
                  className="border-neutral-800 bg-neutral-900 text-xs text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500"
                />
              </div>
            )}

            {/* Scope / Project */}
            {!projectId && projects.length > 0 && (
              <div className="space-y-1.5">
                <label htmlFor="cron-project" className="text-neutral-300">Linked Project</label>
                <select
                  id="cron-project"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Global / Host System Cron</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.deploymentType === "pm2" ? "PM2" : "Docker"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Timeout */}
            <div className="space-y-1.5">
              <label htmlFor="cron-timeout" className="text-neutral-300">Timeout Seconds</label>
              <Input
                id="cron-timeout"
                type="number"
                min={5}
                max={600}
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(parseInt(e.target.value, 10) || 60)}
                className="border-neutral-800 bg-neutral-900 text-xs text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="border-neutral-800 text-neutral-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-500 font-semibold text-black hover:bg-emerald-400"
              >
                {submitting ? "Scheduling..." : "Create Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Logs Drawer */}
      <Dialog open={logsModalOpen} onOpenChange={setLogsModalOpen}>
        <DialogContent className="max-w-2xl border-neutral-800 bg-neutral-950 text-white font-mono">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm uppercase tracking-wider text-emerald-400">
              Execution Logs // {activeJobForLogs?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Schedule: <code className="text-neutral-300">{activeJobForLogs?.schedule}</code> | Target:{" "}
              <code className="text-neutral-300">{activeJobForLogs?.targetType}</code>
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto space-y-2 pt-2">
            {logsLoading ? (
              <div className="p-4 text-center text-xs text-neutral-500">Loading execution history...</div>
            ) : logs.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500 border border-neutral-900">
                No recorded execution runs yet.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border border-neutral-800/80 bg-neutral-900/40 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`border px-1.5 py-0.2 text-[10px] font-semibold ${
                          log.status === "SUCCESS"
                            ? "border-emerald-800 bg-emerald-950/40 text-emerald-400"
                            : "border-red-800 bg-red-950/40 text-red-400"
                        }`}
                      >
                        [ {log.status} ]
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Duration: <span className="text-white">{log.durationMs}ms</span> ({log.triggeredBy})
                    </div>
                  </div>
                  {log.output && (
                    <pre className="mt-2 overflow-x-auto rounded bg-black/60 p-2 text-[11px] text-neutral-300 font-mono">
                      {log.output}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLogsModalOpen(false)}
              className="border-neutral-800 text-neutral-400 hover:text-white text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
