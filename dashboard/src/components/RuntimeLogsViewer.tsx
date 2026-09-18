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
      () => toast.success(`Copied ${logs.length} log lines to clipboard`),
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
    toast.success("Log file saved");
  };

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#050505] shadow-sm font-mono text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 bg-[#0a0a0a] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-neutral-200 font-sans">{title}</span>
          {containerName ? (
            <span className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 font-mono text-[11px] text-neutral-400">
              {containerName}
            </span>
          ) : null}
          {loading ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400 font-sans">
              <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
              Loading...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 font-sans">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Live: {filteredLogs.length} lines
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-sans">
          {/* Tail selector */}
          {onTailChange ? (
            <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900/60 p-0.5">
              {[50, 100, 200, 500].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onTailChange(t)}
                  className={cn(
                    "rounded px-2 py-0.5 text-[10px] font-mono transition-colors",
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
                "h-7 px-2.5 text-xs border-neutral-800 gap-1.5",
                autoRefresh ? "text-emerald-400 bg-emerald-950/30 border-emerald-800/50" : "text-neutral-400 hover:text-white"
              )}
              onClick={() => onToggleAutoRefresh(!autoRefresh)}
            >
              <span className={cn("size-1.5 rounded-full", autoRefresh ? "bg-emerald-400" : "bg-neutral-500")} />
              <span>Auto-refresh</span>
            </Button>
          ) : null}

          {/* Refresh button */}
          {onRefresh ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs border-neutral-800 text-neutral-300 hover:text-white"
              disabled={loading}
              onClick={onRefresh}
            >
              Refresh
            </Button>
          ) : null}

          {/* Copy button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs border-neutral-800 text-neutral-300 hover:text-white"
            disabled={!logs.length}
            onClick={copyLogs}
          >
            Copy
          </Button>

          {/* Download button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs border-neutral-800 text-neutral-300 hover:text-white"
            disabled={!logs.length}
            onClick={downloadLogs}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between border-b border-neutral-800/60 bg-neutral-950 px-4 py-2 font-sans">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5 text-neutral-500 shrink-0">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
          </svg>
          <input
            type="text"
            placeholder="Filter log output..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-transparent font-mono text-xs text-neutral-300 placeholder:text-neutral-600 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setAutoScroll(!autoScroll)}
          className={cn(
            "inline-flex items-center gap-1.5 text-xs transition-colors",
            autoScroll ? "text-emerald-400" : "text-neutral-500 hover:text-neutral-300"
          )}
        >
          <span className={cn("size-1.5 rounded-full", autoScroll ? "bg-emerald-500" : "bg-neutral-600")} />
          <span>Follow Log Stream</span>
        </button>
      </div>

      {/* Log Output Body */}
      <div
        ref={scrollRef}
        className={cn(
          "overflow-auto p-4 font-mono text-[11px] leading-relaxed select-text",
          maxHeightClass
        )}
      >
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 font-sans text-xs">
            {filter ? `No log lines match "${filter}"` : emptyMessage}
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
