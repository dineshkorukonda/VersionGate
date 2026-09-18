import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { DonutChart } from "@/components/charts/DonutChart";
import { DeleteProjectDialog } from "@/components/modals/DeleteProjectDialog";
import { EditProjectModal } from "@/components/modals/EditProjectModal";
import { projectTabFromPath, projectTabPath, type ProjectTab } from "@/lib/project-routes";
import {
  getDeployments,
  getProject,
  getProjectAnalytics,
  getProjectEnvironments,
  getProjectLogs,
  listProjectDomains,
  listProjectJobs,
  rollback,
  triggerDeploy,
  type Deployment,
  type EnvironmentSummary,
  type JobRecord,
  type Project,
  type ProjectAnalytics,
  type ProjectDomain,
} from "@/lib/api";
import { RuntimeLogsViewer } from "@/components/RuntimeLogsViewer";
import { CronJobsManager } from "@/components/CronJobsManager";
import { EnvironmentChain } from "@/components/badges/EnvironmentChain";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { BlueGreenTrafficCard } from "@/components/BlueGreenTrafficCard";
import { getDeployingDeployment, publicProjectLiveUrl } from "@/lib/deployment-display";
import { ProjectCustomDomainCard } from "@/components/ProjectCustomDomainCard";
import { AggregateJobLogStream } from "@/components/AggregateJobLogStream";
import { ProjectDeploymentLogs } from "@/components/ProjectDeploymentLogs";
import { DeploymentList } from "@/components/DeploymentList";
import { jobArtifactLabel, jobDurationLabel } from "@/lib/job-display";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function copyText(text: string, label: string) {
  void navigator.clipboard.writeText(text).then(
    () => toast.success(`${label} copied`),
    () => toast.error("Copy failed")
  );
}

function notifyUser(title: string, options?: NotificationOptions) {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, options);
    } catch {
      // browser notification error ignored
    }
  }
}

