import { request } from "./client";
import type {
  DomainDnsVerificationResult,
  EnvironmentSummary,
  Project,
  ProjectAnalytics,
  ProjectDomain,
  ProjectDomainSslStatus,
  ProjectSummaryItem,
} from "./types";

export function getProjects(): Promise<{ projects: Project[] }> {
  return request("GET", "/projects");
}

export function getProjectsSummary(): Promise<{ projects: ProjectSummaryItem[] }> {
  return request("GET", "/projects/summary");
}

export function getProject(id: string): Promise<{ project: Project }> {
  return request("GET", `/projects/${id}`);
}

export function getProjectLogs(
  id: string
): Promise<{ lines: string[]; containerName: string | null }> {
  return request("GET", `/projects/${id}/logs`);
}

export function listProjectDomains(projectId: string): Promise<{
  domains: ProjectDomain[];
  resolvedPort: number | null;
  expectedIpv4: string | null;
}> {
  return request("GET", `/projects/${projectId}/domains`);
}

export function attachProjectDomain(
  projectId: string,
  hostname: string
): Promise<{ domain: ProjectDomain; resolvedPort: number | null }> {
  return request("POST", `/projects/${projectId}/domains`, { hostname });
}

export function removeProjectDomain(projectId: string, domainId: string): Promise<void> {
  return request("DELETE", `/projects/${projectId}/domains/${domainId}`);
}

export function issueProjectDomainSsl(
  projectId: string,
  domainId: string
): Promise<{ ok: boolean; message: string; sslStatus: ProjectDomainSslStatus }> {
  return request("POST", `/projects/${projectId}/domains/${domainId}/ssl`);
}

export function verifyProjectDomainDns(
  projectId: string,
  domainId: string
): Promise<DomainDnsVerificationResult> {
  return request("POST", `/projects/${projectId}/domains/${domainId}/verify-dns`);
}

export function createProject(data: {
  name: string;
  repoUrl: string;
  branch?: string;
  buildContext?: string;
  appPort: number;
  basePort?: number;
  healthPath?: string;
  deploymentType?: "docker" | "pm2";
  packageManager?: string;
  installCommand?: string | null;
  buildCommand?: string | null;
  startCommand?: string | null;
  env?: Record<string, string>;
}): Promise<{ project: Project }> {
  return request("POST", "/projects", data);
}

export function updateProject(
  id: string,
  data: {
    name?: string;
    repoUrl?: string;
    branch?: string;
    buildContext?: string;
    localPath?: string | null;
    appPort?: number;
    healthPath?: string;
    basePort?: number;
    deploymentType?: "docker" | "pm2";
    packageManager?: string;
    installCommand?: string | null;
    buildCommand?: string | null;
    startCommand?: string | null;
    env?: Record<string, string>;
  }
): Promise<{ project: Project }> {
  return request("PATCH", `/projects/${id}`, data);
}

export function updateProjectEnv(
  id: string,
  env: Record<string, string>
): Promise<{ project: Project }> {
  return request("PATCH", `/projects/${id}/env`, { env });
}

export function getProjectAnalytics(id: string): Promise<{ analytics: ProjectAnalytics }> {
  return request("GET", `/projects/${id}/analytics`);
}

export function deleteProject(id: string): Promise<void> {
  return request("DELETE", `/projects/${id}`);
}

export function listEnvironments(projectId: string): Promise<{ environments: EnvironmentSummary[] }> {
  return request("GET", `/projects/${projectId}/environments`);
}

export function patchEnvironmentEnv(
  projectId: string,
  envId: string,
  env: Record<string, string>
): Promise<{ environment: EnvironmentSummary }> {
  return request("PATCH", `/projects/${projectId}/environments/${envId}/env`, { env });
}

export const getProjectEnvironments = listEnvironments;
