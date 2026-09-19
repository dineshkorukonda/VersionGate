import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkAutoDeploy, getAllDeployments, getProjects, type Deployment, type Project } from "@/lib/api";
import { DeploymentList } from "@/components/DeploymentList";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "ACTIVE" | "DEPLOYING" | "FAILED";
type EnvFilter = "all" | "production" | "preview";

export function Deployments() {
  const navigate = useNavigate();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [envFilter, setEnvFilter] = useState<EnvFilter>("all");

  const load = useCallback(async () => {
    try {
      const [d, p] = await Promise.all([getAllDeployments(), getProjects()]);
      setDeployments(d.deployments);
      setProjects(p.projects);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load deployments");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const res = await checkAutoDeploy();
      if (res.triggeredCount > 0) {
        toast.success(`[ LIVE ] Auto-Deploy triggered for ${res.triggeredCount} project(s)!`);
      } else {
        toast.success(`[ OK ] Checked ${res.checkedCount} project(s) — all up to date with latest commits.`);
      }
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sync auto-deploy");
    } finally {
      setSyncingAll(false);
    }
  };

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 12000);
    return () => window.clearInterval(id);
  }, [load]);

  const filtered = useMemo(() => {
    let list = [...deployments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (projectFilter !== "all") {
      list = list.filter((d) => d.projectId === projectFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((d) => d.status === statusFilter);
    }
    if (envFilter === "production") {
      list = list.filter((d) => (d.environmentName ?? "").toLowerCase() === "production");
    } else if (envFilter === "preview") {
      list = list.filter((d) => (d.environmentName ?? "").toLowerCase() !== "production");
    }
    return list;
  }, [deployments, projectFilter, statusFilter, envFilter]);

  const activeFilters = [
    projectFilter !== "all" ? "project" : null,
    statusFilter !== "all" ? "status" : null,
    envFilter !== "all" ? "environment" : null,
  ].filter(Boolean).length;

  return (
    <div className="w-full space-y-6 font-sans">
      <div className="flex flex-col gap-4 border-b border-neutral-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Deployments</h1>
          <p className="text-sm text-neutral-400">
            All deployment records across your workspace
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={syncingAll}
            className="border-neutral-800 bg-[#0a0a0a] text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white h-8"
            onClick={() => void handleSyncAll()}
          >
            {syncingAll ? "Checking Commits..." : "Sync & Auto-Deploy All"}
          </Button>
          <Button
            size="sm"
            className="bg-white text-xs font-semibold text-black hover:bg-neutral-200 h-8"
            onClick={() => navigate("/projects/new")}
          >
            + New Project
          </Button>
        </div>
      </div>

      {/* Vercel-style Filters Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Environment Segmented Control */}
          <div className="flex items-center rounded-lg border border-neutral-800 bg-[#0a0a0a] p-0.5">
            {(["all", "production", "preview"] as const).map((env) => (
              <button
                key={env}
                type="button"
                onClick={() => setEnvFilter(env)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                  envFilter === env
                    ? "bg-neutral-800 text-white font-semibold"
                    : "text-neutral-400 hover:text-neutral-200"
                )}
              >
                {env === "all" ? "All Environments" : env}
              </button>
            ))}
          </div>

          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="h-8 rounded-lg border border-neutral-800 bg-[#0a0a0a] px-2.5 text-xs text-neutral-300 focus:border-neutral-600 focus:outline-none"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="h-8 rounded-lg border border-neutral-800 bg-[#0a0a0a] px-2.5 text-xs text-neutral-300 focus:border-neutral-600 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Ready</option>
            <option value="DEPLOYING">Building</option>
            <option value="FAILED">Error</option>
          </select>

          {activeFilters > 0 ? (
            <button
              type="button"
              onClick={() => {
                setProjectFilter("all");
                setStatusFilter("all");
                setEnvFilter("all");
              }}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors ml-1"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        <span className="text-xs text-neutral-500 font-mono">
          {filtered.length} {filtered.length === 1 ? "deployment" : "deployments"}
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-xl bg-neutral-900" />
          <Skeleton className="h-14 w-full rounded-xl bg-neutral-900" />
          <Skeleton className="h-14 w-full rounded-xl bg-neutral-900" />
        </div>
      ) : (
        <DeploymentList
          deployments={filtered}
          showProject
          emptyMessage="No deployments match your filters."
        />
      )}
    </div>
  );
}
