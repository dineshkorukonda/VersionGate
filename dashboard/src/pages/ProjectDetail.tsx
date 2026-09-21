import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { DeleteProjectDialog } from "@/components/modals/DeleteProjectDialog";
import { projectTabFromPath, type ProjectTab } from "@/lib/project-routes";
import {
  checkAutoDeploy,
  getDeployments,
  getProject,
  getProjectAnalytics,
  getProjectEnvironments,
  getProjectLogs,
  listProjectDomains,
  listProjectJobs,
  updateProject,
  updateProjectEnv,
  rollback,
  triggerDeploy,
  type Deployment,
  type EnvironmentSummary,
  type JobRecord,
  type Project,
  type ProjectAnalytics,
  type ProjectDomain,
} from "@/lib/api";
import { ProjectDetailCronTab } from "@/components/project-detail/ProjectDetailCronTab";
import { ProjectDetailDatabasesTab } from "@/components/project-detail/ProjectDetailDatabasesTab";
import { ProjectDetailDomainsTab } from "@/components/project-detail/ProjectDetailDomainsTab";
import { ProjectDetailEnvTab } from "@/components/project-detail/ProjectDetailEnvTab";
import { ProjectDetailLogsTab } from "@/components/project-detail/ProjectDetailLogsTab";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { BlueGreenTrafficCard } from "@/components/BlueGreenTrafficCard";
import { getDeployingDeployment, publicProjectLiveUrl } from "@/lib/deployment-display";
import { DeploymentList } from "@/components/DeploymentList";
import { type EnvPair } from "@/components/EnvVariablesEditor";
import { VercelCardBox } from "@/components/ui/VercelCardBox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  NavIconCheck,
  NavIconChevron,
} from "@/components/nav-icons";

function copyText(text: string, label: string) {
  void navigator.clipboard.writeText(text).then(
    () => toast.success(`${label} copied`),
    () => toast.error("Copy failed")
  );
}

