import { StatusPill } from "@/components/brutalist/StatusPill";
import { cn } from "@/lib/utils";

export type ProjectStatus =
  | "ACTIVE"
  | "DEPLOYING"
  | "FAILED"
  | "ROLLED_BACK"
  | "PENDING";

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const normalized =
    status === "FAILED" && className?.includes("critical")
      ? "CRITICAL"
      : (status as ProjectStatus);
  return <StatusPill status={normalized} className={cn(className)} />;
}
