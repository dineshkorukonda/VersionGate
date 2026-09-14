import { useEffect, useState } from "react";
import { listAllJobs } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Polls recent jobs and renders the latest log line per job (newest jobs first),
 * similar to a lightweight “cluster log” preview in the mocks.
 */
export function AggregateJobLogStream({
  className,
  title = "Live system log stream",
  pollMs = 6000,
}: {
  className?: string;
  title?: string;
  pollMs?: number;
}) {
  const [lines, setLines] = useState<string[]>([]);
  const [pollOk, setPollOk] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await listAllJobs({ limit: 20 });
        if (cancelled) return;
        const next: string[] = [];
        const stamp = () => new Date().toISOString().slice(11, 19);
        for (const j of r.jobs) {
          const tail = j.logs.length ? j.logs[j.logs.length - 1]! : "—";
          const proj = j.project?.name ?? j.projectId.slice(0, 8);
          next.push(`${stamp()} [JOB] ${proj} · ${j.type} · ${j.status} — ${tail}`);
        }
        setLines(next.slice(0, 40));
        setPollOk(true);
      } catch {
        if (!cancelled) {
          setPollOk(false);
        }
      }
    };
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
        <span className="text-xs font-mono font-medium text-neutral-300">{title}</span>
        <span className="flex items-center text-[10px] font-mono text-neutral-400">
          {pollOk ? (
            <span className="border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400">[ POLLING ]</span>
          ) : (
            <span className="border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-amber-400">[ DEGRADED ]</span>
          )}
        </span>
      </div>
      <pre
        className="max-h-64 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-neutral-300"
        style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {lines.length === 0 ? <span className="text-neutral-600">Waiting for job activity…</span> : lines.join("\n")}
      </pre>
    </div>
  );
}
