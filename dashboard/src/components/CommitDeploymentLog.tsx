import { Link } from "react-router-dom";
import type { ProjectCommit } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  deploymentBranchLabel,
  deploymentStatusDotClass,
  deploymentStatusLabel,
  formatDeploymentDate,
  formatDeploymentDuration,
} from "@/lib/deployment-log-display";

export interface CommitDeploymentLogProps {
  projectId: string;
  commits: ProjectCommit[];
  emptyMessage?: string;
}

export function CommitDeploymentLog({ projectId, commits, emptyMessage }: CommitDeploymentLogProps) {
  if (commits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-neutral-400">{emptyMessage ?? "No commits found in the local clone yet."}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-lg overflow-hidden bg-[#0a0a0a]">
      {commits.map((c) => {
        const dep = c.latestDeployment ?? c.activeDeployment;
        const status = dep?.status ?? (c.isDeployed ? "ACTIVE" : "PENDING");
        const logHref = dep?.jobId
          ? `/projects/${projectId}/deploy/${dep.jobId}`
          : dep
            ? `/projects/${projectId}/deployments`
            : `/projects/${projectId}`;

        return (
          <Link
            key={c.sha}
            to={logHref}
            className="group flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-neutral-900/60 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white group-hover:text-neutral-100">
                {c.message || "(no commit message)"}
              </p>
              <p className="mt-0.5 truncate text-xs text-neutral-500">
                {c.author} · {formatDeploymentDate(c.date)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-400">
              <span className="inline-flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", deploymentStatusDotClass(status))} />
                <span className="text-neutral-300">
                  {c.isDeployed ? deploymentStatusLabel(status) : "Not deployed"}
                </span>
                {dep ? (
                  <span className="text-neutral-600">
                    {formatDeploymentDuration(dep.createdAt, dep.updatedAt)}
                  </span>
                ) : null}
              </span>

              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  c.isProduction
                    ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                    : c.isDeployed
                      ? "border-neutral-700 bg-neutral-900 text-neutral-400"
                      : "border-neutral-800 bg-black text-neutral-600"
                )}
              >
                {c.isProduction ? "Production" : c.isDeployed ? "Preview" : "Pending"}
              </span>

              <span className="hidden items-center gap-1 font-mono text-neutral-500 sm:inline-flex">
                <span className="text-neutral-600">-o-</span>
                {c.shortSha}
              </span>

              <span className="hidden items-center gap-1 font-mono text-neutral-500 sm:inline-flex">
                <span className="text-neutral-600">#</span>
                {dep
                  ? (() => {
                      const branch = deploymentBranchLabel(dep);
                      return branch.length > 18 ? `${branch.slice(0, 16)}…` : branch;
                    })()
                  : "—"}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
