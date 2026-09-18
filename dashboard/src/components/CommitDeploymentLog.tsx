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
      <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-[#0a0a0a] py-16 text-center">
        <p className="text-sm text-neutral-400 font-sans">{emptyMessage ?? "No commits found in the local clone yet."}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-800/60 border border-neutral-800 rounded-xl overflow-hidden bg-[#0a0a0a]">
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
            className="group flex flex-col gap-3 px-5 py-3.5 transition-colors hover:bg-neutral-900/40 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="relative flex size-2.5 shrink-0 items-center justify-center">
                {status === "DEPLOYING" ? (
                  <span className="absolute size-2.5 animate-ping rounded-full bg-blue-400 opacity-75" />
                ) : null}
                <span className={cn("size-2 rounded-full", deploymentStatusDotClass(status))} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-white group-hover:text-neutral-200">
                    {c.message || "(no commit message)"}
                  </p>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide shrink-0",
                      c.isProduction
                        ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                        : c.isDeployed
                          ? "border-neutral-800 bg-neutral-900 text-neutral-400"
                          : "border-neutral-850 bg-black text-neutral-500"
                    )}
                  >
                    {c.isProduction ? "Production" : c.isDeployed ? "Preview" : "Pending"}
                  </span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-500 font-sans">
                  <span>{c.author}</span>
                  <span>·</span>
                  <span className="font-mono text-[11px]">{formatDeploymentDate(c.date)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-400 font-sans">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="text-neutral-300">
                  {c.isDeployed ? deploymentStatusLabel(status) : "Not deployed"}
                </span>
                {dep ? (
                  <span className="text-neutral-500 font-mono text-[11px]">
                    ({formatDeploymentDuration(dep.createdAt, dep.updatedAt)})
                  </span>
                ) : null}
              </span>

              <span className="hidden items-center gap-1 font-mono text-neutral-400 sm:inline-flex" title="Commit Hash">
                <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5 text-neutral-500 shrink-0">
                  <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5h-3.32zM8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                </svg>
                <span>{c.shortSha}</span>
              </span>

              <span className="hidden items-center gap-1 font-mono text-neutral-400 sm:inline-flex" title="Branch">
                <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5 text-neutral-500 shrink-0">
                  <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
                </svg>
                <span>
                  {dep
                    ? (() => {
                        const branch = deploymentBranchLabel(dep);
                        return branch.length > 18 ? `${branch.slice(0, 16)}…` : branch;
                      })()
                    : "—"}
                </span>
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