export function ProjectDetail() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { id } = useParams<{ id: string }>();
  const activeTab: ProjectTab = id ? projectTabFromPath(pathname, id) : "overview";

  const [project, setProject] = useState<Project | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [, setJobs] = useState<JobRecord[]>([]);
  const [customDomains, setCustomDomains] = useState<ProjectDomain[]>([]);
  const [, setEnvironments] = useState<EnvironmentSummary[]>([]);
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Settings editing draft states
  const [projectNameDraft, setProjectNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [buildContextDraft, setBuildContextDraft] = useState(".");
  const [packageManagerDraft, setPackageManagerDraft] = useState("auto");
  const [installCommandDraft, setInstallCommandDraft] = useState("");
  const [buildCommandDraft, setBuildCommandDraft] = useState("");
  const [startCommandDraft, setStartCommandDraft] = useState("");
  const [showCustomCommands, setShowCustomCommands] = useState(false);
  const [savingBuildSettings, setSavingBuildSettings] = useState(false);
  const [savingBuildAndDeploy, setSavingBuildAndDeploy] = useState(false);

  const [localPathDraft, setLocalPathDraft] = useState("");
  const [savingPathSettings, setSavingPathSettings] = useState(false);

  const [deploymentTypeDraft, setDeploymentTypeDraft] = useState<"docker" | "pm2">("docker");
  const [appPortDraft, setAppPortDraft] = useState("3000");
  const [healthPathDraft, setHealthPathDraft] = useState("/health");
  const [savingRuntimeSettings, setSavingRuntimeSettings] = useState(false);

  const [repoUrlDraft, setRepoUrlDraft] = useState("");
  const [branchDraft, setBranchDraft] = useState("main");
  const [savingGitSettings, setSavingGitSettings] = useState(false);

  // Environment variables draft state
  const [envPairs, setEnvPairs] = useState<EnvPair[]>([]);
  const [savingEnv, setSavingEnv] = useState(false);

  const [runtimeLogs, setRuntimeLogs] = useState<string[]>([]);
  const [runtimeContainerName, setRuntimeContainerName] = useState<string | null>(null);
  const [runtimeLogsLoading, setRuntimeLogsLoading] = useState(false);
  const [runtimeAutoRefresh, setRuntimeAutoRefresh] = useState(false);

  // Deployment filters state
  const [authorFilter, setAuthorFilter] = useState<string | null>(null);
  const [envFilter, setEnvFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

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
    if (activeTab === "logs") {
      void fetchRuntimeLogs();
    }
  }, [activeTab, fetchRuntimeLogs]);

  useEffect(() => {
    if (!runtimeAutoRefresh || !id || activeTab !== "logs") return;
    const interval = setInterval(() => {
      void fetchRuntimeLogs();
    }, 5000);
    return () => clearInterval(interval);
  }, [runtimeAutoRefresh, id, activeTab, fetchRuntimeLogs]);

  const load = async (isSilent = false) => {
    if (!id) {
      setLoading(false);
      setProject(null);
      return;
    }
    if (!isSilent && !project) {
      setLoading(true);
    }

    try {
      const [projRes, depsRes, jobsRes, domsRes, envsRes, analyticsRes] = await Promise.all([
        getProject(id),
        getDeployments(id),
        listProjectJobs(id).catch(() => ({ jobs: [] })),
        listProjectDomains(id).catch(() => ({ domains: [] })),
        getProjectEnvironments(id).catch(() => ({ environments: [] })),
        getProjectAnalytics(id).catch(() => null),
      ]);

      setProject(projRes.project);
      setProjectNameDraft(projRes.project.name);
      setBuildContextDraft(projRes.project.buildContext || ".");
      setPackageManagerDraft(projRes.project.packageManager || "auto");
      setInstallCommandDraft(projRes.project.installCommand || "");
      setBuildCommandDraft(projRes.project.buildCommand || "");
      setStartCommandDraft(projRes.project.startCommand || "");
      setShowCustomCommands(
        Boolean(
          projRes.project.installCommand ||
          projRes.project.buildCommand ||
          projRes.project.startCommand
        )
      );
      setLocalPathDraft(projRes.project.localPath || "");
      setDeploymentTypeDraft((projRes.project.deploymentType as "docker" | "pm2") || "docker");
      setAppPortDraft(String(projRes.project.appPort || 3000));
      setHealthPathDraft(projRes.project.healthPath || "/health");
      setRepoUrlDraft(projRes.project.repoUrl || "");
      setBranchDraft(projRes.project.branch || "main");

      // Parse env variables into pairs
      if (projRes.project.env && typeof projRes.project.env === "object") {
        const pairs: EnvPair[] = Object.entries(projRes.project.env).map(([k, v]) => ({
          key: k,
          value: String(v),
        }));
        setEnvPairs(pairs.length > 0 ? pairs : [{ key: "", value: "" }]);
      } else {
        setEnvPairs([{ key: "", value: "" }]);
      }

      setDeployments(depsRes.deployments);
      setJobs(jobsRes.jobs);
      setCustomDomains(domsRes.domains);
      if ("environments" in envsRes) {
        setEnvironments(envsRes.environments);
      }
      setAnalytics(analyticsRes?.analytics ?? null);
    } catch {
      if (!isSilent) setProject(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const productionDeployments = useMemo(() => {
    return deployments.filter(
      (d) => !d.environmentName || d.environmentName.toLowerCase() === "production"
    );
  }, [deployments]);

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

  const onSaveProjectName = async () => {
    if (!id || !projectNameDraft.trim()) return;
    setSavingName(true);
    try {
      await updateProject(id, { name: projectNameDraft.trim() });
      toast.success("[ OK ] Project name updated");
      void load(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update project name");
    } finally {
      setSavingName(false);
    }
  };

  const onSaveBuildSettings = async (redeploy = false) => {
    if (!id) return;
    if (redeploy) setSavingBuildAndDeploy(true);
    else setSavingBuildSettings(true);
    try {
      await updateProject(id, {
        buildContext: buildContextDraft.trim() || ".",
        packageManager: packageManagerDraft,
        installCommand: installCommandDraft.trim() || null,
        buildCommand: buildCommandDraft.trim() || null,
        startCommand: startCommandDraft.trim() || null,
      });
      toast.success("[ OK ] Build and development settings saved");
      if (redeploy) {
        const r = await triggerDeploy(id);
        toast.success(`Redeployment queued — job ${r.jobId.slice(0, 8)}…`);
        navigate(`/projects/${id}/deploy/${r.jobId}`);
      } else {
        void load(true);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save build settings");
    } finally {
      setSavingBuildSettings(false);
      setSavingBuildAndDeploy(false);
    }
  };

  const onSaveRuntimeSettings = async () => {
    if (!id) return;
    const port = Number.parseInt(appPortDraft, 10);
    if (!Number.isFinite(port) || port < 1 || port > 65535) {
      toast.error("App port must be between 1 and 65535.");
      return;
    }
    setSavingRuntimeSettings(true);
    try {
      await updateProject(id, {
        deploymentType: deploymentTypeDraft,
        appPort: port,
        healthPath: healthPathDraft.trim() || "/health",
      });
      toast.success("[ OK ] Runtime and health check settings saved");
      void load(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save runtime settings");
    } finally {
      setSavingRuntimeSettings(false);
    }
  };

  const onSaveGitSettings = async () => {
    if (!id) return;
    if (!repoUrlDraft.trim()) {
      toast.error("Repository URL cannot be empty.");
      return;
    }
    setSavingGitSettings(true);
    try {
      await updateProject(id, {
        repoUrl: repoUrlDraft.trim(),
        branch: branchDraft.trim() || "main",
      });
      toast.success("[ OK ] Git repository and branch settings saved");
      void load(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save git settings");
    } finally {
      setSavingGitSettings(false);
    }
  };

  const onSavePathSettings = async () => {
    if (!id) return;
    setSavingPathSettings(true);
    try {
      await updateProject(id, {
        localPath: localPathDraft.trim() || null,
      });
      toast.success("[ OK ] Root directory path saved");
      void load(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save root directory path");
    } finally {
      setSavingPathSettings(false);
    }
  };

  const onSaveEnvVars = async () => {
    if (!id) return;
    setSavingEnv(true);
    try {
      const envObj: Record<string, string> = {};
      for (const p of envPairs) {
        if (p.key.trim()) envObj[p.key.trim()] = p.value;
      }
      await updateProjectEnv(id, envObj);
      toast.success("[ OK ] Environment variables saved");
      void load(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save environment variables");
    } finally {
      setSavingEnv(false);
    }
  };

  const [syncingAutoDeploy, setSyncingAutoDeploy] = useState(false);

  const onCheckAutoDeploy = async () => {
    if (!project?.id) return;
    setSyncingAutoDeploy(true);
    try {
      const res = await checkAutoDeploy({ projectId: project.id });
      const result = res.results?.[0];
      if (result) {
        if (result.deployTriggered) {
          toast.success(`[ LIVE ] ${result.reason} — Deployment queued!`);
          void load(true);
        } else {
          toast.success(`[ OK ] ${result.reason}`);
        }
      } else {
        toast.success("[ OK ] Auto-deploy sync completed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sync auto-deploy");
    } finally {
      setSyncingAutoDeploy(false);
    }
  };

  const webhookUrl = useMemo(() => {
    if (!project?.webhookSecret) return "";
    return `${window.location.origin}/api/webhooks/${project.webhookSecret}`;
  }, [project?.webhookSecret]);

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
  const repoHref = project.repoUrl.startsWith("http://") || project.repoUrl.startsWith("https://")
    ? project.repoUrl
    : `https://${project.repoUrl}`;

  return (
    <div className="w-full space-y-8 font-sans">
      {/* 
        NO DUPLICATE HEADER OR TAB BAR HERE!
        The sidebar handles navigation for Overview, Deployments, Logs, Observability,
        Environment Variables, Domains, Databases, Cron Jobs, Settings.
      */}

      {/* VIEW 1: OVERVIEW (Screenshot 1) */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Authentic Vercel "Production Deployment" Hero Card */}
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
            {/* Card Header with title and Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800/80 px-6 py-4">
              <h2 className="text-base font-semibold text-white">Production Deployment</h2>

              <div className="flex flex-wrap items-center gap-2">
                {/* GitHub repository link */}
                <a
                  href={repoHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex size-8 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:border-neutral-700 hover:text-white transition-colors"
                  title="View Git Repository"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" className="size-4">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                </a>

                {/* Instant Rollback */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void onRollback()}
                  className="border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:border-neutral-700 hover:text-white text-xs h-8 gap-1.5"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3.5">
                    <path d="M2.5 8a5.5 5.5 0 0 1 9.39-3.89M13.5 8a5.5 5.5 0 0 1-9.39 3.89M2.5 4v4h4M13.5 12V8h-4" />
                  </svg>
                  <span>Instant Rollback</span>
                </Button>

                {/* Visit dropdown */}
                {liveUrl ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "border-neutral-800 bg-white text-black hover:bg-neutral-200 text-xs font-semibold h-8 gap-1.5"
                      )}
                    >
                      <span>Visit</span>
                      <NavIconChevron className="size-3 opacity-80" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 border-neutral-800 bg-[#0a0a0a] text-white">
                      <DropdownMenuItem
                        className="cursor-pointer text-xs hover:bg-neutral-900"
                        onClick={() => window.open(liveUrl, "_blank")}
                      >
                        <span className="truncate">{liveUrl.replace(/^https?:\/\//, "")}</span>
                      </DropdownMenuItem>
                      {customDomains.map((cd) => (
                        <DropdownMenuItem
                          key={cd.id}
                          className="cursor-pointer text-xs hover:bg-neutral-900"
                          onClick={() => window.open(`https://${cd.hostname}`, "_blank")}
                        >
                          <span className="truncate">{cd.hostname}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    size="sm"
                    className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs h-8"
                    onClick={() => void onDeploy()}
                  >
                    Deploy
                  </Button>
                )}

                {/* Overflow action dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className:
                        "border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:text-white text-xs h-8 px-2.5",
                    })}
                  >
                    •••
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="border-neutral-800 bg-[#0a0a0a] text-white text-xs">
                    <DropdownMenuItem
                      onClick={() => void onDeploy()}
                      className="text-neutral-300 hover:text-white cursor-pointer"
                    >
                      Trigger New Deployment
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate(`/projects/${project.id}/settings`)}
                      className="text-neutral-300 hover:text-white cursor-pointer"
                    >
                      Project Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-neutral-800" />
                    <DropdownMenuItem
                      onClick={() => setDeleteOpen(true)}
                      className="text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Main Hero Card Body: Left Thumbnail Preview, Right Metadata Details */}
            <div className="p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                {/* Left Preview Container Mockup */}
                <div className="w-full lg:w-80 shrink-0">
                  <div className="aspect-[16/10] rounded-lg border border-neutral-800 bg-black/60 overflow-hidden flex flex-col justify-between p-4 relative group">
                    <div className="flex items-center gap-1.5 opacity-60">
                      <span className="size-2 rounded-full bg-neutral-700" />
                      <span className="size-2 rounded-full bg-neutral-700" />
                      <span className="size-2 rounded-full bg-neutral-700" />
                      <div className="ml-2 flex-1 truncate rounded bg-neutral-950 px-2 py-0.5 text-[9px] font-mono text-neutral-500">
                        {liveUrl ? liveUrl.replace(/^https?:\/\//, "") : "versiongate.app"}
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center my-auto">
                      <div className="size-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white font-bold text-base mb-1 shadow-inner">
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-semibold text-xs text-white truncate max-w-full">{project.name}</p>
                      <span className="text-[10px] text-neutral-500 font-mono mt-0.5">
                        {displayStatus === "ACTIVE" ? "Production Ready" : displayStatus}
                      </span>
                    </div>

                    {liveUrl && (
                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-neutral-400 hover:text-white flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>Open Preview</span>
                        <span className="text-[9px]">↗</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Right Metadata Grid matching Screenshot 1 */}
                <div className="flex-1 space-y-4 min-w-0">
                  <div className="grid gap-3 sm:grid-cols-2 text-xs">
                    <div>
                      <span className="text-neutral-500 font-medium">Deployment</span>
                      <p className="mt-1 font-mono text-neutral-200 truncate select-all">
                        {liveUrl ? liveUrl.replace(/^https?:\/\//, "") : `${project.name}.internal`}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-neutral-500 font-medium">Domains</span>
                        <button
                          type="button"
                          onClick={() => navigate(`/projects/${project.id}/domains`)}
                          className="text-neutral-400 hover:text-white text-xs font-semibold"
                        >
                          +
                        </button>
                      </div>
                      <p className="mt-1 truncate">
                        {customDomains.length > 0 ? (
                          <a
                            href={`https://${customDomains[0].hostname}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-emerald-400 hover:underline inline-flex items-center gap-1"
                          >
                            <span>{customDomains[0].hostname}</span>
                            <span className="text-[10px]">↗</span>
                          </a>
                        ) : (
                          <span className="text-neutral-500 font-mono">None configured</span>
                        )}
                      </p>
                    </div>

                    <div>
                      <span className="text-neutral-500 font-medium">Status</span>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={cn(
                            "size-2 rounded-full shrink-0",
                            displayStatus === "ACTIVE"
                              ? "bg-emerald-500"
                              : displayStatus === "DEPLOYING"
                                ? "bg-blue-500 animate-pulse"
                                : "bg-neutral-500"
                          )}
                        />
                        <span className="font-medium text-neutral-200">
                          {displayStatus === "ACTIVE" ? "Ready" : displayStatus}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-neutral-500 font-medium">Created</span>
                      <p className="mt-1 text-neutral-400 text-xs">
                        {active?.createdAt ? new Date(active.createdAt).toLocaleDateString() : "Just now"} by{" "}
                        <span className="text-neutral-300 font-medium">
                          {active?.commitAuthor || "system"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Source row */}
                  <div className="border-t border-neutral-800/80 pt-3 text-xs">
                    <span className="text-neutral-500 font-medium">Source</span>
                    <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-neutral-300">
                      <span className="inline-flex items-center gap-1 text-neutral-400">
                        <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5 text-neutral-500">
                          <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
                        </svg>
                        <span>{project.branch}</span>
                      </span>
                      <span className="text-neutral-600">-o-</span>
                      <span className="text-neutral-400">
                        {active?.commitSha ? active.commitSha.slice(0, 7) : "HEAD"}
                      </span>
                      <span className="text-neutral-400 truncate max-w-xs">
                        {active?.commitMessage || "Zero-downtime blue/green deployment active"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deployment Settings expandable banner */}
            <div className="border-t border-neutral-800 bg-black/40 px-6 py-3 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => navigate(`/projects/${project.id}/settings`)}
                className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
              >
                <NavIconChevron className="size-3" />
                <span className="font-semibold text-neutral-300">Deployment Settings</span>
                <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.2 text-[10px] font-medium text-blue-400">
                  2 Recommendations
                </span>
              </button>
            </div>

            {/* Subtext info row */}
            <div className="border-t border-neutral-800 bg-neutral-950/80 px-6 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-neutral-500">
              <span>To update your Production Deployment, push to the main branch.</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/projects/${project.id}/deployments`)}
                  className="font-medium text-neutral-300 hover:text-white transition-colors"
                >
                  Deployments
                </button>
              </div>
            </div>
          </div>

          {/* Bottom 3-Card Grid matching Screenshot 1 */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Card 1: Production Checklist */}
            <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a] p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Production Checklist</h3>
                  <span className="rounded-full border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                    3/5
                  </span>
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="truncate">Connect Git Repository</span>
                    <NavIconCheck className="text-blue-400" />
                  </div>
                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="truncate">Add Custom Domain</span>
                    <NavIconCheck className="text-blue-400" />
                  </div>
                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="truncate">Preview Deployment</span>
                    <NavIconCheck className="text-blue-400" />
                  </div>
                  <div className="flex items-center justify-between text-neutral-500">
                    <span className="truncate">Enable Web Analytics</span>
                    <span className="size-1.5 rounded-full bg-neutral-600" />
                  </div>
                  <div className="flex items-center justify-between text-neutral-500">
                    <span className="truncate">Upgrade to Speed Insights Plus</span>
                    <span className="size-1.5 rounded-full bg-neutral-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Observability 6h */}
            <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a] p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Observability</h3>
                  <span className="text-xs text-neutral-500 font-mono">6h</span>
                </div>

                <div className="space-y-3 pt-1 text-xs">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Edge Requests</span>
                      <span className="font-mono font-semibold text-white">{analytics?.totalHits ?? 32}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-neutral-900 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-2/3" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Function Invocations</span>
                      <span className="font-mono font-semibold text-white">21</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-neutral-900 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full w-1/2" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-neutral-400">Error Rate</span>
                    <span className="font-mono font-semibold text-emerald-400">0%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Analytics */}
            <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a] p-5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Analytics</h3>
                  <NavIconChevron className="size-3 text-neutral-500" />
                </div>
                <p className="text-xs font-medium text-neutral-300">Track Visitors and Page Views</p>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  See real-time traffic, top pages, and audience trends for this deployment.
                </p>
              </div>

              <div className="pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/projects/${project.id}/observability`)}
                  className="w-full border-neutral-800 bg-neutral-900 text-xs text-neutral-200 hover:bg-neutral-800"
                >
                  View Analytics
                </Button>
              </div>
            </div>
          </div>

          {/* Blue-Green Traffic & Live Status Details */}
          <BlueGreenTrafficCard
            project={project}
            deployments={productionDeployments}
            active={active}
            deploying={deploying}
            liveHostPort={liveHostPort}
            liveUrl={liveUrl}
            onCopy={copyText}
          />
        </div>
      )}

      {/* VIEW 2: DEPLOYMENTS (Screenshot 2) */}
      {activeTab === "deployments" && (
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

          {/* Filter Pills row matching Screenshot 2 */}
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

          {/* Deployment List */}
          <DeploymentList
            deployments={filteredDeployments}
            showProject={false}
            emptyMessage="No deployments match your criteria."
          />
        </div>
      )}

      {/* VIEW 3: RUNTIME LOGS */}
      {activeTab === "logs" && (
        <ProjectDetailLogsTab
          runtimeContainerName={runtimeContainerName}
          runtimeLogs={runtimeLogs}
          runtimeLogsLoading={runtimeLogsLoading}
          runtimeAutoRefresh={runtimeAutoRefresh}
          onRefresh={() => void fetchRuntimeLogs()}
          onToggleAutoRefresh={setRuntimeAutoRefresh}
        />
      )}

      {/* VIEW 4: OBSERVABILITY & TELEMETRY */}
      {activeTab === "observability" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <VercelCardBox title="Total Requests" description="Past 24 hours">
              <p className="font-mono text-3xl font-bold text-white">{analytics?.totalHits ?? 0}</p>
            </VercelCardBox>
            <VercelCardBox title="2xx Success" description="Successful responses">
              <p className="font-mono text-3xl font-bold text-emerald-400">{analytics?.status2xx ?? 0}</p>
            </VercelCardBox>
            <VercelCardBox title="4xx Client Error" description="Client side rejections">
              <p className="font-mono text-3xl font-bold text-amber-400">{analytics?.status4xx ?? 0}</p>
            </VercelCardBox>
            <VercelCardBox title="5xx Server Error" description="Upstream proxy errors">
              <p className="font-mono text-3xl font-bold text-red-400">{analytics?.status5xx ?? 0}</p>
            </VercelCardBox>
          </div>

          <VercelCardBox
            title="Upstream Proxy Latency"
            description="Average response time across all container instances."
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold text-white">
                {analytics?.avgLatencyMs ?? 0} ms
              </span>
              <span className="text-xs text-neutral-400">Rolling 24-hour average</span>
            </div>
          </VercelCardBox>

          <BlueGreenTrafficCard
            project={project}
            deployments={productionDeployments}
            active={active}
            deploying={deploying}
            liveHostPort={liveHostPort}
            liveUrl={liveUrl}
            onCopy={copyText}
          />
        </div>
      )}

      {/* VIEW 5: ENVIRONMENT VARIABLES */}
      {activeTab === "env" && (
        <ProjectDetailEnvTab
          envPairs={envPairs}
          onChange={setEnvPairs}
          savingEnv={savingEnv}
          onSave={() => void onSaveEnvVars()}
        />
      )}

      {activeTab === "domains" && (
        <ProjectDetailDomainsTab
          projectId={project.id}
          liveUrl={liveUrl}
          onCopy={copyText}
          onUpdated={() => {
            void load(true);
          }}
        />
      )}

      {activeTab === "databases" && <ProjectDetailDatabasesTab />}

      {activeTab === "cron" && <ProjectDetailCronTab projectId={project.id} project={project} />}

      {/* VIEW 9: PROJECT SETTINGS (Screenshot 3) */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* Box 1: Project Name */}
          <VercelCardBox
            title="Project Name"
            description="Used to identify your Project on the Dashboard, CLI, and in deployment URLs."
            footerLeft={
              <a
                href={repoHref}
                target="_blank"
                rel="noreferrer"
                className="text-neutral-400 hover:text-white transition-colors underline-offset-2 hover:underline"
              >
                Learn more about Project Name ↗
              </a>
            }
            footerAction={
              <Button
                size="sm"
                className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
                onClick={() => void onSaveProjectName()}
                disabled={savingName}
              >
                {savingName ? "Saving..." : "Save"}
              </Button>
            }
          >
            <div className="flex items-center max-w-md rounded-md border border-neutral-800 bg-black overflow-hidden focus-within:border-neutral-600">
              <span className="bg-neutral-900/80 px-3 py-2 text-xs text-neutral-500 font-mono select-none border-r border-neutral-800">
                versiongate.com/korukonda/
              </span>
              <Input
                value={projectNameDraft}
                onChange={(e) => setProjectNameDraft(e.target.value)}
                className="h-9 border-0 bg-transparent px-3 text-xs text-white focus-visible:ring-0"
              />
            </div>
          </VercelCardBox>

          {/* Box 2: Avatar */}
          <VercelCardBox
            title="Avatar"
            description="This is your project's avatar. Click it or drop an image to upload."
            footerLeft={<span>An avatar is optional but recommended.</span>}
          >
            <div className="flex items-center justify-between max-w-md">
              <span className="text-xs text-neutral-400">Custom project logo</span>
              <div className="size-14 rounded-full border border-neutral-800 bg-neutral-900 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                {project.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </VercelCardBox>

          {/* Box 3: Project ID */}
          <VercelCardBox
            title="Project ID"
            description="Used when interacting with the VersionGate API and CLI commands."
            footerLeft={
              <span className="text-neutral-500 font-mono text-[11px]">
                Target project UUID identifier
              </span>
            }
          >
            <div className="flex items-center max-w-md rounded-md border border-neutral-800 bg-black overflow-hidden">
              <span className="flex-1 px-3 py-2 font-mono text-xs text-neutral-300 select-all">
                prj_{project.id}
              </span>
              <button
                type="button"
                onClick={() => copyText(`prj_${project.id}`, "Project ID")}
                className="px-3 py-2 text-xs font-medium text-neutral-400 hover:text-white border-l border-neutral-800 transition-colors"
              >
                Copy
              </button>
            </div>
          </VercelCardBox>

          {/* Box 4: Build & Development Settings */}
          <VercelCardBox
            title="Build & Development Settings"
            description="Configure your project build context subdirectory, package manager, and custom build scripts."
            footerLeft={<span>Build scripts run in isolated container environments before preflight health checks.</span>}
            footerAction={
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-neutral-700 bg-neutral-900 text-xs font-medium text-neutral-200 hover:bg-neutral-800"
                  onClick={() => void onSaveBuildSettings(false)}
                  disabled={savingBuildSettings || savingBuildAndDeploy}
                >
                  {savingBuildSettings ? "Saving…" : "Save Settings"}
                </Button>
                <Button
                  size="sm"
                  className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
                  onClick={() => void onSaveBuildSettings(true)}
                  disabled={savingBuildSettings || savingBuildAndDeploy}
                >
                  {savingBuildAndDeploy ? "Deploying…" : "Save & Redeploy"}
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400">
                    Build Context Subdirectory
                  </label>
                  <Input
                    value={buildContextDraft}
                    onChange={(e) => setBuildContextDraft(e.target.value)}
                    placeholder="."
                    className="h-9 border-neutral-800 bg-black font-mono text-xs text-white"
                  />
                  <p className="text-[11px] text-neutral-500">
                    Subdirectory containing project code (e.g. <code>.</code> or <code>apps/web</code>).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400">
                    Package Manager
                  </label>
                  <select
                    className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white focus:outline-none focus:border-neutral-600"
                    value={packageManagerDraft}
                    onChange={(e) => setPackageManagerDraft(e.target.value)}
                  >
                    <option value="auto">Auto-detect from repository</option>
                    <option value="bun">Bun</option>
                    <option value="pnpm">pnpm</option>
                    <option value="npm">npm</option>
                    <option value="yarn">Yarn</option>
                    <option value="uv">Python (uv)</option>
                    <option value="poetry">Python (Poetry)</option>
                    <option value="pip">Python (pip)</option>
                    <option value="cargo">Rust (Cargo)</option>
                    <option value="composer">PHP (Composer)</option>
                  </select>
                  <p className="text-[11px] text-neutral-500">
                    Engine used to resolve dependencies and build output artifacts.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800/80">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-neutral-300">Custom Build &amp; Start Commands</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs font-mono text-neutral-400 hover:text-white"
                    onClick={() => setShowCustomCommands((prev) => !prev)}
                  >
                    {showCustomCommands ? "[ HIDE COMMANDS ]" : "[ CUSTOM COMMANDS ]"}
                  </Button>
                </div>

                {showCustomCommands && (
                  <div className="grid gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-mono text-neutral-400">Install Command (Optional)</label>
                      <Input
                        value={installCommandDraft}
                        onChange={(e) => setInstallCommandDraft(e.target.value)}
                        placeholder="e.g. pnpm install --frozen-lockfile"
                        className="h-8 border-neutral-800 bg-black font-mono text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-mono text-neutral-400">Build Command (Optional)</label>
                      <Input
                        value={buildCommandDraft}
                        onChange={(e) => setBuildCommandDraft(e.target.value)}
                        placeholder="e.g. npm run build:prod or bun run build"
                        className="h-8 border-neutral-800 bg-black font-mono text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-mono text-neutral-400">Start Command (Optional)</label>
                      <Input
                        value={startCommandDraft}
                        onChange={(e) => setStartCommandDraft(e.target.value)}
                        placeholder="e.g. npm run start or node dist/index.js"
                        className="h-8 border-neutral-800 bg-black font-mono text-xs text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </VercelCardBox>

          {/* Box 5: Root Directory & Local App Path */}
          <VercelCardBox
            title="Root Directory &amp; Host Path"
            description="Configured directory path on the server for adopted applications and local repositories."
            footerLeft={<span>Synced automatically during deployment if local fallback is active.</span>}
            footerAction={
              <Button
                size="sm"
                className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
                onClick={() => void onSavePathSettings()}
                disabled={savingPathSettings}
              >
                {savingPathSettings ? "Saving…" : "Save Path"}
              </Button>
            }
          >
            <div className="space-y-1.5 max-w-xl">
              <label className="text-xs font-medium text-neutral-400">Host Working Directory (localPath)</label>
              <Input
                value={localPathDraft}
                onChange={(e) => setLocalPathDraft(e.target.value)}
                placeholder="/var/versiongate/projects/my-app"
                className="h-9 border-neutral-800 bg-black font-mono text-xs text-white"
              />
              <p className="text-[11px] text-neutral-500">
                Local directory on the host server where this project source or adopted service resides.
              </p>
            </div>
          </VercelCardBox>

          {/* Box 6: Container Runtime & Health Checks */}
          <VercelCardBox
            title="Runtime Engine &amp; Health Checks"
            description="Deployment runner engine, internal container port, and zero-downtime healthcheck endpoint."
            footerLeft={<span>Blue/Green slots (:basePort and :basePort + 1) route traffic only after health checks pass.</span>}
            footerAction={
              <Button
                size="sm"
                className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
                onClick={() => void onSaveRuntimeSettings()}
                disabled={savingRuntimeSettings}
              >
                {savingRuntimeSettings ? "Saving…" : "Save Runtime"}
              </Button>
            }
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-400">Deployment Engine</label>
                <select
                  className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white focus:outline-none focus:border-neutral-600"
                  value={deploymentTypeDraft}
                  onChange={(e) => setDeploymentTypeDraft(e.target.value as "docker" | "pm2")}
                >
                  <option value="docker">Docker Container (Default)</option>
                  <option value="pm2">Host PM2 Supervisor</option>
                </select>
                <p className="text-[11px] text-neutral-500">
                  {deploymentTypeDraft === "pm2" ? "Direct host process execution." : "Isolated Docker container."}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-400">App Internal Port</label>
                <Input
                  type="number"
                  min={1}
                  max={65535}
                  value={appPortDraft}
                  onChange={(e) => setAppPortDraft(e.target.value)}
                  placeholder="3000"
                  className="h-9 border-neutral-800 bg-black font-mono text-xs text-white"
                />
                <p className="text-[11px] text-neutral-500">
                  Port the application listens on internally.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-400">Health Check Endpoint</label>
                <Input
                  value={healthPathDraft}
                  onChange={(e) => setHealthPathDraft(e.target.value)}
                  placeholder="/health"
                  className="h-9 border-neutral-800 bg-black font-mono text-xs text-white"
                />
                <p className="text-[11px] text-neutral-500">
                  HTTP endpoint probed before traffic cutover.
                </p>
              </div>
            </div>
          </VercelCardBox>

          {/* Box 7: Git Webhooks & Automated Deployments */}
          <VercelCardBox
            title="Git Repository &amp; Automated Deployments"
            description="Continuous deployment triggers on push to your repository branch."
            footerLeft={
              <span className="text-[11px] text-neutral-400">
                GitHub App Relay &amp; Direct Webhook endpoints continuously listen for push events on <code className="font-mono text-neutral-200">{project.branch}</code>.
              </span>
            }
            footerAction={
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-neutral-700 bg-neutral-900 text-xs font-medium text-neutral-200 hover:bg-neutral-800"
                  onClick={() => void onCheckAutoDeploy()}
                  disabled={syncingAutoDeploy}
                >
                  {syncingAutoDeploy ? "Checking commits…" : "Sync Latest Commit"}
                </Button>
                <Button
                  size="sm"
                  className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
                  onClick={() => void onSaveGitSettings()}
                  disabled={savingGitSettings}
                >
                  {savingGitSettings ? "Saving…" : "Save Git Settings"}
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400">Git Repository URL</label>
                  <Input
                    value={repoUrlDraft}
                    onChange={(e) => setRepoUrlDraft(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="h-9 border-neutral-800 bg-black font-mono text-xs text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400">Target Production Branch</label>
                  <Input
                    value={branchDraft}
                    onChange={(e) => setBranchDraft(e.target.value)}
                    placeholder="main"
                    className="h-9 border-neutral-800 bg-black font-mono text-xs text-white"
                  />
                </div>
              </div>

              {webhookUrl && (
                <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
                  <label className="text-xs font-medium text-neutral-400">
                    Direct Webhook URL
                  </label>
                  <div className="flex items-center rounded-md border border-neutral-800 bg-black overflow-hidden">
                    <span className="flex-1 px-3 py-2 font-mono text-xs text-neutral-300 select-all truncate">
                      {webhookUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(webhookUrl, "Webhook URL")}
                      className="px-3 py-2 text-xs font-medium text-neutral-400 hover:text-white border-l border-neutral-800 transition-colors shrink-0"
                    >
                      Copy Webhook URL
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Add this payload URL to your GitHub repository under <strong>Settings &rarr; Webhooks</strong> with Content type set to <code>application/json</code>.
                  </p>
                </div>
              )}
            </div>
          </VercelCardBox>

          {/* Box 8: Danger Zone */}
          <VercelCardBox
            title="Danger Zone"
            description="Permanently delete this project, destroy its Docker containers, remove blue/green slots, and purge isolated Nginx configurations."
            danger
            footerLeft={
              <span className="text-xs text-red-300/80">
                This action is irreversible. All environment mappings will be lost.
              </span>
            }
            footerAction={
              <Button
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-xs text-white font-semibold"
                onClick={() => setDeleteOpen(true)}
              >
                Delete Project
              </Button>
            }
          >
            <p className="text-xs text-neutral-400">
              Deleting this project will immediately tear down all running container slots and delete all associated records from the engine database.
            </p>
          </VercelCardBox>
        </div>
      )}

      {/* Modals */}
      <DeleteProjectDialog
        projectId={project.id}
        projectName={project.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        navigateTo="/"
      />
    </div>
  );
}
