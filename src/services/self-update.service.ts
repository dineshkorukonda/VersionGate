import { createHash, timingSafeEqual } from "crypto";
import { existsSync } from "fs";
import { join } from "path";
import { spawn } from "child_process";
import { execFileAsync } from "../utils/exec";
import { projectRoot } from "../utils/paths";
import { logger } from "../utils/logger";
import { runDrizzleSchemaSync } from "../utils/drizzle-schema-sync";

export interface SelfUpdateStatus {
  branch: string;
  isGitRepo: boolean;
  currentCommit: string;
  remoteCommit: string | null;
  behind: boolean;
  message?: string;
}

export interface SelfUpdateProgress {
  status: "idle" | "running" | "complete" | "failed";
  startedAt: string | null;
  finishedAt: string | null;
  currentStep: string | null;
  steps: string[];
  error?: string;
}

export interface SelfUpdateApplyResult {
  ok: boolean;
  started?: boolean;
  steps: string[];
  error?: string;
}

let updateProgress: SelfUpdateProgress = {
  status: "idle",
  startedAt: null,
  finishedAt: null,
  currentStep: null,
  steps: [],
};

/** Constant-time string compare (length-independent via SHA-256). */
export function selfUpdateTokensMatch(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

function ecosystemPath(): string {
  return join(projectRoot, "ecosystem.config.cjs");
}

function reloadPm2Processes(args: string[], env: NodeJS.ProcessEnv, label: string): void {
  const child = spawn("pm2", args, {
    cwd: projectRoot,
    detached: true,
    stdio: "ignore",
    env,
  });
  child.on("error", (err) => {
    logger.warn({ err, label }, "schedulePm2Reload: pm2 spawn failed");
  });
  child.unref();
}

function schedulePm2Reload(): void {
  const env = {
    ...process.env,
    PATH: ["/usr/local/bin", "/usr/bin", "/bin", process.env.PATH].filter(Boolean).join(":"),
  };
  let usedFallback = false;
  const tryProcessReload = (reason: string) => {
    if (usedFallback) return;
    usedFallback = true;
    logger.warn({ reason }, "schedulePm2Reload: trying process reload fallback");
    reloadPm2Processes(["reload", "versiongate-api", "versiongate-worker", "--update-env"], env, "process-reload");
  };

  const ecosystemChild = spawn("pm2", ["reload", ecosystemPath(), "--update-env"], {
    cwd: projectRoot,
    detached: true,
    stdio: "ignore",
    env,
  });
  ecosystemChild.on("error", (err) => {
    logger.warn({ err }, "schedulePm2Reload: ecosystem reload spawn failed");
    tryProcessReload("spawn-error");
  });
  ecosystemChild.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      tryProcessReload(`exit-${code}`);
    }
  });
  ecosystemChild.unref();
}

/**
 * Compare local HEAD to origin/{branch} after `git fetch origin {branch}`.
 */
export async function getSelfUpdateStatus(branch: string): Promise<SelfUpdateStatus> {
  const gitDir = join(projectRoot, ".git");
  if (!existsSync(gitDir)) {
    return {
      branch,
      isGitRepo: false,
      currentCommit: "",
      remoteCommit: null,
      behind: false,
      message: "This install is not a git clone — use your package or image pipeline to update.",
    };
  }

  try {
    const headOut = await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: projectRoot });
    const head = headOut.stdout.trim();
    await execFileAsync("git", ["fetch", "origin", branch], { cwd: projectRoot });
    const remoteOut = await execFileAsync("git", ["rev-parse", `origin/${branch}`], { cwd: projectRoot });
    const remote = remoteOut.stdout.trim();
    const behind = head !== remote;

    // If local commit is behind origin/branch and we are not actively running an update,
    // clear any stale "complete" status so clients see an update is pending.
    if (behind && updateProgress.status === "complete") {
      updateProgress = {
        status: "idle",
        startedAt: null,
        finishedAt: null,
        currentStep: null,
        steps: [],
      };
    }

    return {
      branch,
      isGitRepo: true,
      currentCommit: head,
      remoteCommit: remote,
      behind,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.warn({ err: msg, branch }, "Self-update: status check failed");
    return {
      branch,
      isGitRepo: true,
      currentCommit: "",
      remoteCommit: null,
      behind: false,
      message: msg,
    };
  }
}

export function getSelfUpdateProgress(): SelfUpdateProgress {
  return updateProgress;
}

