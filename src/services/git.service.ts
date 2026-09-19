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

  async resolveEffectiveBuildContext(
    project: Pick<ProjectSelect, "id" | "name" | "buildContext"> & { localPath?: string | null }
  ): Promise<string> {
    const rawContext = this.buildContextPath(project);
    const repoRoot = path.resolve(this.projectPath(project));

    const rawSetting = (project.buildContext ?? ".").trim();
    if (rawSetting && rawSetting !== ".") {
      return rawContext;
    }

    const manifests = [
      "package.json",
      "Dockerfile",
      "dockerfile",
      "ecosystem.config.js",
      "ecosystem.config.cjs",
      "pm2.config.js",
      "pm2.config.cjs",
      "requirements.txt",
      "pyproject.toml",
      "Cargo.toml",
      "go.mod",
    ];

    const hasManifest = async (dir: string): Promise<boolean> => {
      for (const m of manifests) {
        if (await fs.access(path.join(dir, m)).then(() => true).catch(() => false)) {
          return true;
        }
      }
      return false;
    };

    // 1. If project has localPath from adoption, check if its folder name matches a directory in repo
    if (project.localPath) {
      const normalizedLocal = project.localPath.replace(/\\/g, "/").trim();
      const localBase = path.basename(normalizedLocal);
      const candidatesFromLocal = [
        path.resolve(repoRoot, localBase),
        path.resolve(repoRoot, "apps", localBase),
        path.resolve(repoRoot, "packages", localBase),
        path.resolve(repoRoot, "services", localBase),
      ];
      for (const cand of candidatesFromLocal) {
        if (cand.startsWith(repoRoot) && (await hasManifest(cand))) {
          logger.info({ projectId: project.id, cand }, "Resolved buildContext matching adopted localPath folder");
          return cand;
        }
      }
    }

    // 2. Compute candidate paths based on project name tokens
    const nameLower = project.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    const nameTokens = nameLower.split(/[-_]+/).filter(Boolean);

    const candidates = [
      nameLower,
      `apps/${nameLower}`,
      `packages/${nameLower}`,
      `services/${nameLower}`,
      `src/${nameLower}`,
    ];

    if (nameTokens.length > 1) {
      const subTokens = nameTokens.slice(1).join("-");
      candidates.push(
        subTokens,
        `apps/${subTokens}`,
        `packages/${subTokens}`,
        `services/${subTokens}`,
        `src/${subTokens}`
      );
      const lastToken = nameTokens[nameTokens.length - 1];
      candidates.push(
        lastToken,
        `apps/${lastToken}`,
        `packages/${lastToken}`,
        `services/${lastToken}`,
        `src/${lastToken}`
      );
    }

    for (const candidate of candidates) {
      const candidatePath = path.resolve(repoRoot, candidate);
      if (candidatePath.startsWith(repoRoot) && candidatePath !== repoRoot) {
        if (await hasManifest(candidatePath)) {
          logger.info(
            { projectId: project.id, projectName: project.name, detectedPath: candidate },
            "Resolved monorepo subfolder from project name"
          );
          return candidatePath;
        }
      }
    }

    // 3. Deep directory scan (up to depth 2-3) searching for folders with manifests matching tokens
    try {
      const scanDir = async (currentDir: string, currentDepth: number, maxDepth: number): Promise<string | null> => {
        if (currentDepth > maxDepth) return null;
        const entries = await fs.readdir(currentDir, { withFileTypes: true }).catch(() => []);
        for (const entry of entries) {
          if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist") {
            continue;
          }
          const subPath = path.join(currentDir, entry.name);
          if (await hasManifest(subPath)) {
            const entryNameLower = entry.name.toLowerCase();
            if (nameTokens.some((t) => t.length > 2 && (entryNameLower.includes(t) || t.includes(entryNameLower)))) {
              return subPath;
            }
          }
          if (["apps", "packages", "services", "projects", "modules", "src"].includes(entry.name) || currentDepth < maxDepth) {
            const nested = await scanDir(subPath, currentDepth + 1, maxDepth);
            if (nested) return nested;
          }
        }
        return null;
      };

      const matchedSubDir = await scanDir(repoRoot, 1, 2);
      if (matchedSubDir) {
        logger.info({ projectId: project.id, dir: path.relative(repoRoot, matchedSubDir) }, "Resolved matching subfolder from deep directory scan");
        return matchedSubDir;
      }
    } catch {
      // ignore
    }

    // 4. If no specific subfolder matches, check if root context has manifest
    if (await hasManifest(rawContext)) {
      return rawContext;
    }

    return rawContext;
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
      try {
        await this.pullLatest(project, repoDir, branch);
      } catch (err) {
        if (project.localPath && (await this.dirExists(project.localPath))) {
          logger.warn({ projectId: project.id, err }, "Git pull failed — falling back to syncing from local path");
          await this.copyLocalDirectory(project.localPath, repoDir);
        } else {
          throw err;
        }
      }
    } else {
      logger.debug({ projectId: project.id }, "Cloning repository");
      try {
        await this.cloneRepo(project, repoDir, branch);
      } catch (err) {
        if (project.localPath && (await this.dirExists(project.localPath))) {
          logger.warn({ projectId: project.id, err }, "Git clone failed — falling back to syncing from local path");
          await fs.mkdir(repoDir, { recursive: true });
          await this.copyLocalDirectory(project.localPath, repoDir);
        } else {
          throw err;
        }
      }
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
