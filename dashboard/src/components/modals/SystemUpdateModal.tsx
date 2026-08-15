import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { applySelfUpdateFromSettings, getSelfUpdateProgress, type SelfUpdateProgress } from "@/lib/api";
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
  const [isStarting, setIsStarting] = useState(false);
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

    // Check current progress on open
    void (async () => {
      try {
        const p = await getSelfUpdateProgress();
        setProgress(p);
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
    try {
      const res = await applySelfUpdateFromSettings();
      if (res.ok) {
        toast.info("Update pipeline initiated in background");
        startPolling();
      } else {
        toast.error("Could not start update: " + (res.error ?? "Unknown error"));
      }
    } catch (e) {
      toast.error("Update request failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsStarting(false);
    }
  };

  const isRunning = progress.status === "running" || isStarting;
  const isDone = progress.status === "complete";
  const isFailed = progress.status === "failed";

  return (
    <Dialog open={open} onOpenChange={isRunning ? undefined : onOpenChange}>
      <DialogContent className="max-w-2xl border-border bg-card p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono text-base font-semibold">
            <span className="text-primary">[ UPDATE ]</span>
            <span>Zero-Downtime System Engine Update</span>
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground">
            Target branch: <code className="text-foreground">origin/{branch}</code>. Pulls latest commits,
            updates dependencies, runs schema synchronization, and rebuilds assets without dropped requests.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Terminal Output */}
          <div className="rounded-lg border border-border bg-black/90 p-4 font-mono text-xs shadow-inner">
            <div className="flex items-center justify-between border-b border-border/40 pb-2 text-[11px] text-muted-foreground">
              <span>PIPELINE EXECUTION LOG</span>
              <span className="uppercase text-primary">
                {isRunning ? "[ RUNNING ]" : isDone ? "[ COMPLETE ]" : isFailed ? "[ FAILED ]" : "[ IDLE ]"}
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
                      step.includes("[ FAIL ]")
                        ? "text-red-400"
                        : step.includes("[ OK ]") || step.includes("[ READY ]")
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

        <div className="flex items-center justify-between border-t border-border/40 pt-4">
          <div className="font-mono text-xs text-muted-foreground">
            {isRunning && <span>Executing pipeline steps in background...</span>}
            {isDone && <span className="text-emerald-500 font-medium">[ OK ] All steps completed successfully</span>}
            {isFailed && <span className="text-red-500">[ FAIL ] Update halted with errors</span>}
          </div>

          <div className="flex items-center gap-2">
            {!isRunning && !isDone && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="font-mono text-xs"
              >
                Cancel
              </Button>
            )}

            {!isDone && (
              <Button
                size="sm"
                disabled={isRunning}
                onClick={() => void handleStartUpdate()}
                className="font-mono text-xs"
              >
                {isRunning ? "Updating..." : "Apply Update"}
              </Button>
            )}

            {isDone && (
              <Button
                size="sm"
                onClick={() => onOpenChange(false)}
                className="font-mono text-xs"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
