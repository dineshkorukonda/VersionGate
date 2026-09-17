import fs from "fs/promises";
import path from "path";
import { ProjectSelect } from "../db/schema";
import { execFileAsync } from "../utils/exec";
import { config } from "../config/env";
import { logger } from "../utils/logger";
import { DeploymentError } from "../utils/errors";

export class GitService {
  projectPath(project: Pick<ProjectSelect, "id">): string {
    return path.join(config.projectsRootPath, project.id);
  }

  buildContextPath(project: Pick<ProjectSelect, "id" | "buildContext">): string {
    const repoRoot = path.resolve(path.join(config.projectsRootPath, project.id));
    const raw = (project.buildContext ?? ".").trim() || ".";

    if (path.isAbsolute(raw)) {
      throw new DeploymentError("buildContext must be a relative path (e.g. . or apps/api).");
    }

    const resolved = path.resolve(repoRoot, raw);
    const relativeToRepo = path.relative(repoRoot, resolved);
    if (relativeToRepo.startsWith("..") || path.isAbsolute(relativeToRepo)) {
      throw new DeploymentError("buildContext must stay inside the project repository directory.");
    }

    return resolved;
  }

  async prepareSource(project: ProjectSelect, branchOverride?: string): Promise<void> {
    const branch = (branchOverride ?? project.branch).trim() || project.branch;
    logger.debug({ projectId: project.id, branch }, "Preparing source");

    await this.ensureProjectDirectory(project);

    const repoDir = this.projectPath(project);
    const isExisting = await this.isGitRepo(repoDir);

    if (isExisting) {
      logger.debug({ projectId: project.id }, "Repo exists — fetching latest");
      await this.pullLatest(project, repoDir, branch);
    } else if (
      project.repoUrl.includes("github.com/local/") &&
      project.localPath &&
      (await this.dirExists(project.localPath))
    ) {
      logger.info({ projectId: project.id, localPath: project.localPath }, "Preparing source from local adopted directory");
      await this.copyLocalDirectory(project.localPath, repoDir);
    } else {
      logger.debug({ projectId: project.id }, "Cloning repository");
      await this.cloneRepo(project, repoDir, branch);
    }

    logger.info({ projectId: project.id, branch }, "Source ready");
  }

  private async dirExists(dir: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dir);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  private async copyLocalDirectory(source: string, destination: string): Promise<void> {
    await fs.cp(source, destination, {
      recursive: true,
      filter: (src) => !src.includes("node_modules") && !src.includes(".git") && !src.includes("dist"),
    });
  }

  private async ensureProjectDirectory(project: Pick<ProjectSelect, "id">): Promise<void> {
    const dir = path.join(config.projectsRootPath, project.id);
    await fs.mkdir(dir, { recursive: true });
  }

  private async cloneRepo(project: ProjectSelect, repoDir: string, branch: string): Promise<void> {
    const authUrl = this.buildAuthUrl(project.repoUrl);
    try {
      await execFileAsync("git", [
        "clone",
        "--branch", branch,
        authUrl,
        repoDir,
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new DeploymentError(`Git clone failed: ${message}`);
    }
  }

  private async pullLatest(_project: ProjectSelect, repoDir: string, branch: string): Promise<void> {
    try {
      await execFileAsync("git", ["-C", repoDir, "fetch", "origin", branch]);
      await execFileAsync("git", ["-C", repoDir, "checkout", "-B", branch, `origin/${branch}`]);
      await execFileAsync("git", [
        "-C", repoDir,
        "reset", "--hard", `origin/${branch}`,
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new DeploymentError(`Git pull failed: ${message}`);
    }
  }

  private buildAuthUrl(repoUrl: string): string {
    if (!/^https?:\/\//i.test(repoUrl)) {
      throw new DeploymentError(
        "Only HTTPS repository URLs are supported. SSH URLs are not allowed."
      );
    }
    return repoUrl;
  }

  async getLatestCommit(project: Pick<ProjectSelect, "id">): Promise<{
    sha: string;
    message: string;
    author: string;
    date: string;
  } | null> {
    const repoDir = this.projectPath(project);
    try {
      const { stdout } = await execFileAsync("git", [
        "-C", repoDir,
        "log", "-1",
        "--format=%H%x00%s%x00%an%x00%aI",
      ]);
      const [sha, message, author, date] = stdout.trim().split("\0");
      if (!sha) return null;
      return { sha, message: message || "", author: author || "", date: date || "" };
    } catch {
      return null;
    }
  }

  async listRecentCommits(
    project: Pick<ProjectSelect, "id">,
    limit = 30
  ): Promise<Array<{
    sha: string;
    message: string;
    author: string;
    date: string;
  }>> {
    const repoDir = this.projectPath(project);
    try {
      const { stdout } = await execFileAsync("git", [
        "-C", repoDir,
        "log", `-${limit}`,
        "--format=%H%x00%s%x00%an%x00%aI",
      ]);
      const lines = stdout.split("\n").filter(Boolean);
      const list: Array<{ sha: string; message: string; author: string; date: string }> = [];
      for (const line of lines) {
        const [sha, message, author, date] = line.split("\0");
        if (sha) {
          list.push({ sha, message: message || "", author: author || "", date: date || "" });
        }
      }
      return list;
    } catch {
      return [];
    }
  }

  private async isGitRepo(dir: string): Promise<boolean> {
    try {
      await fs.access(path.join(dir, ".git"));
      return true;
    } catch {
      return false;
    }
  }
}
