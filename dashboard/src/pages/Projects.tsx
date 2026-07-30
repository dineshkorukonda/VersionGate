import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllDeployments, getInstanceSettings, getProjects, getServerStats, listAllJobs, type Deployment, type JobRecord, type Project, type ServerStats } from "@/lib/api";
import { projectDeploymentStatus } from "@/lib/project-deployment-status";
import { getActiveDeployment, getDisplayDeployment, guessEnvironmentLabel, publicEnvironmentUrl, setConfiguredPublicHost } from "@/lib/deployment-display";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteProjectDialog } from "@/components/modals/DeleteProjectDialog";
import { toast } from "sonner";
import { useLaunchCreateProject } from "@/create-project-launch";
import { AggregateJobLogStream } from "@/components/AggregateJobLogStream";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const PAGE_SIZE = 6;

function formatUptime(projectId: string, deployments: Deployment[]): string {
  const active = getActiveDeployment(projectId, deployments);
  if (!active) return "—";
  const sec = Math.max(0, (Date.now() - new Date(active.updatedAt).getTime()) / 1000);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function Projects() {
  const launchCreate = useLaunchCreateProject();
  const [projects, setProjects] = useState<Project[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  
  const [hostStats, setHostStats] = useState<ServerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [page, setPage] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const [p, d, jobs, inst] = await Promise.all([
        getProjects(),
        getAllDeployments(),
        listAllJobs({ limit: 120 }).catch(() => ({ jobs: [] as JobRecord[], total: 0 })),
        getInstanceSettings().catch(() => null),
      ]);
      setConfiguredPublicHost(inst?.publicDomain);
      setProjects(p.projects);
      setDeployments(d.deployments);
      const m = new Map<string, string>();
      for (const j of jobs.jobs) {
        if (!m.has(j.projectId)) m.set(j.projectId, j.id);
      }
      
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const s = await getServerStats();
        if (!cancelled) setHostStats(s);
      } catch {
        if (!cancelled) setHostStats(null);
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const pageCount = Math.max(1, Math.ceil(projects.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount - 1);
  const slice = useMemo(() => {
    const start = pageSafe * PAGE_SIZE;
    return projects.slice(start, start + PAGE_SIZE);
  }, [projects, pageSafe]);

  useEffect(() => {
    if (page > pageCount - 1) setPage(Math.max(0, pageCount - 1));
  }, [page, pageCount]);

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Projects</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={() => launchCreate()}>
            New Project
          </Button>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full " />
      ) : projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No projects yet.{" "}
          <button type="button" className="text-primary underline-offset-2 hover:underline" onClick={() => launchCreate()}>
            Create one
          </button>
          .
        </p>
      ) : (
        <>
          <div>
            <div className="mb-4 flex items-center justify-between">
               <div className="text-sm text-muted-foreground">{projects.length} total projects</div>
               <Button type="button" variant="outline" size="sm" onClick={() => void load()}>Refresh</Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {slice.map((proj) => {
                const state = projectDeploymentStatus(proj.id, deployments);
                const disp = getDisplayDeployment(proj.id, deployments);
                const port = disp ? disp.port : proj.basePort;
                const envLabel = disp ? guessEnvironmentLabel(proj, disp) : "production";
                const url = publicEnvironmentUrl(proj, envLabel !== "—" ? envLabel : "production", port);
                return (
                  <Link key={proj.id} to={`/projects/${proj.id}`} className="block group">
                    <Card className="group relative bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-5 hover:border-[#0070f3]/50 transition-all duration-300 overflow-hidden h-full">
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0070f3]/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-base font-semibold text-white tracking-tight group-hover:text-[#0070f3] transition-colors">
                          {proj.name}
                        </span>
                        <StatusBadge status={state} />
                      </div>
                      <p className="text-xs font-mono text-muted-foreground truncate mb-4">
                        {url ? url.replace(/^https?:\/\//, "") : "Not deployed"}
                      </p>
                      <div className="text-xs text-muted-foreground pt-4 border-t border-[#1f1f1f] flex items-center justify-between">
                        <span className="font-mono">{formatUptime(proj.id, deployments)} uptime</span>
                        <span className="font-mono uppercase text-[10px] px-2 py-0.5 rounded bg-[#161616] border border-[#1f1f1f] text-foreground">
                          {envLabel}
                        </span>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>Showing {slice.length ? pageSafe * PAGE_SIZE + 1 : 0}–{pageSafe * PAGE_SIZE + slice.length} of {projects.length}</span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={pageSafe <= 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button type="button" variant="outline" size="sm" disabled={pageSafe >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <AggregateJobLogStream title="System live logs" pollMs={7000} />
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">Resource usage</CardTitle>
                <CardDescription>Host running VersionGate API + worker.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hostStats ? (
                  <>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">CPU</p>
                      <p className="text-2xl font-semibold tabular-nums">{hostStats.cpu_percent.toFixed(1)}%</p>
                      <Progress value={Math.min(100, hostStats.cpu_percent)} className="mt-1 h-2" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Memory</p>
                      <p className="text-2xl font-semibold tabular-nums">{hostStats.memory_percent.toFixed(1)}%</p>
                      <Progress value={Math.min(100, hostStats.memory_percent)} className="mt-1 h-2" />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading host metrics…</p>
                )}
                <Link to="/system" className={cn(buttonVariants({ variant: "link", className: "h-auto px-0 text-xs" }))}>
                  Open system health
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {deleteTarget ? (
        <DeleteProjectDialog
          open
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          projectId={deleteTarget.id}
          projectName={deleteTarget.name}
          navigateTo="/projects"
          onDeleted={() => void load()}
        />
      ) : null}
    </div>
  );
}
