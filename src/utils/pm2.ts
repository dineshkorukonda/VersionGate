import { execFile } from "child_process";
import { promisify } from "util";
import { logger } from "./logger";

const execFileAsync = promisify(execFile);

export interface Pm2StartOptions {
  name: string;
  cwd: string;
  script: string;
  args?: string[];
  port: number;
  env?: Record<string, string>;
}

export interface Pm2ProcessInfo {
  name: string;
  pm_id: number;
  pid: number;
  status: "online" | "stopping" | "stopped" | "launching" | "errored" | "one-launch-status";
  memory: number;
  cpu: number;
  uptime: number;
}

const PM2_HOME_CANDIDATES: (string | undefined)[] = [
  undefined,
  process.env.PM2_HOME,
  "/root/.pm2",
  "/home/ubuntu/.pm2",
  "/home/admin/.pm2",
  "/home/debian/.pm2",
];

async function execPm2(args: string[], options?: { cwd?: string; env?: NodeJS.ProcessEnv }): Promise<{ stdout: string; stderr: string }> {
  let lastError: any;
  for (const home of PM2_HOME_CANDIDATES) {
    try {
      const mergedEnv = {
        ...process.env,
        ...(options?.env || {}),
        ...(home ? { PM2_HOME: home } : {}),
      };
      return await execFileAsync("pm2", args, {
        cwd: options?.cwd,
        env: mergedEnv,
      });
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

/**
 * Checks if the PM2 CLI binary is accessible on the host machine.
 */
export async function isPm2Available(): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync("pm2", ["-v"]);
    return Boolean(stdout && stdout.trim().length > 0);
  } catch {
    return false;
  }
}

/**
 * Returns JSON list of all PM2 managed processes on the host across all user environments.
 */
export async function listPm2Processes(): Promise<Pm2ProcessInfo[]> {
  const seenKeys = new Set<string>();
  const results: Pm2ProcessInfo[] = [];

  for (const home of PM2_HOME_CANDIDATES) {
    try {
      const execOptions = home ? { env: { ...process.env, PM2_HOME: home } } : undefined;
      const { stdout } = await execFileAsync("pm2", ["jlist"], execOptions);
      const raw = JSON.parse(String(stdout || "[]"));
      if (!Array.isArray(raw)) continue;
      for (const item of raw) {
        const name = String(item.name || "");
        const pm_id = Number(item.pm_id ?? -1);
        const pid = Number(item.pid ?? 0);
        const uniqueKey = `${name}-${pm_id}-${pid}`;
        if (seenKeys.has(uniqueKey)) continue;
        seenKeys.add(uniqueKey);

        results.push({
          name,
          pm_id,
          pid,
          status: (item.pm2_env?.status ?? "stopped") as Pm2ProcessInfo["status"],
          memory: Number(item.monit?.memory ?? 0),
          cpu: Number(item.monit?.cpu ?? 0),
          uptime: Number(item.pm2_env?.pm_uptime ?? 0),
        });
      }
    } catch {
      // ignore
    }
  }
  return results;
}

/**
 * Inspects a specific PM2 process by name.
 */
export async function getPm2Process(name: string): Promise<Pm2ProcessInfo | null> {
  const processes = await listPm2Processes();
  return processes.find((p) => p.name === name) ?? null;
}

/**
 * Checks if a specific PM2 process is actively running with "online" status.
 */
export async function isPm2Running(name: string): Promise<boolean> {
  const info = await getPm2Process(name);
  return info !== null && info.status === "online";
}

/**
 * Starts or reloads an application under PM2 supervision.
 * Automatically injects PORT, NODE_ENV, enhanced PATH, and customer environment variables.
 */
export async function startPm2App(options: Pm2StartOptions): Promise<void> {
  const { name, cwd, script, args = [], port, env = {} } = options;

  // Verify PM2 is installed
  const available = await isPm2Available();
  if (!available) {
    throw new Error(
      "PM2 is not installed or not in PATH on this server. Install it globally with 'npm install -g pm2' or 'bun add -g pm2' to enable Host PM2 deployments."
    );
  }

  // Delete any existing PM2 process with the same name before starting cleanly
  await deletePm2App(name).catch(() => null);

  const pathModule = await import("path");
  const nodeBinPath = pathModule.join(cwd, "node_modules", ".bin");
  const currentPath = process.env.PATH || "";
  const enhancedPath = currentPath.includes(nodeBinPath)
    ? currentPath
    : `${nodeBinPath}${pathModule.delimiter}${currentPath}`;

  const mergedEnv: NodeJS.ProcessEnv = {
    ...process.env,
    ...env,
    PORT: String(port),
    NODE_ENV: env.NODE_ENV || "production",
    PATH: enhancedPath,
  };

  const pm2Args: string[] = [
    "start",
    script,
    "--name",
    name,
    "--cwd",
    cwd,
    "--update-env",
  ];

  if (args.length > 0) {
    pm2Args.push("--", ...args);
  }

  logger.info({ name, cwd, script, port }, "Starting application via PM2");

  try {
    await execPm2(pm2Args, {
      cwd,
      env: mergedEnv,
    });
    logger.info({ name, port }, "Application started via PM2");
  } catch (err: any) {
    const stderr = err?.stderr?.toString() || err?.message || String(err);
    logger.error({ name, stderr }, "Failed to start PM2 application");
    throw new Error(`PM2 start failed for "${name}": ${stderr}`);
  }
}

/**
 * Stops an application managed by PM2.
 */
export async function stopPm2App(name: string): Promise<void> {
  try {
    await execPm2(["stop", name]);
    logger.info({ name }, "Stopped PM2 application");
  } catch (err: any) {
    logger.debug({ name, err: err?.message }, "PM2 stop encountered an error (process may already be stopped)");
  }
}

/**
 * Deletes an application from PM2 process list.
 */
export async function deletePm2App(name: string): Promise<void> {
  try {
    await execPm2(["delete", name]);
    logger.info({ name }, "Deleted PM2 application");
  } catch (err: any) {
    logger.debug({ name, err: err?.message }, "PM2 delete encountered an error (process may not exist)");
  }
}

/**
 * Restarts an application managed by PM2.
 */
export async function restartPm2App(name: string, port?: number, env?: Record<string, string>): Promise<void> {
  const mergedEnv: NodeJS.ProcessEnv = {
    ...process.env,
    ...(env || {}),
    ...(port ? { PORT: String(port) } : {}),
  };

  try {
    await execPm2(["restart", name, "--update-env"], {
      env: mergedEnv,
    });
    logger.info({ name, port }, "Restarted PM2 application");
  } catch (err: any) {
    const stderr = err?.stderr?.toString() || err?.message || String(err);
    logger.error({ name, stderr }, "Failed to restart PM2 application");
    throw new Error(`PM2 restart failed for "${name}": ${stderr}`);
  }
}

/**
 * Retrieves the most recent log lines from PM2 for a specific application.
 */
export async function getPm2Logs(name: string, lines = 40): Promise<string> {
  for (const home of PM2_HOME_CANDIDATES) {
    try {
      const execOptions = home ? { env: { ...process.env, PM2_HOME: home } } : undefined;
      const { stdout, stderr } = await execFileAsync("pm2", [
        "logs",
        name,
        "--lines",
        String(lines),
        "--nostream",
      ], execOptions);
      const res = String(stdout || stderr || "").trim();
      if (res && !res.includes("No log available")) return res;
    } catch {
      // try next home
    }
  }
  return "";
}

export interface Pm2DeployOptions {
  project: {
    name: string;
    packageManager?: string | null;
    installCommand?: string | null;
    buildCommand?: string | null;
    startCommand?: string | null;
  };
  buildContextPath: string;
  containerName: string;
  hostPort: number;
  env?: Record<string, string>;
  log?: (line: string) => void | Promise<void>;
}

/**
 * Installs dependencies, runs build step, and registers/starts application under PM2 supervision.
 */
export async function buildAndStartPm2Deployment(options: Pm2DeployOptions): Promise<void> {
  const { project, buildContextPath, containerName, hostPort, env = {}, log } = options;

  const available = await isPm2Available();
  if (!available) {
    throw new Error(
      "PM2 is not installed or not in PATH on this server. Install it globally with 'npm install -g pm2' or 'bun add -g pm2' to enable Host PM2 deployments."
    );
  }

  // 1. Determine package manager
  let pm = (project.packageManager || "auto").toLowerCase();
  if (pm === "auto") {
    const fs = await import("fs/promises");
    const path = await import("path");
    const hasBun =
      (await fs.access(path.join(buildContextPath, "bun.lockb")).then(() => true).catch(() => false)) ||
      (await fs.access(path.join(buildContextPath, "bun.lock")).then(() => true).catch(() => false));
    const hasPnpm = await fs.access(path.join(buildContextPath, "pnpm-lock.yaml")).then(() => true).catch(() => false);
    const hasYarn = await fs.access(path.join(buildContextPath, "yarn.lock")).then(() => true).catch(() => false);
    if (hasBun) pm = "bun";
    else if (hasPnpm) pm = "pnpm";
    else if (hasYarn) pm = "yarn";
    else pm = "npm";
  }

  // 2. Install dependencies
  let installCmd = project.installCommand?.trim();
  if (!installCmd) {
    if (pm === "bun") installCmd = "bun install";
    else if (pm === "pnpm") installCmd = "pnpm install";
    else if (pm === "yarn") installCmd = "yarn install";
    else installCmd = "npm install --include=dev";
  }

  const pathModule = await import("path");
  const nodeBinPath = pathModule.join(buildContextPath, "node_modules", ".bin");
  const currentPath = process.env.PATH || "";
  const enhancedPath = currentPath.includes(nodeBinPath)
    ? currentPath
    : `${nodeBinPath}${pathModule.delimiter}${currentPath}`;

  const buildEnv: NodeJS.ProcessEnv = {
    ...process.env,
    ...env,
    NODE_ENV: "development",
    PATH: enhancedPath,
  };

  if (log) await log(`[PM2] Installing dependencies via: ${installCmd}`);
  logger.info({ buildContextPath, installCmd }, "PM2: Installing dependencies");
  const { execAsync } = await import("./exec");
  await execAsync(installCmd, { cwd: buildContextPath, env: buildEnv });

  // 3. Build step (if specified or if scripts.build exists)
  let buildCmd = project.buildCommand?.trim();
  if (!buildCmd) {
    try {
      const fs = await import("fs/promises");
      const pkgPath = pathModule.join(buildContextPath, "package.json");
      const rawPkg = await fs.readFile(pkgPath, "utf-8");
      const pkg = JSON.parse(rawPkg);
      if (pkg.scripts?.build) {
        buildCmd = pm === "bun" ? "bun run build" : `${pm} run build`;
      }
    } catch {
      // no package.json or invalid
    }
  }

  if (buildCmd) {
    if (log) await log(`[PM2] Running build command: ${buildCmd}`);
    logger.info({ buildContextPath, buildCmd }, "PM2: Running build");
    await execAsync(buildCmd, { cwd: buildContextPath, env: buildEnv });
  }

  // 4. Start via PM2
  let startScript = project.startCommand?.trim();
  let startArgs: string[] = [];

  if (!startScript) {
    const fs = await import("fs/promises");

    // Check for ecosystem file first
    const ecosystemFiles = [
      "ecosystem.config.js",
      "ecosystem.config.cjs",
      "pm2.config.js",
      "pm2.config.cjs",
      "ecosystem.json",
    ];
    let foundEcosystem: string | undefined;
    for (const eco of ecosystemFiles) {
      if (await fs.access(pathModule.join(buildContextPath, eco)).then(() => true).catch(() => false)) {
        foundEcosystem = eco;
        break;
      }
    }

    if (foundEcosystem) {
      startScript = foundEcosystem;
      startArgs = [];
    } else {
      let hasStartScript = false;
      let pkgMain: string | undefined;
      try {
        const pkgContent = await fs.readFile(pathModule.join(buildContextPath, "package.json"), "utf-8");
        const pkg = JSON.parse(pkgContent);
        hasStartScript = Boolean(pkg.scripts?.start);
        pkgMain = pkg.main;
      } catch {
        // ignore
      }

      if (hasStartScript) {
        if (pm === "bun") {
          startScript = "bun";
          startArgs = ["run", "start"];
        } else if (pm === "pnpm") {
          startScript = "pnpm";
          startArgs = ["start"];
        } else if (pm === "yarn") {
          startScript = "yarn";
          startArgs = ["start"];
        } else {
          startScript = "npm";
          startArgs = ["start"];
        }
      } else if (pkgMain && (await fs.access(pathModule.join(buildContextPath, pkgMain)).then(() => true).catch(() => false))) {
        startScript = pkgMain;
      } else if (await fs.access(pathModule.join(buildContextPath, "dist/index.js")).then(() => true).catch(() => false)) {
        startScript = "dist/index.js";
      } else if (await fs.access(pathModule.join(buildContextPath, "dist/server.js")).then(() => true).catch(() => false)) {
        startScript = "dist/server.js";
      } else if (await fs.access(pathModule.join(buildContextPath, "dist/main.js")).then(() => true).catch(() => false)) {
        startScript = "dist/main.js";
      } else if (await fs.access(pathModule.join(buildContextPath, "server.js")).then(() => true).catch(() => false)) {
        startScript = "server.js";
      } else if (await fs.access(pathModule.join(buildContextPath, "index.js")).then(() => true).catch(() => false)) {
        startScript = "index.js";
      } else if (await fs.access(pathModule.join(buildContextPath, "app.js")).then(() => true).catch(() => false)) {
        startScript = "app.js";
      } else {
        startScript = pm === "bun" ? "bun" : "npm";
        startArgs = pm === "bun" ? ["run", "start"] : ["start"];
      }
    }
  } else {
    // If start command is specified like "node dist/index.js", extract script path
    const trimmed = startScript.trim();
    if (trimmed.startsWith("node ") && trimmed.length > 5) {
      const rest = trimmed.slice(5).trim();
      const parts = rest.split(/\s+/);
      startScript = parts[0];
      startArgs = parts.slice(1);
    } else {
      const parts = trimmed.split(/\s+/);
      startScript = parts[0];
      startArgs = parts.slice(1);
    }
  }

  if (log) await log(`[PM2] Launching process "${containerName}" on port ${hostPort} (script: ${startScript}${startArgs.length > 0 ? " " + startArgs.join(" ") : ""})`);
  await startPm2App({
    name: containerName,
    cwd: buildContextPath,
    script: startScript,
    args: startArgs,
    port: hostPort,
    env,
  });
}
