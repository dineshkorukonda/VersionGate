import { Link } from "react-router-dom";
import type { Deployment } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  deploymentBranchLabel,
  deploymentRowLabel,
  deploymentShortHash,
  deploymentStatusDotClass,
  deploymentStatusLabel,
  formatDeploymentDate,
  formatDeploymentDuration,
  isProductionEnvironment,
} from "@/lib/deployment-log-display";

export interface DeploymentListProps {
  deployments: Deployment[];
  showProject?: boolean;
  emptyMessage?: string;
}

export function DeploymentList({ deployments, showProject = true, emptyMessage }: DeploymentListProps) {
  if (deployments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-neutral-400">{emptyMessage ?? "No deployments yet."}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-lg overflow-hidden bg-[#0a0a0a]">
      {deployments.map((d) => {
        const label = deploymentRowLabel(d);
        const prod = isProductionEnvironment(d.environmentName);
        const branch = deploymentBranchLabel(d);
        const hash = deploymentShortHash(d);

        return (
          <Link
            key={d.id}
            to={d.jobId ? `/projects/${d.projectId}/deploy/${d.jobId}` : `/projects/${d.projectId}/deployments`}
            className="group flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-neutral-900/60 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white group-hover:text-neutral-100">
                {label}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-500">
                {showProject && d.projectName ? <span className="truncate">{d.projectName}</span> : null}
                {d.commitAuthor ? <span className="truncate">{d.commitAuthor}</span> : null}
                {d.errorMessage ? (
                  <span className="truncate text-red-400" title={d.errorMessage}>{d.errorMessage}</span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-400">
              <span className="inline-flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", deploymentStatusDotClass(d.status))} />
                <span className="text-neutral-300">{deploymentStatusLabel(d.status)}</span>
                <span className="text-neutral-600">
                  {formatDeploymentDuration(d.createdAt, d.updatedAt)}
                </span>
              </span>

              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  prod
                    ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                    : "border-neutral-700 bg-neutral-900 text-neutral-400"
                )}
              >
                {prod ? "Production" : d.environmentName ?? "Preview"}
              </span>

              <span className="hidden items-center gap-1 font-mono text-neutral-500 sm:inline-flex">
                <span className="text-neutral-600">-o-</span>
                {hash}
              </span>

              <span className="hidden items-center gap-1 font-mono text-neutral-500 sm:inline-flex">
                <span className="text-neutral-600">#</span>
                {branch.length > 18 ? `${branch.slice(0, 16)}…` : branch}
              </span>

              <span className="text-neutral-500">{formatDeploymentDate(d.createdAt)}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
