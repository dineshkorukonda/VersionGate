import type { Deployment } from "@/lib/api";
import { cn } from "@/lib/utils";
import { isProductionEnvironment } from "@/lib/deployment-log-display";

export type DeploymentStatusFilter = "all" | Deployment["status"];
export type DeploymentEnvFilter = "all" | "production" | "preview";

export interface DeploymentLogFiltersProps {
  statusFilter: DeploymentStatusFilter;
  envFilter: DeploymentEnvFilter;
  onStatusChange: (v: DeploymentStatusFilter) => void;
  onEnvChange: (v: DeploymentEnvFilter) => void;
  onClear?: () => void;
  count?: number;
  className?: string;
}

export function DeploymentLogFilters({
  statusFilter,
  envFilter,
  onStatusChange,
  onEnvChange,
  onClear,
  count,
  className,
}: DeploymentLogFiltersProps) {
  const active = statusFilter !== "all" || envFilter !== "all";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-xs text-neutral-500">Filter</span>
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value as DeploymentStatusFilter)}
        className="h-8 rounded-md border border-neutral-800 bg-black px-2 text-xs text-neutral-300"
      >
        <option value="all">All statuses</option>
        <option value="ACTIVE">Ready</option>
        <option value="DEPLOYING">Building</option>
        <option value="FAILED">Error</option>
        <option value="ROLLED_BACK">Rolled back</option>
      </select>
      <select
        value={envFilter}
        onChange={(e) => onEnvChange(e.target.value as DeploymentEnvFilter)}
        className="h-8 rounded-md border border-neutral-800 bg-black px-2 text-xs text-neutral-300"
      >
        <option value="all">All environments</option>
        <option value="production">Production</option>
        <option value="preview">Preview</option>
      </select>
      {active && onClear ? (
        <button type="button" onClick={onClear} className="text-xs text-neutral-500 hover:text-neutral-300">
          Clear
        </button>
      ) : null}
      {count !== undefined ? (
        <span className="ml-auto text-xs text-neutral-500">{count} records</span>
      ) : null}
    </div>
  );
}

export function filterDeployments(
  deployments: Deployment[],
  statusFilter: DeploymentStatusFilter,
  envFilter: DeploymentEnvFilter
): Deployment[] {
  return deployments.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (envFilter === "production" && !isProductionEnvironment(d.environmentName)) return false;
    if (envFilter === "preview" && isProductionEnvironment(d.environmentName)) return false;
    return true;
  });
}
