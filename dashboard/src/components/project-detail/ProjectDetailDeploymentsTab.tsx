import { useMemo, useState } from "react";
import { DeploymentList } from "@/components/DeploymentList";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Deployment } from "@/lib/api";

export interface ProjectDetailDeploymentsTabProps {
  deployments: Deployment[];
  onDeploy: () => void;
}

export function ProjectDetailDeploymentsTab({
  deployments,
  onDeploy,
}: ProjectDetailDeploymentsTabProps) {
  const [authorFilter, setAuthorFilter] = useState<string | null>(null);
  const [envFilter, setEnvFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredDeployments = useMemo(() => {
    return deployments.filter((d) => {
      if (authorFilter && d.commitAuthor && !d.commitAuthor.toLowerCase().includes(authorFilter.toLowerCase())) {
        return false;
      }
      if (envFilter) {
        const isProd = !d.environmentName || d.environmentName.toLowerCase() === "production";
        if (envFilter === "Production" && !isProd) return false;
        if (envFilter === "Preview" && isProd) return false;
      }
      if (statusFilter && d.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [deployments, authorFilter, envFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Deployments</h1>

        <Button
          size="sm"
          className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs h-8"
          onClick={() => void onDeploy()}
        >
          Deploy
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1 text-xs font-medium text-neutral-300 hover:border-neutral-700 hover:text-white transition-colors"
        >
          <span>+ Add Filter</span>
        </button>

        <button
          type="button"
          onClick={() => setAuthorFilter((f) => (f ? null : "dinesh"))}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            authorFilter
              ? "border-neutral-700 bg-neutral-800 text-white"
              : "border-neutral-800 bg-black text-neutral-400 hover:text-neutral-300"
          )}
        >
          <span>Author {authorFilter ?? "All"}</span>
        </button>

        <button
          type="button"
          onClick={() => setEnvFilter((e) => (e === "Production" ? null : "Production"))}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            envFilter === "Production"
              ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
              : "border-neutral-800 bg-black text-neutral-400 hover:text-neutral-300"
          )}
        >
          <span>Environment Production</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter((s) => (s === "FAILED" ? null : "FAILED"))}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            statusFilter === "FAILED"
              ? "border-red-500/40 bg-red-500/10 text-red-300"
              : "border-neutral-800 bg-black text-neutral-400 hover:text-neutral-300"
          )}
        >
          <span>Status Error</span>
        </button>
      </div>

      <DeploymentList
        deployments={filteredDeployments}
        showProject={false}
        emptyMessage="No deployments match your criteria."
      />
    </div>
  );
}
