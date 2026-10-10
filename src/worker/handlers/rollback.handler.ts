import { EnvironmentRepository } from "../../repositories/environment.repository";
import { JobSelect, ProjectSelect, EnvironmentSelect } from "../../db/schema";
import { RollbackService } from "../../services/rollback.service";
import { completeJob, failJob, assertJobLease } from "../../services/job-queue.service";
import { humanizeDeployFailure } from "../../utils/deploy-errors";
import { logEmitter } from "../../events/log-emitter";

const envRepo = new EnvironmentRepository();

export type LogFn = (line: string) => void | Promise<void>;

export async function runRollbackJob(
  job: JobSelect & { project: ProjectSelect; environment: EnvironmentSelect | null },
  log: LogFn
): Promise<void> {
  const environment = job.environment ?? await envRepo.findDefaultForProject(job.projectId);
  if (!environment) {
    await failJob(job.id, `No environment for project ${job.projectId}`);
    logEmitter.emitStatus(job.id, "FAILED");
    return;
  }
  if (!await envRepo.acquireDeployLock(environment.id)) {
    await failJob(job.id, `Deployment already in progress for environment ${environment.id}`);
    logEmitter.emitStatus(job.id, "FAILED");
    return;
  }
  try {
    const rollback = new RollbackService({ log, assertLock: async () => {
      await assertJobLease(job.id);
      await envRepo.assertDeployLock(environment.id);
    } });
    const result = await rollback.rollback(job.projectId, environment.id);
    await log(result.message);
    await completeJob(job.id, result);
    logEmitter.emitStatus(job.id, "COMPLETE");
  } catch (err) {
    const friendly = humanizeDeployFailure(err instanceof Error ? err.message : String(err));
    await failJob(job.id, friendly);
    await log(`FAILED: ${friendly}`);
    logEmitter.emitStatus(job.id, "FAILED");
  } finally {
    await envRepo.releaseDeployLock(environment.id);
    await log("Deploy lock released");
  }
}
