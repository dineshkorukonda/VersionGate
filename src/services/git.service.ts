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

    await this.ensureProjectsRoot();

    const repoDir = this.projectPath(project);
    const isExisting = await this.isGitRepo(repoDir);

    if (
      project.repoUrl.includes("github.com/local/") &&
      project.localPath &&
      (await this.dirExists(project.localPath))
    ) {
      logger.info({ projectId: project.id, localPath: project.localPath }, "Preparing source from local adopted directory");
      await fs.mkdir(repoDir, { recursive: true });
      await this.copyLocalDirectory(project.localPath, repoDir);
    } else if (isExisting) {
      logger.debug({ projectId: project.id }, "Repo exists — fetching latest");
      await this.pullLatest(project, repoDir, branch);
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
      filter: (src) => !src.includes("node_modules") && !src.includes("dist"),
    });
  }

  private async ensureProjectsRoot(): Promise<void> {
    await fs.mkdir(config.projectsRootPath, { recursive: true });
  }

  private async cloneRepo(project: ProjectSelect, repoDir: string, branch: string): Promise<void> {
    const authUrl = this.buildAuthUrl(project.repoUrl);
    await fs.rm(repoDir, { recursive: true, force: true });
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

  private async pullLatest(project: ProjectSelect, repoDir: string, branch: string): Promise<void> {
    const authUrl = this.buildAuthUrl(project.repoUrl);
    try {
      await execFileAsync("git", ["-C", repoDir, "remote", "set-url", "origin", authUrl]).catch(() =>
        execFileAsync("git", ["-C", repoDir, "remote", "add", "origin", authUrl])
      );
      await execFileAsync("git", ["-C", repoDir, "fetch", "origin", branch]);
      await execFileAsync("git", ["-C", repoDir, "checkout", "-B", branch, `origin/${branch}`]);
      await execFileAsync("git", [
        "-C", repoDir,
        "reset", "--hard", `origin/${branch}`,
      ]);
      await execFileAsync("git", ["-C", repoDir, "clean", "-fdx"]).catch(() => {});
    } catch (err) {
      logger.warn({ projectId: project.id, err }, "Git pull failed, removing directory and cloning cleanly");
      await this.cloneRepo(project, repoDir, branch);
    }
  }

  private buildAuthUrl(repoUrl: string): string {
    const trimmed = repoUrl.trim();
    const sshMatch = /^git@github\.com:([^/]+)\/([^/]+?)(\.git)?$/i.exec(trimmed);
    if (sshMatch) {
      return `https://github.com/${sshMatch[1]}/${sshMatch[2]}.git`;
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      throw new DeploymentError(
        "Only HTTPS repository URLs are supported. SSH URLs are not allowed."
      );
    }
    return trimmed;
  }

  async getLatestCommit(project: Pick<ProjectSelect, "id"> & { localPath?: string | null }): Promise<{
    sha: string;
    message: string;
    author: string;
    date: string;
  } | null> {
    let repoDir = this.projectPath(project);
    if (!(await this.isGitRepo(repoDir)) && project.localPath && (await this.isGitRepo(project.localPath))) {
      repoDir = project.localPath;
    }
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
    project: Pick<ProjectSelect, "id"> & { localPath?: string | null },
    limit = 30
  ): Promise<Array<{
    sha: string;
    message: string;
    author: string;
    date: string;
  }>> {
    let repoDir = this.projectPath(project);
    if (!(await this.isGitRepo(repoDir)) && project.localPath && (await this.isGitRepo(project.localPath))) {
      repoDir = project.localPath;
    }
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
