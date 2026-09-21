import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProject,
  getDeployments,
  listProjectJobs,
  listProjectDomains,
  getProjectEnvironments,
  getProjectAnalytics,
  type Project,
  type Deployment,
  type JobRecord,
  type ProjectDomain,
  type EnvironmentSummary,
  type ProjectAnalytics,
} from "@/lib/api";
import { queryKeys } from "./query-keys";

export interface ProjectDetailData {
  project: Project;
  deployments: Deployment[];
  jobs: JobRecord[];
  domains: ProjectDomain[];
  environments: EnvironmentSummary[];
  analytics: ProjectAnalytics | null;
}

const REFETCH_MS = 15_000;

async function fetchProjectDetail(projectId: string): Promise<ProjectDetailData> {
  const [projRes, depsRes, jobsRes, domsRes, envsRes, analyticsRes] = await Promise.all([
    getProject(projectId),
    getDeployments(projectId),
    listProjectJobs(projectId).catch(() => ({ jobs: [] as JobRecord[] })),
    listProjectDomains(projectId).catch(() => ({ domains: [] as ProjectDomain[] })),
    getProjectEnvironments(projectId).catch(() => ({ environments: [] as EnvironmentSummary[] })),
    getProjectAnalytics(projectId).catch(() => null),
  ]);

  return {
    project: projRes.project,
    deployments: depsRes.deployments,
    jobs: jobsRes.jobs,
    domains: domsRes.domains,
    environments: "environments" in envsRes ? envsRes.environments : [],
    analytics: analyticsRes?.analytics ?? null,
  };
}

export function useProjectDetail(projectId: string | undefined) {
  return useQuery({
    queryKey: projectId ? queryKeys.project.detail(projectId) : ["project", "detail", "none"],
    queryFn: () => fetchProjectDetail(projectId!),
    enabled: Boolean(projectId),
    refetchInterval: REFETCH_MS,
  });
}

export function useInvalidateProjectDetail() {
  const queryClient = useQueryClient();
  return (projectId: string) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) });
}
