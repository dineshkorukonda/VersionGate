import { useCallback, useEffect, useMemo, useState } from "react";
import { getDeployments, getProjectCommits, type Deployment, type ProjectCommit } from "@/lib/api";
import { DeploymentList } from "@/components/DeploymentList";
import { CommitDeploymentLog } from "@/components/CommitDeploymentLog";
import {
  DeploymentLogFilters,
  filterDeployments,
  type DeploymentEnvFilter,
  type DeploymentStatusFilter,
} from "@/components/DeploymentLogFilters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { sortDeploymentsNewestFirst } from "@/lib/deployment-log-display";
import { cn } from "@/lib/utils";

type ViewMode = "deployments" | "commits";

export interface ProjectDeploymentLogsProps {
  projectId: string;
  onRollback?: () => void;
}

export function ProjectDeploymentLogs({ projectId, onRollback }: ProjectDeploymentLogsProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [commits, setCommits] = useState<ProjectCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("deployments");
  const [statusFilter, setStatusFilter] = useState<DeploymentStatusFilter>("all");
  const [envFilter, setEnvFilter] = useState<DeploymentEnvFilter>("all");

  const load = useCallback(async () => {
    try {
      const [d, c] = await Promise.all([
        getDeployments(projectId),
        getProjectCommits(projectId, 50),
      ]);
      setDeployments(d.deployments);
      setCommits(c.commits);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 12000);
    return () => window.clearInterval(id);
  }, [load]);

  const filtered = useMemo(() => {
    const sorted = sortDeploymentsNewestFirst(deployments);
    return filterDeployments(sorted, statusFilter, envFilter);
  }, [deployments, statusFilter, envFilter]);

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border border-neutral-800 bg-black p-0.5">
          {(["deployments", "commits"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                view === mode ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"
              )}
            >
              {mode === "deployments" ? "Deployments" : "Commits"}
            </button>
          ))}
        </div>
        {onRollback ? (
          <Button
            variant="outline"
            size="sm"
            className="border-rose-900/50 text-rose-400 hover:bg-rose-950/40 text-xs"
            onClick={() => void onRollback()}
          >
            Quick Rollback
          </Button>
        ) : null}
      </div>

      {view === "deployments" ? (
        <>
          <DeploymentLogFilters
            statusFilter={statusFilter}
            envFilter={envFilter}
            onStatusChange={setStatusFilter}
            onEnvChange={setEnvFilter}
            onClear={() => {
              setStatusFilter("all");
              setEnvFilter("all");
            }}
            count={filtered.length}
          />
          <DeploymentList
            deployments={filtered}
            showProject={false}
            emptyMessage="No deployments match your filters."
          />
        </>
      ) : (
        <CommitDeploymentLog projectId={projectId} commits={commits} />
      )}
    </div>
  );
}
