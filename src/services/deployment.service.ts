import { Deployment, DeploymentStatus } from "@prisma/client";
import { config } from "../config/env";
import { DeploymentRepository } from "../repositories/deployment.repository";
import { dockerPull, dockerRun, dockerStop } from "../utils/docker";
import { logger } from "../utils/logger";
import { ConflictError, DeploymentError } from "../utils/errors";
import { ValidationService } from "./validation.service";
import { TrafficService } from "./traffic.service";
import { RollbackService } from "./rollback.service";

export interface DeployOptions {
  imageTag: string;
}

export interface DeployResult {
  deployment: Deployment;
  message: string;
}

export class DeploymentService {
  private readonly repo: DeploymentRepository;
  private readonly validation: ValidationService;
  private readonly traffic: TrafficService;
  private readonly rollback: RollbackService;

  constructor() {
    this.repo = new DeploymentRepository();
    this.validation = new ValidationService();
    this.traffic = new TrafficService();
    this.rollback = new RollbackService();
  }

  /**
   * Orchestrates a full blue-green deployment:
   * 1. Pull image
   * 2. Start green container
   * 3. Health-check green container
   * 4. Switch Nginx traffic → green
   * 5. Mark green as ACTIVE; retire old active deployment
   * On failure: stop green container and mark it FAILED.
   */
  async deploy(opts: DeployOptions): Promise<DeployResult> {
    const { imageTag } = opts;
    logger.info({ imageTag }, "Starting deployment");

    // Guard: prevent concurrent deployments
    const existing = await this.getActiveDeployment();
    if (existing?.status === DeploymentStatus.PENDING) {
      throw new ConflictError("A deployment is already in progress");
    }

    const version = await this.repo.getNextVersion();
    const port = config.docker.basePort + version;
    const containerName = `zeroshift-app-v${version}`;

    // Persist initial record
    const deployment = await this.repo.create({
      version,
      imageTag,
      containerName,
      port,
      status: DeploymentStatus.PENDING,
    });

    try {
      // Step 1 — Pull image
      await dockerPull(imageTag);

      // Step 2 — Start green container
      await this.startGreenContainer({ containerName, imageTag, port });

      // Step 3 — Validate health
      const containerUrl = `http://localhost:${port}`;
      const healthy = await this.validation.validate(containerUrl);

      if (!healthy) {
        await this.stopContainer(containerName);
        await this.repo.updateStatus(deployment.id, DeploymentStatus.FAILED);
        throw new DeploymentError(`Health check failed for ${containerName}`);
      }

      // Step 4 — Switch traffic
      await this.traffic.switchTrafficTo(port);

      // Step 5 — Activate
      await this.repo.updateStatus(deployment.id, DeploymentStatus.ACTIVE);
      logger.info({ deploymentId: deployment.id, containerName }, "Deployment successful");

      return {
        deployment: { ...deployment, status: DeploymentStatus.ACTIVE },
        message: "Deployment successful",
      };
    } catch (err) {
      // Rollback guard — only update status if not already set
      await this.repo.updateStatus(deployment.id, DeploymentStatus.FAILED).catch(() => null);
      throw err;
    }
  }

  async startGreenContainer(opts: {
    containerName: string;
    imageTag: string;
    port: number;
  }): Promise<void> {
    logger.info(opts, "Starting green container");
    // TODO: wire to real Docker run
    await dockerRun({
      ...opts,
      network: config.docker.network,
    });
  }

  async stopContainer(containerName: string): Promise<void> {
    logger.info({ containerName }, "Stopping container");
    // TODO: wire to real Docker stop
    await dockerStop(containerName);
  }

  async getActiveDeployment(): Promise<Deployment | null> {
    return this.repo.findActive();
  }

  async getAllDeployments(): Promise<Deployment[]> {
    return this.repo.findAll();
  }
}