export function ProjectDetail() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { id } = useParams<{ id: string }>();
  const activeTab: ProjectTab = id ? projectTabFromPath(pathname, id) : "overview";

  const [project, setProject] = useState<Project | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [customDomains, setCustomDomains] = useState<ProjectDomain[]>([]);
  const [environments, setEnvironments] = useState<EnvironmentSummary[]>([]);
  const [environmentsError, setEnvironmentsError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const previousStatusMapRef = useRef<Map<string, string>>(new Map());

  const [runtimeLogs, setRuntimeLogs] = useState<string[]>([]);
  const [runtimeContainerName, setRuntimeContainerName] = useState<string | null>(null);
  const [runtimeLogsLoading, setRuntimeLogsLoading] = useState(false);
  const [runtimeAutoRefresh, setRuntimeAutoRefresh] = useState(false);

  const fetchRuntimeLogs = useCallback(async () => {
    if (!id) return;
    setRuntimeLogsLoading(true);
    try {
      const res = await getProjectLogs(id);
      setRuntimeLogs(res.lines);
      setRuntimeContainerName(res.containerName);
    } catch {
      // ignore
    } finally {
      setRuntimeLogsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchRuntimeLogs();
  }, [fetchRuntimeLogs]);

  useEffect(() => {
    if (!runtimeAutoRefresh || !id) return;
    const interval = setInterval(() => {
      void fetchRuntimeLogs();
    }, 5000);
    return () => clearInterval(interval);
  }, [runtimeAutoRefresh, id, fetchRuntimeLogs]);

  const load = async (isSilent = false) => {
    if (!id) {
      setLoading(false);
      setProject(null);
      return;
    }
    if (!isSilent && !project) {
      setLoading(true);
    }
    setEnvironmentsError(null);
    try {
      const [p, d, j] = await Promise.all([
        getProject(id),
        getDeployments(id),
        listProjectJobs(id, { limit: 25 }),
      ]);
      setProject(p.project ?? null);
      setDeployments(d.deployments);
      setJobs(j.jobs);

      // Notification check on status transition for each deployment
      if (previousStatusMapRef.current.size > 0) {
        for (const dep of d.deployments) {
          const prev = previousStatusMapRef.current.get(dep.id);
          if (prev && prev !== dep.status) {
            const versionStr = `v${dep.version}`;
            const projName = p.project?.name ?? "Project";
            if (dep.status === "ACTIVE") {
              const msg = `${projName} ${versionStr} is now LIVE`;
              toast.success(msg);
              notifyUser(msg, { body: `Deployment ${versionStr} succeeded on port ${dep.port}.` });
            } else if (dep.status === "FAILED") {
              const msg = `${projName} ${versionStr} deployment failed`;
              toast.error(msg);
              notifyUser(msg, { body: dep.errorMessage || "Deployment build or health check failed." });
            } else if (dep.status === "ROLLED_BACK") {
              const msg = `${projName} rolled back ${versionStr}`;
              toast.info(msg);
              notifyUser(msg, { body: `Deployment ${versionStr} was rolled back.` });
            }
          }
        }
      }
      const nextStatusMap = new Map<string, string>();
      for (const dep of d.deployments) {
        nextStatusMap.set(dep.id, dep.status);
      }
      previousStatusMapRef.current = nextStatusMap;

      try {
        const envData = await getProjectEnvironments(id);
        setEnvironments(envData.environments ?? []);
        setEnvironmentsError(null);
      } catch (envEx) {
        setEnvironments([]);
        setEnvironmentsError(envEx instanceof Error ? envEx.message : "Failed to load environments");
      }

      try {
        const domainData = await listProjectDomains(id);
        setCustomDomains(domainData.domains ?? []);
      } catch {
        setCustomDomains([]);
      }

      try {
        const analyticsData = await getProjectAnalytics(id);
        setAnalytics(analyticsData.analytics);
      } catch {
        // Analytics load failure is non-blocking
      }
    } catch (e) {
      if (!isSilent) {
        toast.error(e instanceof Error ? e.message : "Failed to load project");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(false);
    const idTimer = window.setInterval(() => void load(true), 10000);
    return () => window.clearInterval(idTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const deploymentPie = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of deployments) {
      m.set(d.status, (m.get(d.status) ?? 0) + 1);
    }
    return [...m.entries()].map(([name, value]) => ({ name, value }));
  }, [deployments]);

  const jobsByStatus = useMemo(() => {
    const m = new Map<string, number>();
    for (const j of jobs) {
      m.set(j.status, (m.get(j.status) ?? 0) + 1);
    }
    return [...m.entries()].map(([name, value]) => ({ name, value }));
  }, [jobs]);

  const prodChainOrder = useMemo(() => {
    if (environments.length === 0) return null;
    return Math.max(...environments.map((e) => e.chainOrder));
  }, [environments]);

  const prodEnvId = useMemo(() => {
    if (prodChainOrder == null) return null;
    return environments.find((e) => e.chainOrder === prodChainOrder)?.id ?? null;
  }, [environments, prodChainOrder]);

  const environmentNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of environments) {
      m.set(e.id, e.name);
    }
    return m;
  }, [environments]);

  const productionDeployments = useMemo(() => {
    if (!prodEnvId) return deployments;
    return deployments.filter((d) => d.environmentId === prodEnvId || d.environmentId === undefined);
  }, [deployments, prodEnvId]);

  const onDeploy = async () => {
    if (!id) return;
    try {
      const r = await triggerDeploy(id);
      toast.success(`Deploy queued (production) — job ${r.jobId.slice(0, 8)}…`);
      navigate(`/projects/${id}/deploy/${r.jobId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deploy failed");
    }
  };

  const onRollback = async () => {
    if (!id) return;
    try {
      const r = await rollback(id);
      toast.success(`Rollback queued — job ${r.jobId.slice(0, 8)}…`);
      navigate(`/projects/${id}/deploy/${r.jobId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Rollback failed");
    }
  };

  const onDeployToEnvironment = async (environmentId: string) => {
    if (!id) return;
    const label =
      environments.find((e) => e.id === environmentId)?.name ?? environmentId.slice(0, 8);
    try {
      const r = await triggerDeploy(id, environmentId);
      toast.success(`Deploy queued — ${label} — job ${r.jobId.slice(0, 8)}…`);
      navigate(`/projects/${id}/deploy/${r.jobId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deploy failed");
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="w-full space-y-4">
        <p className="text-sm text-neutral-400">
          This project could not be loaded. It may have been removed or the response was invalid.
        </p>
        <Link
          to="/"
          className="inline-flex items-center rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
        >
          Back to overview
        </Link>
      </div>
    );
  }

  const active = productionDeployments.find((d) => d.status === "ACTIVE");
  const deploying = id ? getDeployingDeployment(id, productionDeployments) : undefined;
  const displayStatus = deploying
    ? "DEPLOYING"
    : active
      ? "ACTIVE"
      : productionDeployments[0]?.status === "FAILED"
        ? "FAILED"
        : productionDeployments[0]?.status === "ROLLED_BACK"
          ? "ROLLED_BACK"
          : "PENDING";

  const liveHostPort = active ? active.port : project.basePort;
  const liveUrl = publicProjectLiveUrl(project, customDomains, active?.port);
  const repoHref = /^https?:\/\//i.test(project.repoUrl)
    ? project.repoUrl
    : `https://${project.repoUrl}`;
  const totalDeploys = productionDeployments.length;

  return (
    <div className="w-full space-y-8 font-sans">
      {/* Vercel Project Header */}
      <div className="flex flex-col gap-4 border-b border-neutral-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              {project.name}
            </h1>
            <StatusBadge status={displayStatus} />
            {active ? (
              <span className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 font-mono text-[11px] text-neutral-300">
                v{active.version}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
            <a
              href={repoHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-neutral-400 hover:text-white transition-colors"
            >
              <span>{project.repoUrl.replace(/^https?:\/\/(www\.)?/, "")}</span>
              <span className="text-[10px]" aria-hidden>↗</span>
            </a>
            <span className="text-neutral-600">·</span>
            <span className="inline-flex items-center gap-1 font-mono text-neutral-400">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-neutral-500">
                <path fillRule="evenodd" d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25zM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zM3.5 3.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0z" />
              </svg>
              {project.branch}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {liveUrl ? (
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "border-neutral-800 bg-neutral-900/80 text-white hover:bg-neutral-800 text-xs h-8 gap-1.5",
              })}
            >
              <span>Visit</span>
              <span className="text-[10px]" aria-hidden>↗</span>
            </a>
          ) : null}

          <Button
            size="sm"
            className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs h-8"
            onClick={() => void onDeploy()}
          >
            Deploy
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:text-white text-xs h-8 px-2.5",
              })}
            >
              •••
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-neutral-800 bg-[#0a0a0a] text-white text-xs">
              <DropdownMenuItem onClick={() => void onRollback()} className="text-neutral-300 hover:text-white cursor-pointer">
                Rollback to Previous
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditOpen(true)} className="text-neutral-300 hover:text-white cursor-pointer">
                Edit Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-red-400 hover:text-red-300 cursor-pointer">
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          if (!id) return;
          navigate(projectTabPath(id, v as ProjectTab));
        }}
        className="w-full space-y-6"
      >
        <TabsList className="flex h-auto w-full justify-start gap-6 rounded-none border-b border-neutral-800 bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-2 text-sm font-medium text-neutral-400 transition-colors data-[state=active]:border-white data-[state=active]:text-white hover:text-neutral-200"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="deployments"
            className="rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-2 text-sm font-medium text-neutral-400 transition-colors data-[state=active]:border-white data-[state=active]:text-white hover:text-neutral-200"
          >
            Deployments ({productionDeployments.length})
          </TabsTrigger>
          <TabsTrigger
            value="domains"
            className="rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-2 text-sm font-medium text-neutral-400 transition-colors data-[state=active]:border-white data-[state=active]:text-white hover:text-neutral-200"
          >
            Domains ({customDomains.length})
          </TabsTrigger>
          <TabsTrigger
            value="cron"
            className="rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-2 text-sm font-medium text-neutral-400 transition-colors data-[state=active]:border-white data-[state=active]:text-white hover:text-neutral-200"
          >
            Cron Jobs
          </TabsTrigger>
          <TabsTrigger
            value="logs"
            className="rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-2 text-sm font-medium text-neutral-400 transition-colors data-[state=active]:border-white data-[state=active]:text-white hover:text-neutral-200"
          >
            Runtime Logs
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-2 text-sm font-medium text-neutral-400 transition-colors data-[state=active]:border-white data-[state=active]:text-white hover:text-neutral-200"
          >
            Settings
          </TabsTrigger>
        </TabsList>

        {/* 01 // OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* Production Deployment Hero Card */}
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
            <div className="p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                {/* Deployment Metadata */}
                <div className="space-y-4 flex-1">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Production Deployment
                    </span>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-white">
                        {active ? `Deployment v${active.version}` : "No Active Deployment"}
                      </h2>
                      <StatusBadge status={active ? active.status : "PENDING"} />
                    </div>
                  </div>

                  <dl className="grid gap-3 sm:grid-cols-2 text-xs">
                    <div>
                      <dt className="text-neutral-500">Domains</dt>
                      <dd className="mt-0.5">
                        {liveUrl ? (
                          <a
                            href={liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            <span>{liveUrl.replace(/^https?:\/\//, "")}</span>
                            <span className="text-[10px]" aria-hidden>↗</span>
                          </a>
                        ) : (
                          <span className="text-neutral-500">Not assigned</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">Status</dt>
                      <dd className="mt-0.5 text-neutral-300">
                        {active ? `Ready (Port :${liveHostPort})` : "Pending first deployment"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">Git Source</dt>
                      <dd className="mt-0.5 font-mono text-neutral-300 flex items-center gap-1.5">
                        <span>{project.branch}</span>
                        {active?.commitSha ? (
                          <span className="text-neutral-500">({active.commitSha.slice(0, 7)})</span>
                        ) : null}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">Runtime Type</dt>
                      <dd className="mt-0.5 font-mono text-neutral-300 uppercase">
                        {project.deploymentType === "pm2" ? "Host PM2" : "Docker Container"}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Quick Action Preview Box */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                  {liveUrl ? (
                    <a
                      href={liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonVariants({
                        size: "sm",
                        className: "bg-white text-black font-semibold hover:bg-neutral-200 text-xs h-8",
                      })}
                    >
                      Visit Deployment ↗
                    </a>
                  ) : null}
                  {active?.jobId ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white text-xs h-8"
                      onClick={() => navigate(`/projects/${project.id}/deploy/${active.jobId}`)}
                    >
                      View Build Logs
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
              <span>Automatic deployments trigger on push to <code className="font-mono text-neutral-400">{project.branch}</code></span>
              <span className="font-mono">{totalDeploys} deployments total</span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6 min-w-0">
              <BlueGreenTrafficCard
                project={project}
                deployments={productionDeployments}
                active={active}
                deploying={deploying}
                liveHostPort={liveHostPort}
                liveUrl={liveUrl}
                onCopy={copyText}
              />

              {/* Environments Chain */}
              <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">Environments Chain</h3>
                    <p className="mt-1 text-xs text-neutral-400">
                      Deploy and test in development or staging, then promote artifacts to production with zero rebuild time.
                    </p>
                  </div>

                  {environmentsError ? (
                    <div className="rounded-lg border border-red-900/40 bg-red-950/10 p-3 text-xs text-red-400">
                      <p className="font-medium">Could not list environments</p>
                      <p className="mt-1 text-neutral-400">{environmentsError}</p>
                      <Button className="mt-3 text-xs h-7" variant="outline" size="sm" type="button" onClick={() => void load()}>
                        Retry
                      </Button>
                    </div>
                  ) : null}

                  {!environmentsError && environments.length > 0 ? (
                    <EnvironmentChain
                      projectId={project.id}
                      projectName={project.name}
                      environments={environments}
                      onRefresh={async () => {
                        await load();
                      }}
                      onDeployToEnvironment={onDeployToEnvironment}
                    />
                  ) : null}
                </div>
                <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
                  Promotions reuse exact built images for consistency.
                </div>
              </div>

              {/* Traffic & Telemetry */}
              <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white">Project Traffic & Telemetry</h3>
                      <p className="mt-1 text-xs text-neutral-400">
                        Live reverse proxy traffic metrics over rolling 24h window.
                      </p>
                    </div>
                    <span className="font-mono text-xs text-neutral-500">Rolling 24h</span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border border-neutral-800 bg-black/50 p-3.5">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Total Requests</span>
                      <p className="mt-1 font-mono text-2xl font-bold text-white">{analytics?.totalHits ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-neutral-800 bg-black/50 p-3.5">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-400">Success (2xx)</span>
                      <p className="mt-1 font-mono text-2xl font-bold text-emerald-400">{analytics?.status2xx ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-neutral-800 bg-black/50 p-3.5">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-amber-400">Client Err (4xx)</span>
                      <p className="mt-1 font-mono text-2xl font-bold text-amber-400">{analytics?.status4xx ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-neutral-800 bg-black/50 p-3.5">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-red-400">Server Err (5xx)</span>
                      <p className="mt-1 font-mono text-2xl font-bold text-red-400">{analytics?.status5xx ?? 0}</p>
                    </div>
                  </div>

                  {analytics && analytics.avgLatencyMs > 0 ? (
                    <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-800/60">
                      <span>Average upstream proxy response latency:</span>
                      <span className="font-mono font-semibold text-white">{analytics.avgLatencyMs} ms</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Quick Reference Aside */}
            <aside className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
                <div className="p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-white">Project Information</h3>

                  <div className="space-y-3 text-xs divide-y divide-neutral-800/60">
                    <div className="pt-2 first:pt-0">
                      <span className="text-neutral-500">Live URL</span>
                      {liveUrl ? (
                        <a
                          href={liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 block break-all font-mono text-xs text-emerald-400 hover:underline"
                        >
                          {liveUrl.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <span className="mt-0.5 block text-neutral-500 font-mono text-xs">Not deployed</span>
                      )}
                    </div>

                    <div className="pt-2 grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-neutral-500">Internal Port</span>
                        <p className="mt-0.5 font-mono text-neutral-200">:{project.appPort}</p>
                      </div>
                      <div>
                        <span className="text-neutral-500">Host Ports</span>
                        <p className="mt-0.5 font-mono text-neutral-200">
                          {project.basePort}–{project.basePort + 1}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="text-neutral-500">Target Branch</span>
                      <p className="mt-0.5 font-mono text-neutral-200">{project.branch}</p>
                    </div>

                    <div className="pt-2">
                      <span className="text-neutral-500">Health Path</span>
                      <p className="mt-0.5 font-mono text-neutral-200">{project.healthPath}</p>
                    </div>

                    <div className="pt-2">
                      <span className="text-neutral-500">Total Deployments</span>
                      <p className="mt-0.5 font-mono text-neutral-200">{totalDeploys}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-800 bg-black px-5 py-3 text-xs text-neutral-500">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </div>
            </aside>
          </div>
        </TabsContent>

        {/* 02 // DEPLOYMENTS TAB */}
        <TabsContent value="deployments" className="space-y-6">
          {id ? (
            <ProjectDeploymentLogs projectId={id} onRollback={() => void onRollback()} />
          ) : null}

          {/* Deployment Jobs Audit Table */}
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
            <div className="p-6 border-b border-neutral-800">
              <h3 className="text-base font-semibold text-white">Deployment Jobs Audit</h3>
              <p className="mt-1 text-xs text-neutral-400">
                Detailed execution records of build, rollback, and promotion tasks.
              </p>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-neutral-800 hover:bg-transparent text-neutral-500 text-xs">
                    <TableHead className="pl-6">Job ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Environment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Artifact</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="pr-6 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-neutral-500 text-xs">
                        No jobs recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobs.map((job) => {
                      const dep = job.deploymentId ? deployments.find((d) => d.id === job.deploymentId) : undefined;
                      const envName =
                        dep?.environmentId != null ? environmentNameById.get(dep.environmentId) ?? "—" : "Production";
                      return (
                        <TableRow key={job.id} className="border-neutral-800/60 text-xs hover:bg-neutral-900/40">
                          <TableCell className="pl-6 font-mono text-xs text-neutral-300">
                            #{job.id.slice(0, 8)}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-medium text-white">{job.type}</TableCell>
                          <TableCell className="text-neutral-400">{envName}</TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium border",
                                job.status === "COMPLETE"
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                  : job.status === "FAILED"
                                    ? "border-red-500/30 bg-red-500/10 text-red-400"
                                    : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                              )}
                            >
                              <span
                                className={cn(
                                  "size-1.5 rounded-full shrink-0",
                                  job.status === "COMPLETE" ? "bg-emerald-500" : job.status === "FAILED" ? "bg-red-500" : "bg-blue-500 animate-pulse"
                                )}
                              />
                              {job.status}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-neutral-400">{jobArtifactLabel(job)}</TableCell>
                          <TableCell className="text-neutral-400">{jobDurationLabel(job)}</TableCell>
                          <TableCell className="pr-6 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-neutral-800 text-neutral-300 hover:text-white"
                              onClick={() => navigate(`/projects/${project.id}/deploy/${job.id}`)}
                            >
                              View Logs
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {deployments.length > 0 || jobs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-white">Deployments by Status</h3>
                  <p className="mt-1 text-xs text-neutral-400">Release health distribution.</p>
                  <div className="mt-4 flex justify-center">
                    <DonutChart data={deploymentPie} emptyLabel="No deployments" />
                  </div>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-white">Jobs Audit Breakdown</h3>
                  <p className="mt-1 text-xs text-neutral-400">Execution audit breakdown.</p>
                  <div className="mt-4 flex justify-center">
                    {jobs.length > 0 ? (
                      <DonutChart data={jobsByStatus} emptyLabel="No jobs" />
                    ) : (
                      <div className="flex h-48 items-center justify-center text-xs text-neutral-500 font-mono">
                        No jobs yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </TabsContent>

        {/* 03 // DOMAINS & NETWORKING TAB */}
        <TabsContent value="domains" className="space-y-6">
          <ProjectCustomDomainCard
            projectId={project.id}
            liveUrl={liveUrl}
            onCopy={copyText}
            onUpdated={() => {
              void load(true);
            }}
          />

          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
            <div className="p-6 space-y-3">
              <h3 className="text-base font-semibold text-white">Zero-Downtime Reverse Proxy Architecture</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Each custom domain is isolated into its own Nginx virtual host configuration under{" "}
                <code className="rounded bg-neutral-900 px-1.5 py-0.5 font-mono text-neutral-300">/etc/nginx/conf.d/</code>.
                During blue-green deployment transitions, VersionGate atomically shifts traffic between slot ports{" "}
                (<code className="font-mono text-neutral-300">:{project.basePort}</code> or{" "}
                <code className="font-mono text-neutral-300">:{project.basePort + 1}</code>) and initiates a zero-packet-drop reload.
              </p>
            </div>
            <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
              Automated TLS certificate management powered by Let's Encrypt Certbot
            </div>
          </div>
        </TabsContent>

        {/* 04 // RUNTIME LOGS TAB */}
        <TabsContent value="logs" className="space-y-6">
          <RuntimeLogsViewer
            title="Live Application Container Logs (stdout/stderr)"
            containerName={runtimeContainerName}
            logs={runtimeLogs}
            loading={runtimeLogsLoading}
            onRefresh={() => void fetchRuntimeLogs()}
            autoRefresh={runtimeAutoRefresh}
            onToggleAutoRefresh={setRuntimeAutoRefresh}
            emptyMessage="No active container running or no container logs emitted yet."
            maxHeightClass="max-h-96"
          />

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Recent Deployment Tail</h3>
            <AggregateJobLogStream title="Recent jobs on this instance" pollMs={8000} />
          </div>
        </TabsContent>

        {/* 05 // CRON JOBS TAB */}
        <TabsContent value="cron" className="space-y-6">
          <CronJobsManager projectId={project.id} project={project} />
        </TabsContent>

        {/* 06 // SETTINGS TAB */}
        <TabsContent value="settings" className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-white">Project Configuration</h3>
                  <p className="mt-1 text-xs text-neutral-400">
                    Docker build context, internal app ports, and healthcheck endpoints.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs shrink-0"
                  onClick={() => setEditOpen(true)}
                >
                  Edit Configuration
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 pt-2">
                <div className="rounded-lg border border-neutral-800 bg-black/50 p-4">
                  <span className="text-[11px] font-medium text-neutral-500">Health Check Path</span>
                  <p className="mt-1 font-mono text-sm text-white">{project.healthPath}</p>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-black/50 p-4">
                  <span className="text-[11px] font-medium text-neutral-500">Build Context Directory</span>
                  <p className="mt-1 font-mono text-sm text-white">{project.buildContext}</p>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-black/50 p-4">
                  <span className="text-[11px] font-medium text-neutral-500">Host Port Range</span>
                  <p className="mt-1 font-mono text-sm text-white">
                    {project.basePort} – {project.basePort + 1}
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
              Host ports are allocated automatically to avoid collisions.
            </div>
          </div>

          {/* Danger Zone */}
          <div className="overflow-hidden rounded-xl border border-red-900/40 bg-black">
            <div className="p-6 space-y-2">
              <h3 className="text-base font-semibold text-red-400">Danger Zone</h3>
              <p className="text-xs text-neutral-400">
                Permanently delete this project, destroy its Docker containers, remove blue/green slots, and purge isolated Nginx configurations.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-red-950/60 bg-red-950/10 px-6 py-3">
              <span className="text-xs text-red-300/80">This action is irreversible. All environment mappings will be lost.</span>
              <Button
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-xs text-white"
                onClick={() => setDeleteOpen(true)}
              >
                Delete Project
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <EditProjectModal
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
        onUpdated={() => {
          void load(false);
        }}
      />

      <DeleteProjectDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        projectId={project.id}
        projectName={project.name}
        navigateTo="/"
      />
    </div>
  );
}
