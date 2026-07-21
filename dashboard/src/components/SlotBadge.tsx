import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isDeploymentColor } from "@/lib/deployment-display";

export function SlotBadge({ color }: { color: string }) {
  const valid = isDeploymentColor(color);
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-xs font-semibold uppercase",
        color === "BLUE" && "border-border bg-muted text-foreground",
        color === "GREEN" && "border-foreground/40 bg-foreground/10 text-foreground",
        !valid && "border-muted-foreground/40 text-muted-foreground"
      )}
    >
      {valid ? color : "—"}
    </Badge>
  );
}
