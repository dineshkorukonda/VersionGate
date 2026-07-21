import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export type PillStatus = "ACTIVE" | "DEPLOYING" | "FAILED" | "CRITICAL" | "ROLLED_BACK" | "PENDING" | string;

const styles: Record<string, { dot: string; text: string; bg: string }> = {
  ACTIVE: { dot: "bg-emerald-400", text: "text-emerald-400", bg: "border-border bg-card" },
  DEPLOYING: { dot: "bg-sky-400", text: "text-sky-400", bg: "border-border bg-card" },
  FAILED: { dot: "bg-red-400", text: "text-red-400", bg: "border-border bg-card" },
  CRITICAL: { dot: "bg-red-500", text: "text-foreground", bg: "border-foreground/30 bg-foreground text-background" },
  ROLLED_BACK: { dot: "bg-muted-foreground", text: "text-muted-foreground", bg: "border-border bg-card" },
  PENDING: { dot: "bg-amber-400", text: "text-amber-400", bg: "border-border bg-card" },
};

export function StatusPill({ status, className }: { status: PillStatus; className?: string }) {
  const s = styles[status] ?? styles.PENDING;
  const isCritical = status === "CRITICAL";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        s.bg,
        isCritical ? "text-background" : s.text,
        className
      )}
    >
      {status === "DEPLOYING" ? (
        <Loader2 className="size-2.5 animate-spin" />
      ) : (
        <span className={cn("size-1.5 rounded-full", isCritical ? "bg-red-500" : s.dot)} />
      )}
      {status}
    </span>
  );
}
