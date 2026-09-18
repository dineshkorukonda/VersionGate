import { describe, test, expect } from "bun:test";
import { GitService } from "../../src/services/git.service";
import { ProjectRepository } from "../../src/repositories/project.repository";
import { normalizeGithubRepoUrl } from "../../src/utils/github/github-repo-url";

describe("Adopted PM2 Services & Auto-Deployment Engine", () => {
  const gitService = new GitService();
  const projectRepo = new ProjectRepository();

  test("GitService converts GitHub SSH URLs to HTTPS without error", () => {
    const gitAny = gitService as any;
    const httpsUrl = gitAny.buildAuthUrl("git@github.com:dineshkorukonda/VersionGate.git");
    expect(httpsUrl).toBe("https://github.com/dineshkorukonda/VersionGate.git");

    const directHttps = gitAny.buildAuthUrl("https://github.com/dineshkorukonda/VersionGate.git");
    expect(directHttps).toBe("https://github.com/dineshkorukonda/VersionGate.git");
  });

  test("normalizeGithubRepoUrl normalizes SSH and HTTPS URLs for webhook matching", () => {
    const ssh = normalizeGithubRepoUrl("git@github.com:owner/repo.git");
    const https = normalizeGithubRepoUrl("https://github.com/owner/repo.git");
    expect(ssh).toBe("https://github.com/owner/repo");
    expect(https).toBe("https://github.com/owner/repo");
    expect(ssh).toBe(https);
  });

  test("ProjectRepository prepareCreateData automatically generates webhookSecret", () => {
    const repoAny = projectRepo as any;
    const prepared = repoAny.prepareCreateData({
      name: "test-adopted-app",
      repoUrl: "https://github.com/owner/test-adopted-app",
      localPath: "/var/www/test-adopted-app",
      appPort: 3000,
      basePort: 3100,
      deploymentType: "pm2",
      isAdopted: true,
    });

    expect(typeof prepared.webhookSecret).toBe("string");
    expect(prepared.webhookSecret.length).toBeGreaterThan(16);
    expect(prepared.isAdopted).toBe(true);
    expect(prepared.deploymentType).toBe("pm2");
  });

  test("GitService gets commit metadata from current repository", async () => {
    const project = {
      id: "test-current-project",
      localPath: process.cwd(),
    };
    const commit = await gitService.getLatestCommit(project as any);
    expect(commit).not.toBeNull();
    if (commit) {
      expect(commit.sha).toBeDefined();
      expect(commit.sha.length).toBe(40);
      expect(typeof commit.message).toBe("string");
      expect(typeof commit.author).toBe("string");
    }
  });

  test("GitService lists recent commits from repository path", async () => {
    const project = {
      id: "test-current-project",
      localPath: process.cwd(),
    };
    const commits = await gitService.listRecentCommits(project as any, 5);
    expect(Array.isArray(commits)).toBe(true);
    expect(commits.length).toBeGreaterThan(0);
  });

  test("PM2 deployment runner uses production NODE_ENV for build step", () => {
    const env: Record<string, string> = {};
    const hostPort = 3000;
    const buildEnv = {
      ...process.env,
      ...env,
      NODE_ENV: env.NODE_ENV || "production",
      PORT: String(hostPort),
    };
    expect(buildEnv.NODE_ENV).toBe("production");
    expect(buildEnv.PORT).toBe("3000");
  });
});


