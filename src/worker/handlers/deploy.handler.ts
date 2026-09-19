import { eq } from "drizzle-orm";
import { config } from "../../config/env";
import { decryptProjectEnv } from "../../utils/env";
import { DeploymentRepository } from "../../repositories/deployment.repository";
import { EnvironmentRepository, DEFAULT_ENVIRONMENT_NAME } from "../../repositories/environment.repository";
import { ProjectRepository } from "../../repositories/project.repository";
import { getDb } from "../../db/client";
import { jobs, JobSelect, ProjectSelect, EnvironmentSelect } from "../../db/schema";
import { buildImage, runContainer, stopContainer, removeContainer, freeHostPort } from "../../utils/docker";
import { ensureDockerfile } from "../../utils/dockerfile";
import { buildAndStartPm2Deployment, stopPm2App } from "../../utils/pm2";
import { DeploymentError } from "../../utils/errors";
import { logger } from "../../utils/logger";
import { detectHealthPathFromDir } from "../../utils/health-detector";
import { TrafficService } from "../../services/traffic.service";
import { GitService } from "../../services/git.service";
import { ValidationService } from "../../services/validation.service";
import { completeJob, failJob } from "../../services/job-queue.service";
import { humanizeDeployFailure } from "../../utils/deploy-errors";
import { logEmitter } from "../../events/log-emitter";
import { syncCustomDomainUpstream } from "../../services/project-domain.service";

const repo = new DeploymentRepository();
const envRepo = new EnvironmentRepository();
const projectRepo = new ProjectRepository();
const traffic = new TrafficService();
const git = new GitService();
const validation = new ValidationService();

export type LogFn = (line: string) => void | Promise<void>;

async function checkCancelled(deploymentId: string | undefined, log: LogFn): Promise<void> {
  if (!deploymentId) return;
  const d = await repo.findById(deploymentId);
  if (d && d.status !== "DEPLOYING") {
    await log(`[cancel] Deployment status is ${d.status} — aborting pipeline`);
    throw new DeploymentError("Cancelled by user");
  }
}

async function updateJobDeploymentId(jobId: string, deploymentId: string): Promise<void> {
  const db = getDb();
  await db
    .update(jobs)
    .set({ deploymentId, updatedAt: new Date() })
    .where(eq(jobs.id, jobId));
}

export async function runDeployJob(
  job: JobSelect & { project: ProjectSelect; environment: EnvironmentSelect | null },
  log: LogFn
): Promise<void> {
  const { projectId, id: jobId } = job;
  const project = job.project;

  const environment =
    job.environment ?? (await envRepo.findDefaultForProject(projectId));
  if (!environment) {
    await failJob(jobId, `No environment for project ${projectId}`);
    await log(`No default environment — cannot deploy`);
    logEmitter.emitStatus(jobId, "FAILED");
    return;
  }

  const environmentId = environment.id;

  const acquired = await envRepo.acquireDeployLock(environmentId);
  if (!acquired) {
    await failJob(jobId, `Deployment already in progress for environment ${environmentId}`);
    await log(`Deploy lock already held — rejecting job`);
    logEmitter.emitStatus(jobId, "FAILED");
    return;
  }

  let deploymentId: string | undefined;

  try {
    await log(
      `Starting deployment pipeline for project ${project.name} (${projectId}), env ${environment.name} (${environmentId})`
    );

    await log(`Step 1: Preparing source code (branch ${environment.branch})`);
    await git.prepareSource(project, environment.branch);
    const latestCommit = await git.getLatestCommit(project);
    if (latestCommit) {
      await log(`Commit: ${latestCommit.sha.slice(0, 7)} — "${latestCommit.message}" by ${latestCommit.author}`);
    }
    await checkCancelled(undefined, log);

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
    deploymentId = deployment.id;

    await updateJobDeploymentId(jobId, deploymentId);

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
      await checkCancelled(deploymentId, log);
    } else {
      await log(`Step 4: Building Docker image`);
      await buildImage(imageTag, buildContextPath);
      await checkCancelled(deploymentId, log);

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
      await checkCancelled(deploymentId, log);
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
    const health = await validation.validate(
      `http://localhost:${hostPort}`,
      activeHealthPath,
      containerName
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
    await checkCancelled(deploymentId, log);

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

    await log(`Deployment successful — ${containerName} is live on port ${hostPort}`);

    await completeJob(jobId, {
      deployment: { ...deployment, status: "ACTIVE" },
      message: `Deployment successful — ${containerName} is live on port ${hostPort}`,
    });
    logEmitter.emitStatus(jobId, "COMPLETE");
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const friendly = humanizeDeployFailure(errMsg);
    if (deploymentId) {
      await repo.updateStatus(deploymentId, "FAILED", friendly).catch(() => null);
    }
    await failJob(jobId, friendly);
    await log(`FAILED: ${friendly}`);
    logEmitter.emitStatus(jobId, "FAILED");
  } finally {
    await envRepo.releaseDeployLock(environmentId);
    await log(`Deploy lock released`);
  }
}
