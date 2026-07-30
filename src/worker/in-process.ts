import { logger } from "../utils/logger";
import { claimNextJob, appendLog, failJob } from "../services/job-queue.service";
import { runDeployJob } from "./handlers/deploy.handler";
import { runRollbackJob } from "./handlers/rollback.handler";
import { runPromoteJob } from "./handlers/promote.handler";
import { logEmitter } from "../events/log-emitter";

let inProcessWorkerActive = false;
let workerLoopTimer: NodeJS.Timeout | null = null;

function makeLogFn(jobId: string): (line: string) => Promise<void> {
  return async (line: string) => {
    await appendLog(jobId, line);
    logEmitter.emitLog(jobId, line);
  };
}

async function tickWorker(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) return;

  try {
    const job = await claimNextJob();
    if (!job) return;

    logger.info({ jobId: job.id, type: job.type }, "In-process worker executing job");
    const log = makeLogFn(job.id);
    await log(`[job ${job.id}] type=${job.type} status=RUNNING`);

    if (job.type === "DEPLOY") {
      await runDeployJob(job, log);
    } else if (job.type === "ROLLBACK") {
      await runRollbackJob(job, log);
    } else if (job.type === "PROMOTE") {
      await runPromoteJob(job, log);
    } else {
      await log(`Unknown job type: ${job.type}`);
      await failJob(job.id, `Unknown job type: ${job.type}`);
      logEmitter.emitStatus(job.id, "FAILED");
    }
  } catch (err) {
    logger.warn({ err }, "In-process worker tick error");
  }
}

export function startInProcessWorker(): void {
  if (inProcessWorkerActive) return;
  inProcessWorkerActive = true;
  logger.info("In-process background worker engine started (auto-healing active)");

  workerLoopTimer = setInterval(() => {
    void tickWorker();
  }, 2000);
}

export function stopInProcessWorker(): void {
  if (workerLoopTimer) {
    clearInterval(workerLoopTimer);
    workerLoopTimer = null;
  }
  inProcessWorkerActive = false;
}
