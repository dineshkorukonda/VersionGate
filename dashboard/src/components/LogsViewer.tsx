"use client";
import { useEffect, useRef } from "react";

interface Props {
  lines: string[];
  loading: boolean;
  lastUpdated: Date | null;
}

type LogLevel = "error" | "warn" | "info" | "success" | "debug" | "plain";

function classifyLine(line: string): LogLevel {
  const l = line.toLowerCase();
  if (/\berror\b|❌|\[error\]|err:|level.*error/.test(l)) return "error";
  if (/\bwarn\b|⚠️|\[warn\]|warning/.test(l)) return "warn";
  if (/✅|🚀|\bstarted\b|\blistening\b|\bready\b|\bconnected\b|\bsuccess\b/.test(l)) return "success";
  if (/\bdebug\b|\[debug\]|verbose/.test(l)) return "debug";
  if (/\binfo\b|\[info\]/.test(l)) return "info";
  return "plain";
}

const levelClass: Record<LogLevel, string> = {
  error:   "text-red-400",
  warn:    "text-amber-400",
  success: "text-indigo-400",
  info:    "text-blue-400",
  debug:   "text-zinc-500",
  plain:   "text-zinc-300",
};

// Highlight the timestamp prefix (ISO-like or HH:MM:SS patterns) in dim color
function renderLine(line: string, level: LogLevel) {
  const tsMatch = line.match(
    /^(\d{4}-\d{2}-\d{2}T[\d:.Z]+|\d{4}-\d{2}-\d{2} [\d:.,]+|\[\d{2}:\d{2}:\d{2}[^\]]*\]|\d{2}:\d{2}:\d{2}\.\d+)\s*/
  );
  if (!tsMatch) {
    return <span className={levelClass[level]}>{line}</span>;
  }
  const ts = tsMatch[0];
  const rest = line.slice(ts.length);
  return (
    <>
      <span className="text-zinc-600 select-none">{ts}</span>
      <span className={levelClass[level]}>{rest}</span>
    </>
  );
}

export function LogsViewer({ lines, loading, lastUpdated }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const errorCount  = lines.filter((l) => classifyLine(l) === "error").length;
  const warnCount   = lines.filter((l) => classifyLine(l) === "warn").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
            Logs
          </span>
          <span className="text-xs text-zinc-600">
            last {lines.length} lines · auto-refreshes every 15s
          </span>
          {loading && (
            <span className="text-xs text-zinc-600 animate-pulse">refreshing...</span>
          )}
          {errorCount > 0 && (
            <span className="text-xs font-medium text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
              {errorCount} error{errorCount !== 1 ? "s" : ""}
            </span>
          )}
          {warnCount > 0 && (
            <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
              {warnCount} warn{warnCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {lastUpdated && (
          <span className="text-xs text-zinc-600">{lastUpdated.toLocaleTimeString()}</span>
        )}
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
        {/* Terminal header bar */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-zinc-800 bg-zinc-900">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500/60" />
          <span className="ml-2 text-xs text-zinc-600 font-mono">stdout / stderr</span>
        </div>

        <div className="h-96 overflow-y-auto p-4">
          {lines.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <span className="text-xs text-zinc-700">
                No log output — container may not be running
              </span>
            </div>
          ) : (
            <div>
              {lines.map((line, i) => {
                const level = classifyLine(line);
                return (
                  <div key={i} className="flex gap-3 group hover:bg-zinc-900/60 px-1 -mx-1 rounded">
                    <span className="text-zinc-700 text-[10px] font-mono select-none w-7 text-right shrink-0 pt-px group-hover:text-zinc-600">
                      {i + 1}
                    </span>
                    <pre className="text-[11px] font-mono whitespace-pre-wrap break-all leading-relaxed flex-1">
                      {renderLine(line, level)}
                    </pre>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-zinc-800 bg-zinc-900">
          <span className="text-[10px] text-zinc-700 uppercase tracking-wider">Legend</span>
          {(["error", "warn", "success", "info", "debug"] as LogLevel[]).map((lvl) => (
            <span key={lvl} className={`text-[10px] font-medium ${levelClass[lvl]}`}>
              {lvl}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
