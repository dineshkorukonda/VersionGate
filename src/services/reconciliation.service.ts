import { and, eq, or, gte, isNull } from "drizzle-orm";
import { getDb } from "../db/client";
import { jobs } from "../db/schema";
import { DeploymentRepository } from "../repositories/deployment.repository";
import { EnvironmentRepository } from "../repositories/environment.repository";
import { isPm2Running, stopPm2App } from "../utils/pm2";
import { ProjectRepository } from "../repositories/project.repository";
import { stopContainer, removeContainer, inspectContainer } from "../utils/docker";
import { logger } from "../utils/logger";
import { recoverStuckJobs, JOB_LEASE_MS } from "./job-queue.service";

export interface ReconciliationReport {
  deployingFixed: number;
  staleLocksCleared: number;
  stuckJobsRecovered: number;
  activeInvalidated: number;
}

export class ReconciliationService {
  private readonly repo: DeploymentRepository;
  private readonly envRepo: EnvironmentRepository;

  constructor() {
    this.repo = new DeploymentRepository();
    this.envRepo = new EnvironmentRepository();
  }

  async reconcile(): Promise<ReconciliationReport> {
    logger.info("Starting startup reconciliation");

    let stuckJobsRecovered = 0;
    try {
      stuckJobsRecovered = await recoverStuckJobs();
    } catch (err) {
      logger.warn({ err }, "Reconciliation: failed to recover stuck jobs");
    }
    const deployingFixed = await this.fixDeployingDeployments();
    const staleLocksCleared = await this.envRepo.clearStaleDeployLocks();
    const activeInvalidated = await this.auditActiveDeployments();

    logger.info(
      { deployingFixed, staleLocksCleared, stuckJobsRecovered, activeInvalidated },
      "Reconciliation complete"
    );
    return { deployingFixed, staleLocksCleared, stuckJobsRecovered, activeInvalidated };
  }

  private async fixDeployingDeployments(): Promise<number> {
    const deploying = await this.repo.findAllDeploying();
    if (deploying.length === 0) return 0;

    logger.warn({ count: deploying.length }, "Found DEPLOYING deployments — crash recovery");

    let fixed = 0;
    for (const d of deploying) {
      // API restarts must not tear down deployments owned by an external worker.
      const [live] = await getDb().select().from(jobs).where(and(
        eq(jobs.deploymentId, d.id), eq(jobs.status, "RUNNING"),
        or(gte(jobs.leaseExpiresAt, new Date()), and(isNull(jobs.leaseExpiresAt),
          gte(jobs.updatedAt, new Date(Date.now() - 2 * 60 * 60 * 1000)))),
      )).limit(1);
      if (live || d.updatedAt.getTime() > Date.now() - JOB_LEASE_MS) continue;
      fixed++;
      logger.warn(
        { deploymentId: d.id, containerName: d.containerName, environmentId: d.environmentId },
        "Recovering crashed deployment"
      );
      const env = await this.envRepo.findById(d.environmentId);
      const project = env ? await new ProjectRepository().findById(env.projectId) : null;
      if (project?.deploymentType === "pm2") {
        await stopPm2App(d.containerName).catch(() => null);
      } else {
        await stopContainer(d.containerName).catch(() => null);
        await removeContainer(d.containerName).catch(() => null);
      }
      await this.repo.updateStatus(d.id, "FAILED").catch((err) => {
        logger.error({ err, deploymentId: d.id }, "Failed to mark crashed deployment as FAILED");
      });
    }

    return fixed;
  }

  private async auditActiveDeployments(): Promise<number> {
    const active = await this.repo.findAllActiveWithProjects();
    if (active.length === 0) return 0;

    let invalidated = 0;

    for (const d of active) {
      let running: boolean;
      try {
        running = d.project.deploymentType === "pm2"
          ? await isPm2Running(d.containerName)
          : await inspectContainer(d.containerName);
      } catch (err) {
        logger.warn(
          { err, deploymentId: d.id, containerName: d.containerName, environmentId: d.environmentId },
          "Reconciliation: docker inspect failed — skipping this deployment (will retry on next startup)"
        );
        continue;
      }
      if (!running) {
        logger.warn(
          { deploymentId: d.id, containerName: d.containerName, environmentId: d.environmentId },
          "ACTIVE deployment container is not running — marking FAILED"
        );
        await this.repo
          .updateStatus(
            d.id,
            "FAILED",
            "Container is not running (removed or exited)"
          )
          .catch((err) => {
            logger.error({ err, deploymentId: d.id }, "Failed to invalidate dead deployment");
          });
        invalidated++;
      }
    }

    return invalidated;
  }
}
