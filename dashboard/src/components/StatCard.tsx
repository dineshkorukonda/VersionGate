import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  valueClassName,
  hint,
  borderless = false,
}: {
  label: string;
  value: number | string;
  valueClassName?: string;
  hint?: string;
  borderless?: boolean;
}) {
  return (
    <div className={cn("flex flex-col justify-center px-6 py-4", borderless ? "" : "border border-border/50 bg-card rounded-md ring-1 ring-border/20 transition-all hover:ring-primary/20")}>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className={cn("mt-1 text-3xl font-semibold tabular-nums tracking-tight", valueClassName)}>{value}</div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground/70">{hint}</p> : null}
    </div>
  );
}
