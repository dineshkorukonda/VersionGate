import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  applySelfUpdateFromSettings,
  checkSelfUpdateFromSettings,
  getSelfUpdateProgress,
  type SelfUpdateGitStatus,
  type SelfUpdateProgress,
} from "@/lib/api";
import { toast } from "sonner";

interface SystemUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: string;
  onComplete?: () => void;
}

export function SystemUpdateModal({
  open,
  onOpenChange,
  branch,
  onComplete,
}: SystemUpdateModalProps) {
  const [progress, setProgress] = useState<SelfUpdateProgress>({
    status: "idle",
    startedAt: null,
    finishedAt: null,
    currentStep: null,
    steps: [],
  });
  const [gitStatus, setGitStatus] = useState<SelfUpdateGitStatus | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [completedInSession, setCompletedInSession] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    setCompletedInSession(false);

    // Check current progress & git commit info on modal open
    void (async () => {
      try {
        const [p, gs] = await Promise.all([
          getSelfUpdateProgress(),
          checkSelfUpdateFromSettings().catch(() => null),
        ]);
        setProgress(p);
        if (gs) setGitStatus(gs);
        if (p.status === "running") {
          startPolling();
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight, behavior: "smooth" });
  }, [progress.steps]);

  const startPolling = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      try {
        const p = await getSelfUpdateProgress();
        setProgress(p);
        if (p.status === "complete") {
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          setCompletedInSession(true);
          toast.success("System update completed successfully");
          onComplete?.();
        } else if (p.status === "failed") {
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          toast.error("System update failed: " + (p.error ?? "Unknown error"));
        }
      } catch {
        // Server might be gracefully reloading
      }
    }, 1000);
  };

  const handleStartUpdate = async () => {
    setIsStarting(true);
    setCompletedInSession(false);
    setProgress({
      status: "running",
      startedAt: new Date().toISOString(),
      finishedAt: null,
      currentStep: "Starting update...",
      steps: ["[ INIT ] Initialized asynchronous update pipeline"],
    });

    try {
      const res = await applySelfUpdateFromSettings();
      if (res.ok) {
        toast.info("Update pipeline initiated in background");
        startPolling();
      } else {
        toast.error("Could not start update: " + (res.error ?? "Unknown error"));
        setProgress((prev) => ({
          ...prev,
          status: "failed",
          error: res.error,
          steps: [...prev.steps, `[ FAIL ] ${res.error ?? "Unknown error"}`],
        }));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Update request failed: " + msg);
      setProgress((prev) => ({
        ...prev,
        status: "failed",
        error: msg,
        steps: [...prev.steps, `[ FAIL ] ${msg}`],
      }));
    } finally {
      setIsStarting(false);
    }
  };

  const isRunning = progress.status === "running" || isStarting;
  const isFreshlyCompleted = completedInSession && progress.status === "complete";
  const isFailed = progress.status === "failed";
  const isBehind = Boolean(gitStatus?.behind);
  const isStaleComplete = !completedInSession && progress.status === "complete";

  return (
    <Dialog open={open} onOpenChange={isRunning ? undefined : onOpenChange}>
      <DialogContent className="max-w-3xl border-border bg-card p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono text-base font-semibold">
            <span className="text-white">Update</span>
            <span>Zero-Downtime System Engine Update</span>
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground">
            Target branch: <code className="text-foreground">origin/{branch}</code>. Pulls latest commits,
            updates dependencies, runs schema synchronization, and rebuilds assets without dropped requests.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {isBehind && gitStatus && (
            <div className="flex items-center justify-between rounded-lg border border-sky-500/30 bg-sky-500/10 px-3.5 py-2 font-mono text-xs text-sky-400">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-sky-400 animate-pulse" />
                <span>New commits on origin/{branch}:</span>
                <span className="font-semibold text-white">{gitStatus.currentCommit.slice(0, 7)}</span>
                <span>→</span>
                <span className="font-semibold text-white">{gitStatus.remoteCommit?.slice(0, 7) ?? "latest"}</span>
              </div>
              <span className="text-[11px] text-sky-300/80">Ready to apply</span>
            </div>
          )}

          {/* Terminal Output */}
          <div className="rounded-lg border border-border bg-black/90 p-4 font-mono text-xs shadow-inner">
            <div className="flex items-center justify-between border-b border-border/40 pb-2 text-[11px] text-muted-foreground">
              <span>PIPELINE EXECUTION LOG</span>
              <span className="uppercase text-primary font-semibold">
                {isRunning
                  ? "RUNNING"
                  : isFreshlyCompleted
                    ? "COMPLETE"
                    : isFailed
                      ? "FAILED"
                      : isBehind
                        ? "UPDATE READY"
                        : isStaleComplete
                          ? "IDLE (READY)"
                          : "IDLE"}
              </span>
            </div>

            <div
              ref={terminalRef}
              className="mt-3 max-h-56 min-h-36 overflow-y-auto space-y-1.5 font-mono text-xs leading-relaxed text-zinc-300 select-text"
            >
              {progress.steps.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  Click &ldquo;Apply Update&rdquo; below to begin zero-downtime execution.
                </div>
              ) : (
                progress.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className={
                      step.includes("[ FAIL ]") || step.includes("FAIL")
                        ? "text-red-400"
                        : step.includes("[ OK ]") || step.includes("[ READY ]") || step.includes("OK") || step.includes("READY")
                          ? "text-emerald-400 font-semibold"
                          : "text-zinc-300"
                    }
                  >
                    {step}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/40 pt-4">
          {isFreshlyCompleted && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 font-mono text-xs text-emerald-400">
              <span className="font-semibold">[ NOTE ]</span> Update applied successfully. A browser refresh is required to load updated dashboard assets and schema changes.
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="font-mono text-xs text-muted-foreground">
              {isRunning && <span>Executing pipeline steps in background...</span>}
              {isFreshlyCompleted && <span className="text-emerald-500 font-medium">Pipeline completed</span>}
              {isFailed && <span className="text-red-500">Update halted with errors</span>}
              {!isRunning && !isFreshlyCompleted && !isFailed && isBehind && (
                <span className="text-sky-400">New engine update ready to apply</span>
              )}
              {!isRunning && !isFreshlyCompleted && !isFailed && !isBehind && (
                <span>Engine is on latest origin/{branch}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isRunning && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="font-mono text-xs"
                >
                  {isFreshlyCompleted ? "Close" : "Cancel"}
                </Button>
              )}

              {isFreshlyCompleted && (
                <Button
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="bg-white font-mono text-xs font-semibold text-black hover:bg-neutral-200"
                >
                  Refresh Page
                </Button>
              )}

              {!isRunning && !isFreshlyCompleted && (
                <Button
                  size="sm"
                  onClick={() => void handleStartUpdate()}
                  className="bg-white font-mono text-xs font-semibold text-black hover:bg-neutral-200"
                >
                  {isFailed ? "Retry Update" : isBehind ? "Apply Update" : isStaleComplete ? "Re-apply Update" : "Apply Update"}
                </Button>
              )}

              {isRunning && (
                <Button
                  size="sm"
                  disabled
                  className="font-mono text-xs"
                >
                  Updating...
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
