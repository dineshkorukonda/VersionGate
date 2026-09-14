import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RuntimeLogsViewerProps {
  title?: string;
  containerName?: string | null;
  logs: string[];
  loading?: boolean;
  onRefresh?: () => void;
  autoRefresh?: boolean;
  onToggleAutoRefresh?: (val: boolean) => void;
  tail?: number;
  onTailChange?: (tail: number) => void;
  emptyMessage?: string;
  maxHeightClass?: string;
}

export function RuntimeLogsViewer({
  title = "Runtime Container Logs",
  containerName,
  logs,
  loading = false,
  onRefresh,
  autoRefresh = false,
  onToggleAutoRefresh,
  tail = 200,
  onTailChange,
  emptyMessage = "No container log lines emitted yet.",
  maxHeightClass = "max-h-96",
}: RuntimeLogsViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = filter.trim()
    ? logs.filter((line) => line.toLowerCase().includes(filter.toLowerCase()))
    : logs;

  const copyLogs = () => {
    if (!logs.length) return;
    void navigator.clipboard.writeText(logs.join("\n")).then(
      () => toast.success(`[ COPIED ] ${logs.length} log lines to clipboard`),
      () => toast.error("Could not copy logs")
    );
  };

  const downloadLogs = () => {
    if (!logs.length) return;
    const blob = new Blob([logs.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${containerName || "runtime"}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("[ DOWNLOADED ] Log file saved");
  };

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#050505] shadow-sm font-mono text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 bg-[#0a0a0a] px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-200">{title}</span>
          {containerName ? (
            <span className="border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 text-[10px] text-neutral-300">
              [{containerName}]
            </span>
          ) : null}
          {loading ? (
            <span className="border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">
              [ LOADING ]
            </span>
          ) : (
            <span className="border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">
              [ LIVE: {filteredLogs.length} lines ]
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Tail selector */}
          {onTailChange ? (
            <div className="flex items-center gap-1 border border-neutral-800 bg-neutral-900/60 p-0.5">
              {[50, 100, 200, 500].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onTailChange(t)}
                  className={cn(
                    "px-1.5 py-0.5 text-[10px] font-mono transition-colors",
                    tail === t
                      ? "bg-neutral-800 text-white font-bold"
                      : "text-neutral-400 hover:text-neutral-200"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          ) : null}

          {/* Auto Refresh Toggle */}
          {onToggleAutoRefresh ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-6 px-2 text-[10px] border-neutral-800",
                autoRefresh ? "text-emerald-400 bg-emerald-950/30 border-emerald-800/50" : "text-neutral-400"
              )}
              onClick={() => onToggleAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "[ Auto: ON ]" : "[ Auto: OFF ]"}
            </Button>
          ) : null}

          {/* Refresh button */}
          {onRefresh ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[10px] border-neutral-800 text-neutral-300 hover:text-white"
              disabled={loading}
              onClick={onRefresh}
            >
              [ Refresh ]
            </Button>
          ) : null}

          {/* Copy button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[10px] border-neutral-800 text-neutral-300 hover:text-white"
            disabled={!logs.length}
            onClick={copyLogs}
          >
            [ Copy ]
          </Button>

          {/* Download button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[10px] border-neutral-800 text-neutral-300 hover:text-white"
            disabled={!logs.length}
            onClick={downloadLogs}
          >
            [ Export ]
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between border-b border-neutral-800/60 bg-neutral-950 px-3 py-1.5">
        <input
          type="text"
          placeholder="Filter log lines..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full max-w-sm bg-transparent font-mono text-[11px] text-neutral-300 placeholder:text-neutral-600 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setAutoScroll(!autoScroll)}
          className={cn(
            "text-[10px] transition-colors",
            autoScroll ? "text-emerald-400" : "text-neutral-500 hover:text-neutral-300"
          )}
        >
          {autoScroll ? "[ Stick to Bottom: ON ]" : "[ Stick to Bottom: OFF ]"}
        </button>
      </div>

      {/* Log Output Body */}
      <div
        ref={scrollRef}
        className={cn(
          "overflow-auto p-3 font-mono text-[11px] leading-relaxed select-text",
          maxHeightClass
        )}
      >
        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-neutral-500">
            {filter ? `[ No log lines match "${filter}" ]` : `[ ${emptyMessage} ]`}
          </div>
        ) : (
          filteredLogs.map((line, idx) => (
            <div key={idx} className="flex hover:bg-neutral-900/50 py-0.5">
              <span className="w-10 select-none text-neutral-600 shrink-0 text-right pr-3 font-mono text-[10px]">
                {idx + 1}
              </span>
              <span className="text-neutral-300 whitespace-pre-wrap break-all flex-1">
                {line}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
