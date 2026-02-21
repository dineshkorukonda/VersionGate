import { Deployment, DeploymentStatus } from "@prisma/client";
import { DeploymentRepository } from "../repositories/deployment.repository";
import { TrafficService } from "./traffic.service";
import { dockerStop } from "../utils/docker";
import { logger } from "../utils/logger";
import { NotFoundError, DeploymentError } from "../utils/errors";

export interface RollbackResult {
  rolledBackFrom: Deployment;
  restoredTo: Deployment;
  message: string;
}

export class RollbackService {
  private readonly repo: DeploymentRepository;
  private readonly traffic: TrafficService;

  constructor() {
    this.repo = new DeploymentRepository();
    this.traffic = new TrafficService();
  }

  /**
   * Rolls back to the previous ACTIVE deployment:
   * 1. Find the current active deployment (green).
   * 2. Find the one before it (blue/previous).
   * 3. Stop the current container.
   * 4. Switch Nginx traffic back to the previous port.
   * 5. Mark previous as ACTIVE, current as ROLLED_BACK.
   *
   * TODO: handle edge case where previous container was already removed.
   */
  async rollback(): Promise<RollbackResult> {
    logger.info("Initiating rollback");

    const current = await this.repo.findActive();
    if (!current) {
      throw new NotFoundError("Active deployment");
    }

    const previous = await this.findPreviousDeployment();
    if (!previous) {
      throw new DeploymentError("No previous deployment available for rollback");
    }

    // Stop the current (green) container
    // TODO: verify container exists before stopping
    await dockerStop(current.containerName);
    await this.repo.updateStatus(current.id, DeploymentStatus.ROLLED_BACK);

    // Restore traffic to previous (blue) container
    await this.traffic.switchTrafficTo(previous.port);
    await this.repo.updateStatus(previous.id, DeploymentStatus.ACTIVE);

    logger.info(
      { from: current.containerName, to: previous.containerName },
      "Rollback completed"
    );

    return {
      rolledBackFrom: { ...current, status: DeploymentStatus.ROLLED_BACK },
      restoredTo: { ...previous, status: DeploymentStatus.ACTIVE },
      message: `Rolled back from v${current.version} to v${previous.version}`,
    };
  }

  /**
   * Finds the deployment that was ACTIVE immediately before the current one.
   * TODO: extend to support rollback to arbitrary versions by tag/id.
   */
  private async findPreviousDeployment(): Promise<Deployment | null> {
    return this.repo.findPrevious();
  }
}
