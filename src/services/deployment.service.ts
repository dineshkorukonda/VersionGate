import { DeploymentRepository } from "../repositories/deployment.repository";
import { EnvironmentRepository } from "../repositories/environment.repository";
import { DeploymentSelect } from "../db/schema";
import { stopContainer, removeContainer } from "../utils/docker";
import { logger } from "../utils/logger";
import { NotFoundError } from "../utils/errors";
import { releaseEnvironmentDeployLock } from "./deploy-pipeline.service";

export class DeploymentService {
  private static readonly cancelRequests = new Set<string>();

  private readonly repo: DeploymentRepository;
  private readonly envRepo: EnvironmentRepository;

  constructor() {
    this.repo = new DeploymentRepository();
    this.envRepo = new EnvironmentRepository();
  }

  async cancelDeploy(projectId: string): Promise<{ cancelled: boolean }> {
    const defaultEnv = await this.envRepo.findDefaultForProject(projectId);
    if (!defaultEnv) {
      throw new NotFoundError(`No default environment for project ${projectId}`);
    }

    const deploying = await this.repo.findDeployingForEnvironment(defaultEnv.id);

    if (!deploying) {
      throw new NotFoundError(`No in-progress deployment found for project ${projectId}`);
    }

    DeploymentService.cancelRequests.add(defaultEnv.id);

    if (deploying.containerName) {
      await stopContainer(deploying.containerName).catch(() => null);
      await removeContainer(deploying.containerName).catch(() => null);
    }

    await this.repo.updateStatus(deploying.id, "FAILED", "Cancelled by user").catch(() => null);

    await releaseEnvironmentDeployLock(defaultEnv.id);
    DeploymentService.cancelRequests.delete(defaultEnv.id);

    logger.info({ projectId, environmentId: defaultEnv.id, deploymentId: deploying.id }, "Deployment cancelled");
    return { cancelled: true };
  }

  async getActiveDeployment(projectId?: string): Promise<DeploymentSelect | null> {
    if (projectId) {
      const env = await this.envRepo.findDefaultForProject(projectId);
      if (!env) return null;
      return this.repo.findActiveForEnvironment(env.id);
    }
    return this.repo.findAll().then((all) => all.find((d) => d.status === "ACTIVE") ?? null);
  }

  async getAllDeployments(
    projectId?: string
  ): Promise<(DeploymentSelect & { projectId: string; projectName?: string; jobId?: string | null })[]> {
    if (projectId) {
      return this.repo.findAllForProject(projectId);
    }
    return this.repo.findAll();
  }
}
