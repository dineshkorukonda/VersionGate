import { config } from "../config/env";
import { decryptProjectEnv } from "../utils/env";
import { DeploymentRepository } from "../repositories/deployment.repository";
import { EnvironmentRepository, DEFAULT_ENVIRONMENT_NAME } from "../repositories/environment.repository";
import { ProjectRepository } from "../repositories/project.repository";
import { DeploymentSelect, EnvironmentSelect, ProjectSelect } from "../db/schema";
import { buildImage, runContainer, stopContainer, removeContainer, freeHostPort } from "../utils/docker";
import { ensureDockerfile } from "../utils/dockerfile";
import { buildAndStartPm2Deployment, stopPm2App } from "../utils/pm2";
import { DeploymentError } from "../utils/errors";
import { logger } from "../utils/logger";
import { detectHealthPathFromDir } from "../utils/health-detector";
import { TrafficService } from "./traffic.service";
import { GitService } from "./git.service";
import { ValidationService } from "./validation.service";
import { syncCustomDomainUpstream } from "./project-domain.service";

const repo = new DeploymentRepository();
const envRepo = new EnvironmentRepository();
const projectRepo = new ProjectRepository();
const traffic = new TrafficService();
const git = new GitService();
const validation = new ValidationService();

export type DeployPipelineLogFn = (line: string) => void | Promise<void>;

export interface RunDeployPipelineInput {
  project: ProjectSelect;
  environment: EnvironmentSelect;
  log: DeployPipelineLogFn;
  checkCancelled?: (deploymentId?: string) => Promise<void>;
  onDeploymentCreated?: (deploymentId: string) => void | Promise<void>;
}

export interface DeployPipelineResult {
  deployment: DeploymentSelect;
  message: string;
}

