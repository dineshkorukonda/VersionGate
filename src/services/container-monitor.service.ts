import { DeploymentRepository } from "../repositories/deployment.repository";
import { DeploymentSelect, ProjectSelect } from "../db/schema";
import { inspectContainer } from "../utils/docker";
import { logger } from "../utils/logger";

const INTERVAL_MS = 60_000;

export class ContainerMonitorService {
  private readonly repo: DeploymentRepository;
  private timer: ReturnType<typeof setInterval> | undefined;
  private tickRunning = false;

  constructor() {
    this.repo = new DeploymentRepository();
  }

  start(): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      this.tick().catch((err) => {
        logger.error({ err }, "ContainerMonitor: unexpected error in tick");
      });
    }, INTERVAL_MS);

    this.timer.unref();
    logger.info({ intervalMs: INTERVAL_MS }, "ContainerMonitor: started");
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = undefined;
    logger.info("ContainerMonitor: stopped");
  }

  private async tick(): Promise<void> {
    if (this.tickRunning) {
      logger.warn("ContainerMonitor: previous tick still running — skipping this interval");
      return;
    }

    this.tickRunning = true;
    try {
      await this.checkAllActive();
    } finally {
      this.tickRunning = false;
    }
  }

  private async checkAllActive(): Promise<void> {
    let active: (DeploymentSelect & { project: ProjectSelect })[];

    try {
      active = await this.repo.findAllActiveWithProjects();
    } catch (err) {
      logger.error({ err }, "ContainerMonitor: failed to fetch active deployments — skipping tick");
      return;
    }

    if (active.length === 0) return;

    logger.debug({ count: active.length }, "ContainerMonitor: inspecting active containers");

    for (const deployment of active) {
      await this.checkContainer(deployment);
    }
  }

  private async checkContainer(
    deployment: DeploymentSelect & { project: ProjectSelect }
  ): Promise<void> {
    const { id: deploymentId, containerName, project } = deployment;

    let running: boolean;
    try {
      running = await inspectContainer(containerName);
    } catch (err) {
      logger.error(
        { err, containerName, projectName: project.name, deploymentId },
        "ContainerMonitor: docker inspect threw — skipping this container"
      );
      return;
    }

    if (running) return;

    logger.error(
      {
        projectName: project.name,
        containerName,
        deploymentId,
        projectId: project.id,
      },
      "ContainerMonitor: container is not running — marking deployment FAILED"
    );

    try {
      await this.repo.updateStatus(
        deploymentId,
        "FAILED",
        "Container is not running (removed or exited)"
      );
    } catch (err) {
      logger.error(
        { err, deploymentId, projectName: project.name },
        "ContainerMonitor: failed to persist FAILED status — will retry next interval"
      );
    }
  }
}
