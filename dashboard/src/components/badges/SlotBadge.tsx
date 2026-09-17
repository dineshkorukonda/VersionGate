import { cn } from "@/lib/utils";
import { isDeploymentColor } from "@/lib/deployment-display";

export function SlotBadge({ color }: { color: string }) {
  const valid = isDeploymentColor(color);
  const upper = color.toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[11px] font-medium border",
        upper === "BLUE" && "border-sky-500/30 bg-sky-500/10 text-sky-400",
        upper === "GREEN" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        !valid && "border-neutral-800 bg-neutral-900 text-neutral-400"
      )}
    >
      {valid ? color : "—"}
    </span>
  );
}