export function resetSelfUpdateProgress(): void {
  if (updateProgress.status !== "running") {
    updateProgress = {
      status: "idle",
      startedAt: null,
      finishedAt: null,
      currentStep: null,
      steps: [],
    };
  }
}

async function runUpdatePipeline(branch: string): Promise<void> {
  const appendStep = (stepText: string) => {
    updateProgress.currentStep = stepText;
    updateProgress.steps.push(stepText);
    logger.info({ step: stepText, branch }, "Self-update step");
  };

  try {
    appendStep(`[ 1/5 ] Fetching origin ${branch}...`);
    await execFileAsync("git", ["fetch", "origin", branch], { cwd: projectRoot });

    appendStep(`[ 2/5 ] Syncing code with origin/${branch}...`);
    try {
      await execFileAsync("git", ["merge", "--ff-only", `origin/${branch}`], { cwd: projectRoot });
    } catch {
      appendStep(`[ WARN ] Fast-forward merge prevented by local modifications. Resetting working tree to origin/${branch}...`);
      await execFileAsync("git", ["reset", "--hard", `origin/${branch}`], { cwd: projectRoot });
    }

    appendStep("[ 3/5 ] Installing root & dashboard dependencies via Bun...");
    await execFileAsync("bun", ["install"], { cwd: projectRoot });
    await execFileAsync("bun", ["install"], { cwd: join(projectRoot, "dashboard") });

    appendStep("[ 4/5 ] Synchronizing database schema...");
    if (process.env.DATABASE_URL?.trim()) {
      try {
        runDrizzleSchemaSync();
        appendStep("[ OK ] Drizzle schema synchronized");
      } catch (syncErr: unknown) {
        const syncMsg = syncErr instanceof Error ? syncErr.message : String(syncErr);
        appendStep(`[ WARN ] Schema sync completed with warning: ${syncMsg}`);
      }
    } else {
      appendStep("[ SKIP ] Database schema sync skipped (no DATABASE_URL)");
    }

    appendStep("[ 5/5 ] Building dashboard static assets...");
    await execFileAsync("bun", ["run", "build:dashboard"], { cwd: projectRoot });

    let isPm2Running = false;
    try {
      const pm2Check = await execFileAsync("pm2", ["list"], { cwd: projectRoot });
      isPm2Running = pm2Check.stdout.includes("versiongate") || pm2Check.stdout.includes("online");
    } catch {
      isPm2Running = false;
    }

    if (isPm2Running) {
      appendStep("[ PM2 ] Scheduling zero-downtime graceful worker reload...");
      schedulePm2Reload();
    } else {
      appendStep("[ STANDALONE ] Assets built in-place, zero downtime live");
    }

    updateProgress.status = "complete";
    updateProgress.finishedAt = new Date().toISOString();
    updateProgress.currentStep = "Update completed successfully";
    appendStep("[ READY ] System update successfully applied");
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    updateProgress.status = "failed";
    updateProgress.finishedAt = new Date().toISOString();
    updateProgress.error = errMsg;
    updateProgress.currentStep = "Update failed";
    updateProgress.steps.push(`[ FAIL ] Error: ${errMsg}`);
    logger.error({ err: errMsg, branch }, "Self-update background pipeline failed");
  }
}

/**
 * Starts an asynchronous, non-blocking self-update task in the background.
 */
export async function startAsyncSelfUpdate(branch: string): Promise<{ ok: boolean; started: boolean; error?: string }> {
  const gitDir = join(projectRoot, ".git");
  if (!existsSync(gitDir)) {
    return { ok: false, started: false, error: "Not a git repository" };
  }

  if (updateProgress.status === "running") {
    return { ok: true, started: false, error: "Update is already in progress" };
  }

  updateProgress = {
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    currentStep: "Starting update...",
    steps: ["[ INIT ] Initialized asynchronous update pipeline"],
  };

  // Launch background execution
  void runUpdatePipeline(branch);
  return { ok: true, started: true };
}

/**
 * Backwards-compatible applySelfUpdate: triggers non-blocking pipeline and reports initial state.
 */
export async function applySelfUpdate(branch: string): Promise<SelfUpdateApplyResult> {
  const res = await startAsyncSelfUpdate(branch);
  if (!res.ok) {
    return { ok: false, steps: [], error: res.error };
  }
  return { ok: true, started: res.started, steps: updateProgress.steps };
}
