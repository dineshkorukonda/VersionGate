import { request } from "./client";
import type {
  CreateCronJobInput,
  CronJob,
  CronJobLog,
  ServerCapacitySpecs,
  UpdateCronJobInput,
} from "./types";

export function listCronJobs(projectId?: string): Promise<{ cronJobs: CronJob[] }> {
  const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
  return request("GET", `/cron-jobs${q}`);
}

export function getCronJob(id: string): Promise<{ cronJob: CronJob }> {
  return request("GET", `/cron-jobs/${id}`);
}

export function createCronJob(input: CreateCronJobInput): Promise<{ cronJob: CronJob }> {
  return request("POST", "/cron-jobs", input);
}

export function updateCronJob(id: string, input: UpdateCronJobInput): Promise<{ cronJob: CronJob }> {
  return request("PATCH", `/cron-jobs/${id}`, input);
}

export function deleteCronJob(id: string): Promise<{ status: string }> {
  return request("DELETE", `/cron-jobs/${id}`);
}

export function triggerCronJob(id: string): Promise<{
  jobId: string;
  status: "SUCCESS" | "FAILED" | "TIMEOUT";
  durationMs: number;
  output: string;
}> {
  return request("POST", `/cron-jobs/${id}/run`);
}

export function getCronJobLogs(id: string, limit = 50): Promise<{ logs: CronJobLog[] }> {
  return request("GET", `/cron-jobs/${id}/logs?limit=${limit}`);
}

export function getServerCapacitySpecs(): Promise<ServerCapacitySpecs> {
  return request("GET", "/system/capacity-specs");
}
