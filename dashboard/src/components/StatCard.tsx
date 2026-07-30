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
    <div className={cn("group relative bg-card border border-border rounded-xl p-5 hover:border-accent/50 transition-all duration-300 overflow-hidden", borderless && "border-none hover:border-none bg-transparent")}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span className="relative z-10 text-sm font-medium text-muted-foreground">{label}</span>
      <div className={cn("relative z-10 mt-2 text-2xl lg:text-3xl font-bold tracking-tight tabular-nums", valueClassName)}>{value}</div>
      {hint ? <p className="relative z-10 mt-1 text-xs text-muted-foreground/70">{hint}</p> : null}
    </div>
  );
}
