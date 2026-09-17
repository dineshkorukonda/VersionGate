import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { cancelJob, createWebSocket, getJobStatus, getServerStats, type ServerStats } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type LineKind = "info" | "success" | "error" | "step";

function classifyLine(line: string): LineKind {
  const lower = line.toLowerCase();
  if (/^step \d+/i.test(line.trim()) || /^\[.*\]/.test(line.trim())) return "step";
  if (lower.includes("failed") || lower.includes("error") || lower.includes("fatal")) return "error";
  if (lower.includes("successful") || lower.includes("complete") || lower.includes("done")) return "success";
  return "info";
}

function fmtBytes(n: number) {
  return n >= 1e9 ? `${(n / 1e9).toFixed(2)} GB` : n >= 1e6 ? `${(n / 1e6).toFixed(2)} MB` : `${Math.round(n)} B`;
}

const POLL_MS = 2000;
const STUCK_PENDING_MS = 8000;

export function DeployLog() {
  const navigate = useNavigate();
  const { id: projectId, jobId } = useParams<{ id: string; jobId: string }>();
  const [lines, setLines] = useState<string[]>([]);
  const [jobStatus, setJobStatus] = useState<string>("RUNNING");
  const [jobError, setJobError] = useState<string | null>(null);
  const [pendingSince, setPendingSince] = useState<number | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [copied, setCopied] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [hostStats, setHostStats] = useState<ServerStats | null>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (jobStatus !== "PENDING" || pendingSince == null) return;
    const id = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [jobStatus, pendingSince]);

  const handleScroll = () => {
    const el = preRef.current;
    if (!el) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 60;
    setIsScrolledUp(!nearBottom);
  };

  const scrollToBottom = () => {
    const el = preRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setIsScrolledUp(false);
  };

  useEffect(() => {
    if (!isScrolledUp && preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [lines, isScrolledUp]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const s = await getServerStats();
        if (!cancelled) setHostStats(s);
      } catch {
        if (!cancelled) setHostStats(null);
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!jobId) return;

    let ws: WebSocket | null = null;
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | undefined;

    void (async () => {
      try {
        const initial = await getJobStatus(jobId);
        if (cancelled) return;
        const logs = Array.isArray(initial.job.logs) ? (initial.job.logs as string[]) : [];
        setLines(logs);
        setJobStatus(initial.job.status);
        setJobError(initial.job.error ?? null);
        if (initial.job.status === "PENDING") {
          setPendingSince(Date.now());
        }
      } catch {
        setJobStatus("FAILED");
      }

      const refresh = async () => {
        try {
          const j = await getJobStatus(jobId);
          if (cancelled) return;
          setJobStatus(j.job.status);
          setJobError(j.job.error ?? null);
          const logs = Array.isArray(j.job.logs) ? (j.job.logs as string[]) : [];
          setLines((prev) => (logs.length > prev.length ? logs : prev));
          if (j.job.status === "PENDING") {
            setPendingSince((t) => t ?? Date.now());
          } else {
            setPendingSince(null);
          }
        } catch {
          /* keep polling */
        }
      };

      pollTimer = setInterval(() => {
        void refresh();
      }, POLL_MS);

      ws = createWebSocket(jobId);
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => setWsConnected(false);
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as {
            type?: string;
            line?: string;
            status?: string;
          };
          if (msg.type === "log" && msg.line) {
            setLines((prev) => [...prev, msg.line!]);
          }
          if (msg.type === "status" && msg.status) {
            setJobStatus(msg.status);
            if (msg.status !== "PENDING") setPendingSince(null);
          }
        } catch {
          /* ignore */
        }
      };
      ws.onerror = () => {
        setWsConnected(false);
      };
    })();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      ws?.close();
      setWsConnected(false);
    };
  }, [jobId]);

  const showWorkerHint =
    jobStatus === "PENDING" && pendingSince != null && clock - pendingSince > STUCK_PENDING_MS;

  const copyLogs = () => {
    const text = lines.join("\n");
    void navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        toast.success("Logs copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      },
      () => toast.error("Failed to copy logs")
    );
  };

  const downloadLogs = () => {
    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deploy-${jobId?.slice(0, 8) ?? "log"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Log file downloaded");
  };

  const onCancelJob = async () => {
    if (!jobId || jobStatus !== "PENDING") return;
    setCancelBusy(true);
    try {
      await cancelJob(jobId);
      toast.success("Job cancelled");
      setJobStatus("CANCELLED");
      if (projectId) navigate(`/projects/${projectId}`, { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not cancel job");
    } finally {
      setCancelBusy(false);
    }
  };

  const statsBreakdown = useMemo(() => {
    let step = 0;
    let err = 0;
    let success = 0;
    for (const line of lines) {
      const k = classifyLine(line);
      if (k === "step") step++;
      else if (k === "error") err++;
      else if (k === "success") success++;
    }
    return { step, err, success, total: lines.length };
  }, [lines]);

  const statusBadge = useMemo(() => {
    switch (jobStatus) {
      case "COMPLETE":
        return {
          label: "Ready",
          dot: "bg-emerald-500",
          pill: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        };
      case "FAILED":
        return {
          label: "Failed",
          dot: "bg-red-500",
          pill: "border-red-500/30 bg-red-500/10 text-red-400",
        };
      case "CANCELLED":
        return {
          label: "Cancelled",
          dot: "bg-neutral-500",
          pill: "border-neutral-800 bg-neutral-900 text-neutral-400",
        };
      case "RUNNING":
        return {
          label: "Building",
          dot: "bg-blue-500 animate-pulse",
          pill: "border-blue-500/30 bg-blue-500/10 text-blue-400",
        };
      default:
        return {
          label: "Queued",
          dot: "bg-amber-500 animate-pulse",
          pill: "border-amber-500/30 bg-amber-500/10 text-amber-400",
        };
    }
  }, [jobStatus]);

  return (
    <div className="w-full space-y-6 font-sans">
      {/* Vercel Deploy Log Header */}
      <div className="flex flex-col gap-4 border-b border-neutral-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            {projectId && (
              <>
                <Link to={`/projects/${projectId}`} className="hover:text-white transition-colors">
                  Project
                </Link>
                <span>/</span>
              </>
            )}
            <span className="font-mono text-neutral-300">Deployment #{jobId?.slice(0, 8)}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Deployment #{jobId?.slice(0, 8)}
            </h1>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border",
                statusBadge.pill
              )}
            >
              <span className={cn("size-1.5 rounded-full shrink-0", statusBadge.dot)} />
              {statusBadge.label}
            </span>

            {/* WS Live Indicator */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900 px-2.5 py-0.5 text-[11px] font-mono text-neutral-400">
              <span
                className={cn(
                  "size-1.5 rounded-full shrink-0",
                  wsConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                )}
              />
              {wsConnected ? "Live WebSocket" : "Polling Stream"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:text-white text-xs h-8"
            onClick={copyLogs}
            disabled={lines.length === 0}
          >
            {copied ? "Copied!" : "Copy Logs"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:text-white text-xs h-8"
            onClick={downloadLogs}
            disabled={lines.length === 0}
          >
            Download Log
          </Button>

          {jobStatus === "PENDING" && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="text-xs h-8 bg-red-600 hover:bg-red-700 text-white"
              disabled={cancelBusy}
              onClick={() => void onCancelJob()}
            >
              {cancelBusy ? "Cancelling..." : "Cancel"}
            </Button>
          )}

          {projectId && (
            <Button
              size="sm"
              className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs h-8"
              onClick={() => navigate(`/projects/${projectId}`)}
            >
              Back to Project
            </Button>
          )}
        </div>
      </div>

      {showWorkerHint && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300">
          <p className="font-semibold text-amber-200">Worker idle / Job queued</p>
          <p className="mt-1 text-amber-400/90">
            Worker might be restarting. Run <code className="rounded bg-black/40 px-1 py-0.5 font-mono text-white">pm2 restart versiongate-worker</code> if build does not start immediately.
          </p>
        </div>
      )}

      {jobError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
          <p className="font-semibold text-red-200">Deployment Error</p>
          <pre className="mt-1 font-mono text-xs text-red-400 whitespace-pre-wrap">{jobError}</pre>
        </div>
      )}

      {/* Main Grid: Console & Host Metrics */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          {/* Stream Terminal Card */}
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#050505]">
            {/* Terminal Window Bar */}
            <div className="flex items-center justify-between border-b border-neutral-800 bg-black px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="flex gap-1.5" aria-hidden>
                  <span className="size-2.5 rounded-full bg-neutral-700" />
                  <span className="size-2.5 rounded-full bg-neutral-700" />
                  <span className="size-2.5 rounded-full bg-neutral-700" />
                </span>
                <span className="font-mono text-[11px] text-neutral-400 pl-2">
                  build-stream · {statsBreakdown.total} lines
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-neutral-400 hover:text-white"
                  onClick={() => setShowLineNumbers(!showLineNumbers)}
                >
                  {showLineNumbers ? "Hide #" : "Line #"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-neutral-400 hover:text-white"
                  onClick={copyLogs}
                  disabled={lines.length === 0}
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Terminal Console */}
            <div className="relative">
              <pre
                ref={preRef}
                onScroll={handleScroll}
                className="min-h-[50vh] max-h-[min(72vh,700px)] w-full overflow-auto bg-[#050505] p-4 font-mono text-xs leading-relaxed md:p-6"
                style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
              >
                {lines.length === 0 ? (
                  <span className="text-neutral-500">
                    {jobStatus === "PENDING"
                      ? "Waiting for worker to pick up this job..."
                      : jobStatus === "RUNNING"
                        ? "Streaming logs..."
                        : "No log lines recorded."}
                  </span>
                ) : null}
                {lines.map((line, i) => {
                  const kind = classifyLine(line);
                  return (
                    <div
                      key={`${i}-${line.slice(0, 24)}`}
                      className={cn(
                        "group/line flex hover:bg-white/[0.02]",
                        kind === "success" && "text-emerald-400 font-medium",
                        kind === "error" && "text-red-400 font-medium",
                        kind === "step" && "mt-1.5 text-cyan-300 font-semibold",
                        kind === "info" && "text-neutral-300"
                      )}
                    >
                      {showLineNumbers && (
                        <span className="mr-4 inline-block w-8 select-none text-right tabular-nums text-neutral-600">
                          {i + 1}
                        </span>
                      )}
                      <span className="flex-1">{line}</span>
                    </div>
                  );
                })}
              </pre>

              {isScrolledUp && (
                <button
                  type="button"
                  onClick={scrollToBottom}
                  className="absolute bottom-4 right-4 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white shadow-xl hover:bg-neutral-800 transition-colors"
                >
                  Jump to Latest ↓
                </button>
              )}
            </div>

            {/* Terminal Footer */}
            <div className="flex items-center justify-between border-t border-neutral-800 bg-black px-4 py-2 text-xs text-neutral-500 font-mono">
              <span>{statsBreakdown.step} steps · {statsBreakdown.err} errors</span>
              <span>{jobStatus}</span>
            </div>
          </div>
        </div>

        {/* Host Resources Telemetry Aside */}
        <aside className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Host Telemetry</h3>
                <p className="mt-0.5 text-xs text-neutral-400">Live hardware utilization.</p>
              </div>

              {hostStats ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-400">CPU</span>
                      <span className="font-mono text-white font-medium">{hostStats.cpu_percent.toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(100, hostStats.cpu_percent)} className="h-1 bg-neutral-800" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-400">Memory</span>
                      <span className="font-mono text-white font-medium">{hostStats.memory_percent.toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(100, hostStats.memory_percent)} className="h-1 bg-neutral-800" />
                    <p className="mt-1 text-[11px] text-neutral-500 font-mono">
                      {fmtBytes(hostStats.memory_used)} / {fmtBytes(hostStats.memory_total)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-500">Loading host metrics...</p>
              )}
            </div>

            {hostStats && (
              <div className="border-t border-neutral-800 bg-black px-5 py-3 text-xs text-neutral-400 flex justify-between">
                <span>Network Δ</span>
                <span className="font-mono text-neutral-300">
                  ↑{fmtBytes(hostStats.network_sent_rate ?? 0)}/s · ↓{fmtBytes(hostStats.network_recv_rate ?? 0)}/s
                </span>
              </div>
            )}
          </div>

          {projectId && (
            <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a] p-5 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Quick Navigation</h4>
              <div className="flex flex-col gap-2 text-xs">
                <Link
                  to={`/projects/${projectId}`}
                  className="text-neutral-300 hover:text-white flex items-center justify-between py-1 border-b border-neutral-800/60"
                >
                  <span>Project Overview</span>
                  <span>↗</span>
                </Link>
                <Link
                  to="/activity"
                  className="text-neutral-300 hover:text-white flex items-center justify-between py-1"
                >
                  <span>Global Activity</span>
                  <span>↗</span>
                </Link>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
