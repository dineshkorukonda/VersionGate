import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllDeployments, getProjects, type Deployment, type Project } from "@/lib/api";
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
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 border-b border-neutral-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Deployments</h1>
          <p className="text-sm text-neutral-400">
            All deployment records across your workspace
          </p>
        </div>
        <Button
          size="sm"
          className="bg-white text-xs font-semibold text-black hover:bg-neutral-200"
          onClick={() => navigate("/projects/new")}
        >
          Add New
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-neutral-500">Filters</span>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="h-8 rounded-md border border-neutral-800 bg-black px-2 text-xs text-neutral-300"
        >
          <option value="all">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="h-8 rounded-md border border-neutral-800 bg-black px-2 text-xs text-neutral-300"
        >
          <option value="all">All statuses</option>
          <option value="ACTIVE">Ready</option>
          <option value="DEPLOYING">Building</option>
          <option value="FAILED">Error</option>
        </select>
        <select
          value={envFilter}
          onChange={(e) => setEnvFilter(e.target.value as EnvFilter)}
          className="h-8 rounded-md border border-neutral-800 bg-black px-2 text-xs text-neutral-300"
        >
          <option value="all">All environments</option>
          <option value="production">Production</option>
          <option value="preview">Preview</option>
        </select>
        {activeFilters > 0 ? (
          <button
            type="button"
            onClick={() => {
              setProjectFilter("all");
              setStatusFilter("all");
              setEnvFilter("all");
            }}
            className={cn("text-xs text-neutral-500 hover:text-neutral-300")}
          >
            Clear filters
          </button>
        ) : null}
        <span className="ml-auto text-xs text-neutral-500">{filtered.length} deployments</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
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
