import { githubApiBase, request } from "./client";
import type {
  GithubBranchesResponse,
  GithubDiagnosticsResponse,
  GithubInstallationGateResponse,
  GithubIntegrationStatus,
  GithubReposResponse,
  RepoStackDetection,
} from "./types";

export function getGithubInstallation(): Promise<GithubInstallationGateResponse> {
  return request("GET", "/github/installation", undefined, githubApiBase());
}

export function linkGithubInstallation(installationId: string): Promise<{
  success: boolean;
  installationId: string;
  githubAccountLogin: string;
}> {
  return request<{ success: boolean; installationId: string; githubAccountLogin: string }>(
    "POST",
    "/github/installation/link",
    { installationId },
    githubApiBase()
  );
}

export function deleteGithubInstallation(installationId?: string): Promise<{ success: boolean; message: string }> {
  const q = installationId ? `?installationId=${encodeURIComponent(installationId)}` : "";
  return request<{ success: boolean; message: string }>(
    "DELETE",
    `/github/installation${q}`,
    undefined,
    githubApiBase()
  );
}

export function getGithubIntegrationStatus(): Promise<GithubIntegrationStatus> {
  return request("GET", "/github/status", undefined, githubApiBase());
}

export function getGithubRepos(installationId?: string): Promise<GithubReposResponse> {
  const q = installationId ? `?installationId=${encodeURIComponent(installationId)}` : "";
  return request("GET", `/github/repos${q}`, undefined, githubApiBase());
}

export function testGithubConnection(installationId?: string): Promise<GithubDiagnosticsResponse> {
  const q = installationId ? `?installationId=${encodeURIComponent(installationId)}` : "";
  return request("GET", `/github/test-connection${q}`, undefined, githubApiBase());
}

export function getGithubRepoBranches(
  owner: string,
  repo: string,
  installationId?: string
): Promise<GithubBranchesResponse> {
  const q = installationId ? `?installationId=${encodeURIComponent(installationId)}` : "";
  return request(
    "GET",
    `/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches${q}`,
    undefined,
    githubApiBase()
  );
}

export function detectRepoStack(
  owner: string,
  repo: string,
  branch?: string,
  installationId?: string
): Promise<RepoStackDetection> {
  const params = new URLSearchParams({ owner, repo });
  if (branch) params.set("branch", branch);
  if (installationId) params.set("installationId", installationId);
  return request(
    "GET",
    `/github/repos/detect?${params.toString()}`,
    undefined,
    githubApiBase()
  );
}
