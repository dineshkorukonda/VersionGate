import { request } from "./client";
import type {
  ComprehensiveStatusReport,
  DiscoveredDeployment,
  EngineHealthReport,
  PreflightReport,
  ServerStats,
  SystemDashboardResponse,
} from "./types";

export function getServerStats(): Promise<ServerStats> {
  return request("GET", "/server/stats");
}

export function getPreflight(): Promise<PreflightReport> {
  return request("GET", "/system/preflight");
}

export function getServerDashboard(): Promise<SystemDashboardResponse> {
  return request("GET", "/system/server-dashboard");
}

export function getEngineHealth(): Promise<EngineHealthReport> {
  return request("GET", "/system/engine-health");
}

export function discoverServerDeployments(): Promise<{ candidates: DiscoveredDeployment[] }> {
  return request("GET", "/system/discover-deployments");
}

export function getSystemStatusOverview(): Promise<ComprehensiveStatusReport> {
  return request("GET", "/system/status-overview");
}

export function checkAutoDeploy(options: { projectId?: string; forceDeploy?: boolean } = {}): Promise<{
  checkedCount: number;
  triggeredCount: number;
  results: Array<{
    projectId: string;
    projectName: string;
    branch: string;
    latestCommitSha?: string;
    deployedCommitSha?: string;
    synced: boolean;
    deployTriggered: boolean;
    jobId?: string;
    reason: string;
  }>;
}> {
  return request("POST", "/system/check-autodeploy", options);
}
