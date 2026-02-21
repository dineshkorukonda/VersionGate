"use client";
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { api, type Project, type Deployment } from "@/lib/api";
import { ProjectCard } from "@/components/ProjectCard";
import { CreateProjectModal } from "@/components/CreateProjectModal";

export default function OverviewPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [deploymentMap, setDeploymentMap] = useState<Record<string, Deployment>>({});
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [{ projects: p }, { deployments: d }] = await Promise.all([
        api.projects.list(),
        api.deployments.list(),
      ]);

      const map: Record<string, Deployment> = {};
      const sorted = [...d].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      for (const dep of sorted) {
        if (!map[dep.projectId] || dep.status === "ACTIVE") {
          map[dep.projectId] = dep;
        }
      }

      setProjects(p);
      setDeploymentMap(map);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-zinc-100">Projects</h1>
          <div className="h-8 w-28 bg-zinc-800 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse"
            >
              <div className="h-4 bg-zinc-800 rounded w-2/3 mb-2" />
              <div className="h-3 bg-zinc-800 rounded w-full mb-6" />
              <div className="space-y-2">
                <div className="h-3 bg-zinc-800 rounded" />
                <div className="h-3 bg-zinc-800 rounded" />
                <div className="h-3 bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const allDeployments = Object.values(deploymentMap);
  const runningCount = allDeployments.filter((d) => d.status === "ACTIVE").length;
  const failedCount  = allDeployments.filter((d) => d.status === "FAILED").length;
  const deployingCount = allDeployments.filter((d) => d.status === "DEPLOYING").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-zinc-100">Projects</h1>
          <span className="text-xs text-zinc-600">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 text-sm rounded-lg bg-zinc-100 text-zinc-900 font-medium hover:bg-white transition-colors"
        >
          + New Project
        </button>
      </div>

      {/* Global stats bar */}
      {projects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Projects" value={projects.length} color="text-zinc-300" />
          <StatCard label="Running" value={runningCount} color="text-emerald-400" dot="bg-emerald-400" />
          <StatCard label="Failed" value={failedCount} color={failedCount > 0 ? "text-red-400" : "text-zinc-600"} dot={failedCount > 0 ? "bg-red-400" : undefined} />
          <StatCard label="Deploying" value={deployingCount} color={deployingCount > 0 ? "text-amber-400" : "text-zinc-600"} dot={deployingCount > 0 ? "bg-amber-400" : undefined} pulse={deployingCount > 0} />
        </div>
      )}

      {projects.length === 0 ? (
        <div
          className="text-center py-20 border border-dashed border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-600 transition-colors"
          onClick={() => setCreateOpen(true)}
        >
          <p className="text-sm text-zinc-500">No projects yet</p>
          <p className="text-xs text-zinc-600 mt-1">Click to create your first project</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              activeDeployment={deploymentMap[p.id]}
              onDeleted={fetchData}
            />
          ))}
        </div>
      )}

      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={fetchData}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  dot,
  pulse = false,
}: {
  label: string;
  value: number;
  color: string;
  dot?: string;
  pulse?: boolean;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3">
      {dot && (
        <span className="relative flex h-2 w-2 shrink-0">
          {pulse && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dot} opacity-60`} />
          )}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
        </span>
      )}
      <div>
        <p className={`text-xl font-semibold ${color}`}>{value}</p>
        <p className="text-xs text-zinc-600">{label}</p>
      </div>
    </div>
  );
}
