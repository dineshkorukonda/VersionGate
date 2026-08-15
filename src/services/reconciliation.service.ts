import { DeploymentRepository } from "../repositories/deployment.repository";
import { EnvironmentRepository } from "../repositories/environment.repository";
import { stopContainer, removeContainer, inspectContainer } from "../utils/docker";
import { logger } from "../utils/logger";
import { recoverStuckJobs } from "./job-queue.service";

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

    const deployingFixed = await this.fixDeployingDeployments();
    const staleLocksCleared = await this.envRepo.clearStaleDeployLocks();
    let stuckJobsRecovered = 0;
    try {
      stuckJobsRecovered = await recoverStuckJobs();
    } catch (err) {
      logger.warn({ err }, "Reconciliation: failed to recover stuck jobs");
    }
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

    for (const d of deploying) {
      logger.warn(
        { deploymentId: d.id, containerName: d.containerName, environmentId: d.environmentId },
        "Recovering crashed deployment"
      );
      await stopContainer(d.containerName).catch(() => null);
      await removeContainer(d.containerName).catch(() => null);
      await this.repo.updateStatus(d.id, "FAILED").catch((err) => {
        logger.error({ err, deploymentId: d.id }, "Failed to mark crashed deployment as FAILED");
      });
    }

    return deploying.length;
  }

  private async auditActiveDeployments(): Promise<number> {
    const active = await this.repo.findAllActiveWithProjects();
    if (active.length === 0) return 0;

    let invalidated = 0;

    for (const d of active) {
      let running: boolean;
      try {
        running = await inspectContainer(d.containerName);
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
