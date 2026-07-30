import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  valueClassName,
  hint,
  icon,
  trend,
  trendPositive = true,
  borderless = false,
}: {
  label: string;
  value: number | string;
  valueClassName?: string;
  hint?: string;
  icon?: ReactNode;
  trend?: string;
  trendPositive?: boolean;
  borderless?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-5 hover:border-[#0070f3]/50 transition-all duration-300 overflow-hidden",
        borderless && "border-none hover:border-none bg-transparent"
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0070f3]/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative z-10 flex items-start justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon ? (
          <div className="w-9 h-9 rounded-lg bg-[#141414] flex items-center justify-center text-muted-foreground group-hover:bg-[#0070f3]/10 group-hover:text-[#0070f3] transition-colors duration-300">
            {icon}
          </div>
        ) : null}
      </div>
      <div className="relative z-10 flex items-end gap-3">
        <span className={cn("text-2xl lg:text-3xl font-bold tracking-tight text-white tabular-nums", valueClassName)}>
          {value}
        </span>
        {trend ? (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-semibold mb-1 px-2 py-0.5 rounded-md",
              trendPositive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-rose-500/10 text-rose-400"
            )}
          >
            <span>{trend}</span>
          </div>
        ) : null}
      </div>
      {hint ? <p className="relative z-10 mt-2 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
