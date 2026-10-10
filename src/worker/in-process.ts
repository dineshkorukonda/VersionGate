import { logger } from "../utils/logger";
import { inProcessWorkerLive } from "../config/env";
import { claimNextJob, appendLog, failJob, recoverStuckJobs, withJobHeartbeat } from "../services/job-queue.service";
import { runDeployJob } from "./handlers/deploy.handler";
import { runRollbackJob } from "./handlers/rollback.handler";
import { runPromoteJob } from "./handlers/promote.handler";
import { logEmitter } from "../events/log-emitter";

let inProcessWorkerActive = false;
let tickRunning = false;
let workerLoopTimer: NodeJS.Timeout | null = null;

function makeLogFn(jobId: string): (line: string) => Promise<void> {
  return async (line: string) => {
    await appendLog(jobId, line);
    logEmitter.emitLog(jobId, line);
  };
}

async function tickWorker(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim() || tickRunning) return;
  tickRunning = true;

  try {
    const job = await claimNextJob();
    if (!job) return;

    await withJobHeartbeat(job.id, async () => {
      try {
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
        await failJob(job.id, err instanceof Error ? err.message : String(err));
        logEmitter.emitStatus(job.id, "FAILED");
        throw err;
      }
    });
  } catch (err) {
    logger.warn({ err }, "In-process worker tick error");
  } finally {
    tickRunning = false;
  }
}

export function startInProcessWorker(): void {
  if (inProcessWorkerActive) return;
  if (!inProcessWorkerLive()) {
    logger.info(
      "In-process worker not started (IN_PROCESS_WORKER=false). Run the external worker process for job execution."
    );
    return;
  }
  inProcessWorkerActive = true;
  logger.info("In-process background worker engine started (auto-healing active)");

  recoverStuckJobs().then((n) => {
    if (n > 0) {
      logger.info({ count: n }, "In-process worker recovered stuck jobs on startup");
    }
  }).catch((err) => {
    logger.warn({ err }, "In-process worker failed to recover stuck jobs on startup");
  });

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
