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
    <div className={cn("flex flex-col justify-center px-5 py-4", borderless ? "" : "rounded-xl border border-neutral-800 bg-[#0a0a0a] text-white shadow-sm transition-all hover:border-neutral-700")}>
      <span className="text-xs font-medium uppercase tracking-wider text-neutral-400 font-mono">{label}</span>
      <div className={cn("mt-1 text-2xl font-bold font-mono tracking-tight text-white", valueClassName)}>{value}</div>
      {hint ? <p className="mt-1 text-xs text-neutral-400">{hint}</p> : null}
    </div>
  );
}
