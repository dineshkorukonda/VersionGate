import { eq } from "drizzle-orm";
import { DeploymentRepository } from "../../repositories/deployment.repository";
import { EnvironmentRepository } from "../../repositories/environment.repository";
import { getDb } from "../../db/client";
import { jobs, JobSelect, ProjectSelect, EnvironmentSelect } from "../../db/schema";
import { DeploymentError } from "../../utils/errors";
import { runDeployPipeline } from "../../services/deploy-pipeline.service";
import { completeJob, failJob } from "../../services/job-queue.service";
import { humanizeDeployFailure } from "../../utils/deploy-errors";
import { logEmitter } from "../../events/log-emitter";

const repo = new DeploymentRepository();
const envRepo = new EnvironmentRepository();

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
    const result = await runDeployPipeline({
      project,
      environment,
      log,
      checkCancelled: async (id) => {
        await checkCancelled(id, log);
      },
      onDeploymentCreated: async (id) => {
        deploymentId = id;
        await updateJobDeploymentId(jobId, id);
      },
    });

    await completeJob(jobId, {
      deployment: result.deployment,
      message: result.message,
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
