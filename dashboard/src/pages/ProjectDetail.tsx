import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { DeleteProjectDialog } from "@/components/modals/DeleteProjectDialog";
import { projectTabFromPath, type ProjectTab } from "@/lib/project-routes";
import {
  getProjectLogs,
  updateProjectEnv,
  rollback,
  triggerDeploy,
} from "@/lib/api";
import { ProjectDetailCronTab } from "@/components/project-detail/ProjectDetailCronTab";
import { ProjectDetailDatabasesTab } from "@/components/project-detail/ProjectDetailDatabasesTab";
import { ProjectDetailDeploymentsTab } from "@/components/project-detail/ProjectDetailDeploymentsTab";
import { ProjectDetailDomainsTab } from "@/components/project-detail/ProjectDetailDomainsTab";
import { ProjectDetailEnvTab } from "@/components/project-detail/ProjectDetailEnvTab";
import { ProjectDetailLogsTab } from "@/components/project-detail/ProjectDetailLogsTab";
import { ProjectDetailObservabilityTab } from "@/components/project-detail/ProjectDetailObservabilityTab";
import { ProjectDetailOverviewTab } from "@/components/project-detail/ProjectDetailOverviewTab";
import { ProjectDetailSettingsTab } from "@/components/project-detail/ProjectDetailSettingsTab";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getDeployingDeployment, publicProjectLiveUrl } from "@/lib/deployment-display";
import { type EnvPair } from "@/components/EnvVariablesEditor";
import { useInvalidateProjectDetail, useProjectDetail } from "@/hooks/use-project-detail";

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

  const { data, isLoading, isError } = useProjectDetail(id);
  const invalidateProject = useInvalidateProjectDetail();

  const project = data?.project ?? null;
  const deployments = data?.deployments ?? [];
  const customDomains = data?.domains ?? [];
  const analytics = data?.analytics ?? null;

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [envPairs, setEnvPairs] = useState<EnvPair[]>([]);
  const [savingEnv, setSavingEnv] = useState(false);

  const [runtimeLogs, setRuntimeLogs] = useState<string[]>([]);
  const [runtimeContainerName, setRuntimeContainerName] = useState<string | null>(null);
  const [runtimeLogsLoading, setRuntimeLogsLoading] = useState(false);
  const [runtimeAutoRefresh, setRuntimeAutoRefresh] = useState(false);

  useEffect(() => {
    if (!project?.env || typeof project.env !== "object") {
      setEnvPairs([{ key: "", value: "" }]);
      return;
    }
    const pairs: EnvPair[] = Object.entries(project.env).map(([k, v]) => ({
      key: k,
      value: String(v),
    }));
    setEnvPairs(pairs.length > 0 ? pairs : [{ key: "", value: "" }]);
  }, [project]);

  const refreshProject = useCallback(() => {
    if (id) void invalidateProject(id);
  }, [id, invalidateProject]);

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

  const productionDeployments = useMemo(() => {
    return deployments.filter(
      (d) => !d.environmentName || d.environmentName.toLowerCase() === "production"
    );
  }, [deployments]);

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
      refreshProject();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save environment variables");
    } finally {
      setSavingEnv(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (isError || !project) {
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
      {activeTab === "overview" && (
        <ProjectDetailOverviewTab
          project={project}
          customDomains={customDomains}
          productionDeployments={productionDeployments}
          analytics={analytics}
          active={active}
          deploying={deploying}
          displayStatus={displayStatus}
          liveHostPort={liveHostPort}
          liveUrl={liveUrl}
          repoHref={repoHref}
          onDeploy={() => void onDeploy()}
          onRollback={() => void onRollback()}
          onDeleteRequest={() => setDeleteOpen(true)}
          copyText={copyText}
        />
      )}

      {activeTab === "deployments" && (
        <ProjectDetailDeploymentsTab
          deployments={deployments}
          onDeploy={() => void onDeploy()}
        />
      )}

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

      {activeTab === "observability" && (
        <ProjectDetailObservabilityTab
          project={project}
          productionDeployments={productionDeployments}
          analytics={analytics}
          active={active}
          deploying={deploying}
          liveHostPort={liveHostPort}
          liveUrl={liveUrl}
          copyText={copyText}
        />
      )}

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
          onUpdated={refreshProject}
        />
      )}

      {activeTab === "databases" && <ProjectDetailDatabasesTab />}

      {activeTab === "cron" && <ProjectDetailCronTab projectId={project.id} project={project} />}

      {activeTab === "settings" && (
        <ProjectDetailSettingsTab
          project={project}
          onRefresh={refreshProject}
          onDeleteRequest={() => setDeleteOpen(true)}
          copyText={copyText}
        />
      )}

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
