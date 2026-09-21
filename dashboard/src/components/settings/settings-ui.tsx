import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-neutral-800/60 py-2.5 sm:flex-row sm:items-center sm:justify-between last:border-0">
      <dt className="text-xs font-medium text-neutral-400">{label}</dt>
      <dd className="font-mono text-xs text-neutral-200">{value}</dd>
    </div>
  );
}

export function boolPill(ok: boolean, yes = "Healthy", no = "Attention Needed") {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium border",
        ok
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border-amber-500/30 bg-amber-500/10 text-amber-400"
      )}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", ok ? "bg-emerald-500" : "bg-amber-500")} />
      <span>{ok ? yes : no}</span>
    </span>
  );
}
