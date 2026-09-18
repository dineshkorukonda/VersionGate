import { useEffect, useState } from "react";
import { listAllJobs } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AggregateJobLogStreamProps {
  title?: string;
  pollMs?: number;
  className?: string;
}

/**
 * Polls active job logs to provide a lightweight aggregate tail on the Overview screen.
 */
export function AggregateJobLogStream({
  title = "Active deployment stream",
  pollMs = 6000,
  className,
}: AggregateJobLogStreamProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [pollOk, setPollOk] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const r = await listAllJobs({ limit: 20 });
        if (cancelled) return;
        const next: string[] = [];
        const stamp = () => new Date().toISOString().slice(11, 19);
        for (const j of r.jobs) {
          const tail = j.logs.length ? j.logs[j.logs.length - 1]! : "—";
          const proj = j.project?.name ?? j.projectId.slice(0, 8);
          next.push(`${stamp()} · ${proj} · ${j.type} · ${j.status} — ${tail}`);
        }
        setLines(next.slice(0, 40));
        setPollOk(true);
      } catch {
        if (!cancelled) setPollOk(false);
      }
    }

    void tick();
    const id = window.setInterval(() => void tick(), pollMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pollMs]);

  return (
    <div className={cn("overflow-hidden rounded-xl border border-neutral-800 bg-[#050505] shadow-sm", className)}>
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2.5 bg-[#0a0a0a]">
        <span className="text-xs font-sans font-medium text-neutral-300">{title}</span>
        <span className="flex items-center text-xs font-sans">
          {pollOk ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 font-medium">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Polling Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400 font-medium">
              <span className="size-1.5 rounded-full bg-amber-500" />
              Degraded
            </span>
          )}
        </span>
      </div>
      <pre
        className="max-h-64 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-neutral-300"
        style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {lines.length === 0 ? <span className="text-neutral-600 font-sans text-xs">Waiting for job activity…</span> : lines.join("\n")}
      </pre>
    </div>
  );
}
