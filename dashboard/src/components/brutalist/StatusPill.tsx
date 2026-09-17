import { cn } from "@/lib/utils";

export type PillStatus = "ACTIVE" | "DEPLOYING" | "FAILED" | "CRITICAL" | "ROLLED_BACK" | "PENDING" | string;

const statusMeta: Record<string, { dot: string; label: string; animate?: boolean; text: string }> = {
  ACTIVE: { dot: "bg-emerald-500", label: "Ready", text: "text-emerald-400" },
  DEPLOYING: { dot: "bg-blue-500", label: "Building", animate: true, text: "text-blue-400" },
  FAILED: { dot: "bg-red-500", label: "Failed", text: "text-red-400" },
  CRITICAL: { dot: "bg-red-500", label: "Critical", text: "text-red-400" },
  ROLLED_BACK: { dot: "bg-neutral-400", label: "Rolled Back", text: "text-neutral-400" },
  PENDING: { dot: "bg-amber-500", label: "Queued", text: "text-amber-400" },
};

export function StatusPill({ status, className }: { status: PillStatus; className?: string }) {
  const upper = String(status).toUpperCase();
  const m = statusMeta[upper] ?? { dot: "bg-neutral-500", label: status, text: "text-neutral-300" };
  const isCritical = upper === "CRITICAL";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900/90 px-2.5 py-0.5 text-xs font-medium text-neutral-300 transition-colors",
        isCritical && "border-red-900/60 bg-red-950/20 text-red-300",
        className
      )}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          m.dot,
          m.animate && "animate-pulse"
        )}
      />
      <span>{m.label}</span>
    </span>
  );
}