export async function runDeployPipeline(
  input: RunDeployPipelineInput
): Promise<DeployPipelineResult> {
  const { project, environment, log, checkCancelled, onDeploymentCreated } = input;
  const projectId = project.id;
  const environmentId = environment.id;

  await log(
    `Starting deployment pipeline for project ${project.name} (${projectId}), env ${environment.name} (${environmentId})`
  );

  await log(`Step 1: Preparing source code (branch ${environment.branch})`);
  await git.prepareSource(project, environment.branch);
  const latestCommit = await git.getLatestCommit(project);
  if (latestCommit) {
    await log(`Commit: ${latestCommit.sha.slice(0, 7)} — "${latestCommit.message}" by ${latestCommit.author}`);
  }
  await checkCancelled?.();

  const repoRoot = git.projectPath(project);
  let buildContextPath = await git.resolveEffectiveBuildContext(project);
  if (buildContextPath !== repoRoot) {
    await log(`Monorepo context resolved: ${buildContextPath.replace(repoRoot, "").replace(/^[/\\]/, "")}`);
  }
  if (project.deploymentType !== "pm2") {
    buildContextPath = await ensureDockerfile(
      buildContextPath,
      environment.appPort,
      repoRoot,
      {
        packageManager: project.packageManager,
        installCommand: project.installCommand,
        buildCommand: project.buildCommand,
        startCommand: project.startCommand,
      }
    );
  }

  await log(`Step 2: Determining blue/green target`);
  const activeDeployment = await repo.findActiveForEnvironment(environmentId);
  const newColor = activeDeployment?.color === "BLUE" ? "GREEN" : "BLUE";
  const hostPort = newColor === "BLUE" ? environment.basePort : environment.basePort + 1;
  const containerName = `${project.name}-${environment.name}-${newColor.toLowerCase()}`;
  const imageTag = `versiongate-${project.name}:${Date.now()}`;
  const version = await repo.getNextVersionForEnvironment(environmentId);

  await log(
    `Target: color=${newColor}, hostPort=${hostPort}, container=${containerName}, image=${imageTag}, version=${version}`
  );

  await log(`Step 3: Creating DEPLOYING deployment record`);
  const deployment = await repo.create({
    version,
    imageTag,
    containerName,
    port: hostPort,
    color: newColor,
    status: "DEPLOYING",
    environment: { connect: { id: environmentId } },
    commitSha: latestCommit?.sha ?? null,
    commitMessage: latestCommit?.message ?? null,
    commitAuthor: latestCommit?.author ?? null,
    commitBranch: environment.branch,
  });
  await onDeploymentCreated?.(deployment.id);

  const projectEnv = decryptProjectEnv(project.env);
  const stageEnv = decryptProjectEnv((environment as typeof environment & { env?: unknown }).env);
  const mergedEnv = { ...projectEnv, ...stageEnv };
  const envKeys = Object.keys(mergedEnv);
  if (envKeys.length > 0) {
    await log(`Injecting env keys: ${envKeys.join(", ")}`);
  }

  if (project.deploymentType === "pm2") {
    await log(`Step 4: Deploying host application via PM2`);
    await freeHostPort(hostPort);
    await buildAndStartPm2Deployment({
      project,
      buildContextPath,
      containerName,
      hostPort,
      env: mergedEnv,
      log,
    });
    await checkCancelled?.(deployment.id);
  } else {
    await log(`Step 4: Building Docker image`);
    await buildImage(imageTag, buildContextPath);
    await checkCancelled?.(deployment.id);

    await log(`Step 5: Starting container`);
    await stopContainer(containerName).catch(() => null);
    await removeContainer(containerName).catch(() => null);
    await freeHostPort(hostPort);
    await runContainer(
      containerName,
      imageTag,
      hostPort,
      environment.appPort,
      config.dockerNetwork,
      mergedEnv
    );
    await checkCancelled?.(deployment.id);
  }

  let activeHealthPath = project.healthPath;
  try {
    const preDetected = await detectHealthPathFromDir(buildContextPath);
    if (preDetected && preDetected !== activeHealthPath && (activeHealthPath === "/health" || !activeHealthPath)) {
      await log(`[HealthCheck] Pre-flight detected route from codebase: ${preDetected}`);
      activeHealthPath = preDetected;
    }
  } catch {
    // ignore
  }

  await log(`Step 6: Health check http://localhost:${hostPort}${activeHealthPath}`);
  const fallbackPorts = project.deploymentType === "pm2" && project.appPort && project.appPort !== hostPort
    ? [project.appPort]
    : undefined;

  const health = await validation.validate(
    `http://localhost:${hostPort}`,
    activeHealthPath,
    containerName,
    log,
    fallbackPorts
  );
  if (!health.success) {
    throw new DeploymentError(health.error ?? "Health check failed");
  }
  if (health.detectedHealthPath && health.detectedHealthPath !== project.healthPath) {
    await log(`[HealthCheck] Auto-detected active health endpoint: ${health.detectedHealthPath} (updated from ${project.healthPath})`);
    await projectRepo.update(project.id, { healthPath: health.detectedHealthPath }).catch((err) => {
      logger.warn({ err, projectId: project.id }, "Failed to auto-update project health path in database");
    });
  }
  await checkCancelled?.(deployment.id);

  const switchPublicTraffic = environment.name === DEFAULT_ENVIRONMENT_NAME;
  if (switchPublicTraffic) {
    await log(`Step 7: Switching traffic to port ${hostPort}`);
    await traffic.switchTrafficTo(hostPort, {
      projectName: project.name,
      environmentName: environment.name,
    });
    await syncCustomDomainUpstream(project.name, hostPort);
  } else {
    await log(`Step 7: Skipping traffic switch (non-production environment)`);
  }

  await log(`Step 8: Activating deployment and retiring previous slot`);
  await repo.updateStatus(deployment.id, "ACTIVE");

  if (activeDeployment) {
    if (project.deploymentType === "pm2") {
      await log(`Stopping old PM2 instance: ${activeDeployment.containerName}`);
      await stopPm2App(activeDeployment.containerName).catch(async (err) => {
        await log(`Warning: failed to stop old PM2 instance: ${err instanceof Error ? err.message : String(err)}`);
      });
    } else {
      await log(`Stopping old container: ${activeDeployment.containerName}`);
      await stopContainer(activeDeployment.containerName).catch(async (err) => {
        await log(`Warning: failed to stop old container: ${err instanceof Error ? err.message : String(err)}`);
      });
      await removeContainer(activeDeployment.containerName).catch(async (err) => {
        await log(`Warning: failed to remove old container: ${err instanceof Error ? err.message : String(err)}`);
      });
    }
    await repo.updateStatus(activeDeployment.id, "ROLLED_BACK");
  }

  const message = `Deployment successful — ${containerName} is live on port ${hostPort}`;
  await log(message);

  return {
    deployment: { ...deployment, status: "ACTIVE" },
    message,
  };
}

/** Used by cancelDeploy to release environment locks without running the full pipeline. */
export async function releaseEnvironmentDeployLock(environmentId: string): Promise<void> {
  await envRepo.releaseDeployLock(environmentId);
}
