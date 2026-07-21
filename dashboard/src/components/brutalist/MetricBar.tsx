import { cn } from "@/lib/utils";

export function MetricBar({
  label,
  value,
  percent,
  warn,
  className,
}: {
  label: string;
  value: string;
  percent: number;
  warn?: boolean;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, percent));
  return (
    <div className={cn("border border-border bg-card p-4", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono-label text-muted-foreground">{label}</span>
        {warn ? (
          <span className="text-amber-400" aria-hidden>
            ▲
          </span>
        ) : null}
      </div>
      <div className="mb-2 font-mono text-2xl font-semibold tracking-tight">{value}</div>
      <div className="h-1 w-full bg-muted">
        <div className="h-full bg-foreground transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
