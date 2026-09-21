import { request } from "./client";
import type { Deployment, JobRecord, ProjectCommitsResponse } from "./types";

export function triggerDeploy(
  projectId: string,
  environmentId?: string
): Promise<{ jobId: string; status: string; environmentId?: string }> {
  return request("POST", "/deploy", { projectId, ...(environmentId ? { environmentId } : {}) });
}

export function rollback(
  projectId: string,
  environmentId?: string
): Promise<{ jobId: string; status: string; environmentId?: string }> {
  if (environmentId) {
    return request("POST", `/projects/${projectId}/environments/${environmentId}/rollback`);
  }
  return request("POST", `/projects/${projectId}/rollback`);
}

/** Reuse the source environment's ACTIVE image on the target environment (no build). */
export function promoteEnvironment(
  projectId: string,
  targetEnvironmentId: string,
  sourceEnvironmentId: string
): Promise<{
  jobId: string;
  status: string;
  environmentId: string;
  sourceEnvironmentId: string;
  imageTag: string;
}> {
  return request("POST", `/projects/${projectId}/environments/${targetEnvironmentId}/promote`, {
    sourceEnvironmentId,
  });
}

export function getDeployments(projectId: string): Promise<{ deployments: Deployment[] }> {
  return request("GET", `/projects/${projectId}/deployments`);
}

export function getProjectCommits(
  projectId: string,
  limit = 50
): Promise<ProjectCommitsResponse> {
  return request("GET", `/projects/${projectId}/commits?limit=${limit}`);
}

export function getAllDeployments(): Promise<{ deployments: Deployment[] }> {
  return request("GET", "/deployments");
}

export function cancelJob(jobId: string): Promise<{ cancelled: boolean }> {
  return request("DELETE", `/jobs/${jobId}`);
}

export function getJobStatus(jobId: string): Promise<{ job: JobRecord }> {
  return request("GET", `/jobs/${jobId}`);
}

export function listProjectJobs(
  projectId: string,
  opts?: { limit?: number; offset?: number }
): Promise<{ jobs: JobRecord[]; total: number; limit: number; offset: number }> {
  const q = new URLSearchParams();
  if (opts?.limit != null) q.set("limit", String(opts.limit));
  if (opts?.offset != null) q.set("offset", String(opts.offset));
  const qs = q.toString();
  return request("GET", `/projects/${projectId}/jobs${qs ? `?${qs}` : ""}`);
}

/** All deploy/rollback jobs across projects (newest first). */
export function listAllJobs(opts?: { limit?: number; offset?: number }): Promise<{
  jobs: JobRecord[];
  total: number;
  limit: number;
  offset: number;
}> {
  const q = new URLSearchParams();
  if (opts?.limit != null) q.set("limit", String(opts.limit));
  if (opts?.offset != null) q.set("offset", String(opts.offset));
  const qs = q.toString();
  return request("GET", `/jobs${qs ? `?${qs}` : ""}`);
}

export function createWebSocket(jobId: string): WebSocket {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envUrl && /^https?:\/\//i.test(envUrl)) {
    const u = new URL(envUrl);
    const wsProto = u.protocol === "https:" ? "wss:" : "ws:";
    return new WebSocket(`${wsProto}//${u.host}/api/v1/logs/${jobId}`);
  }
  if (typeof window !== "undefined") {
    const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return new WebSocket(`${wsProto}//${window.location.host}/api/v1/logs/${jobId}`);
  }
  return new WebSocket(`ws://localhost:9090/api/v1/logs/${jobId}`);
}
