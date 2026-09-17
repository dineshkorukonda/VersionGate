import { cronRepository } from "../repositories/cron.repository";
import { ProjectRepository } from "../repositories/project.repository";
import { DeploymentRepository } from "../repositories/deployment.repository";
import { serverSpecsService } from "./server-specs.service";
import { execContainer } from "../utils/docker";
import { execFileAsync } from "../utils/exec";
import { logger } from "../utils/logger";
import type { CronJobSelect, CronJobLogSelect } from "../db/schema";

export function matchCronField(field: string, value: number): boolean {
  const trimmed = field.trim();
  if (trimmed === "*") return true;

  // Handle step values like */5
  if (trimmed.startsWith("*/")) {
    const step = parseInt(trimmed.slice(2), 10);
    return !isNaN(step) && step > 0 && value % step === 0;
  }

  // Handle lists like 1,5,10
  if (trimmed.includes(",")) {
    const parts = trimmed.split(",");
    return parts.some((p) => matchCronField(p, value));
  }

  // Handle ranges like 1-5
  if (trimmed.includes("-")) {
    const [minStr, maxStr] = trimmed.split("-");
    const min = parseInt(minStr, 10);
    const max = parseInt(maxStr, 10);
    return !isNaN(min) && !isNaN(max) && value >= min && value <= max;
  }

  const num = parseInt(trimmed, 10);
  return !isNaN(num) && num === value;
}

export function isCronMatch(schedule: string, date = new Date()): boolean {
  const parts = schedule.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const [minField, hourField, domField, monthField, dowField] = parts;

  const minute = date.getMinutes();
  const hour = date.getHours();
  const dayOfMonth = date.getDate();
  const month = date.getMonth() + 1; // 1-12
  const dayOfWeek = date.getDay(); // 0-6

  return (
    matchCronField(minField, minute) &&
    matchCronField(hourField, hour) &&
    matchCronField(domField, dayOfMonth) &&
    matchCronField(monthField, month) &&
    matchCronField(dowField, dayOfWeek)
  );
}

export interface CronExecutionResult {
  jobId: string;
  status: "SUCCESS" | "FAILED" | "TIMEOUT";
  durationMs: number;
  output: string;
  log?: CronJobLogSelect;
}

export class CronRunnerService {
  private projectRepo: ProjectRepository;
  private deploymentRepo: DeploymentRepository;
  private runningJobs = new Set<string>();
  private timer: NodeJS.Timeout | null = null;

  constructor(
    projectRepo = new ProjectRepository(),
    deploymentRepo = new DeploymentRepository()
  ) {
    this.projectRepo = projectRepo;
    this.deploymentRepo = deploymentRepo;
  }

  startScheduler(intervalMs = 60000): void {
    if (this.timer) return;
    logger.info("Starting background Cron Runner Service...");
    this.timer = setInterval(() => {
      void this.tick();
    }, intervalMs);
  }

  stopScheduler(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info("Stopped background Cron Runner Service");
    }
  }

  async tick(): Promise<void> {
    const now = new Date();
    try {
      const enabledJobs = await cronRepository.findEnabled();
      const capacity = serverSpecsService.getServerCapacity();
      const maxConcurrency = capacity.recommendations.cron.maxConcurrentJobs;

      for (const job of enabledJobs) {
        if (!isCronMatch(job.schedule, now)) continue;
        if (this.runningJobs.has(job.id)) {
          logger.warn({ jobId: job.id, name: job.name }, "Cron job already running — skipping duplicate tick");
          continue;
        }
        if (this.runningJobs.size >= maxConcurrency) {
          logger.warn({ activeCount: this.runningJobs.size, maxConcurrency }, "Max concurrent cron jobs reached — throttling");
          break;
        }

        // Dispatch job asynchronously
        void this.executeJob(job, "SCHEDULE");
      }
    } catch (err) {
      logger.error({ err }, "Error running cron scheduler tick");
    }
  }

  async executeJob(
    job: CronJobSelect,
    triggeredBy: "SCHEDULE" | "MANUAL" = "SCHEDULE"
  ): Promise<CronExecutionResult> {
    this.runningJobs.add(job.id);
    const startTime = Date.now();
    let status: "SUCCESS" | "FAILED" | "TIMEOUT" = "SUCCESS";
    let output = "";

    await cronRepository.update(job.id, {
      lastStatus: "RUNNING",
      lastRunAt: new Date(),
    });

    try {
      const timeoutMs = (job.timeoutSeconds || 60) * 1000;

      if (job.targetType === "HTTP") {
        output = await this.executeHttpTarget(job, timeoutMs);
      } else if (job.targetType === "COMMAND") {
        output = await this.executeCommandTarget(job, timeoutMs);
      } else {
        throw new Error(`Unsupported targetType: ${job.targetType}`);
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes("aborted") || msg.includes("timeout") || msg.includes("Timeout")) {
        status = "TIMEOUT";
        output = `Execution timed out after ${job.timeoutSeconds}s: ${msg}`;
      } else {
        status = "FAILED";
        output = `Execution error: ${msg}`;
      }
      logger.error({ jobId: job.id, name: job.name, status, err }, "Cron job execution failed");
    } finally {
      this.runningJobs.delete(job.id);
    }

    const durationMs = Date.now() - startTime;

    // Persist result and execution log
    await cronRepository.update(job.id, {
      lastStatus: status,
      lastDurationMs: durationMs,
      lastOutput: output.slice(0, 4000),
      lastRunAt: new Date(),
    });

    const log = await cronRepository.createLog({
      cronJobId: job.id,
      status,
      durationMs,
      output: output.slice(0, 8000),
      triggeredBy,
    });

    logger.info(
      { jobId: job.id, name: job.name, status, durationMs, triggeredBy },
      `Cron job ${job.name} finished: [ ${status} ] (${durationMs}ms)`
    );

    return {
      jobId: job.id,
      status,
      durationMs,
      output,
      log,
    };
  }

  private async executeHttpTarget(job: CronJobSelect, timeoutMs: number): Promise<string> {
    let targetUrl = job.httpPath?.trim() || "/";

    // If relative path and project is linked, resolve internal project slot port
    if (job.projectId && !targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      const project = await this.projectRepo.findById(job.projectId);
      if (!project) throw new Error("Linked project not found");

      // Find active deployment port
      let port = project.basePort;
      const activeDep = await this.deploymentRepo.findActiveForProject(job.projectId);
      if (activeDep && activeDep.port) {
        port = activeDep.port;
      }

      const normalizedPath = targetUrl.startsWith("/") ? targetUrl : `/${targetUrl}`;
      targetUrl = `http://127.0.0.1:${port}${normalizedPath}`;
    }

    const method = (job.httpMethod || "GET").toUpperCase();
    const headers: Record<string, string> = {
      "User-Agent": "VersionGate-CronRunner/2.9.5",
      ...(job.httpHeaders as Record<string, string> | undefined),
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(targetUrl, {
        method,
        headers,
        signal: controller.signal,
      });

      const body = await res.text();
      const statusText = `HTTP ${res.status} ${res.statusText}`;

      if (!res.ok) {
        throw new Error(`${statusText} - Response: ${body.slice(0, 500)}`);
      }

      return `${statusText}\n${body.slice(0, 2000)}`;
    } finally {
      clearTimeout(timer);
    }
  }

  private async executeCommandTarget(job: CronJobSelect, timeoutMs: number): Promise<string> {
    const cmd = job.command?.trim();
    if (!cmd) throw new Error("No command specified");

    if (job.projectId) {
      const project = await this.projectRepo.findById(job.projectId);
      if (!project) throw new Error("Linked project not found");

      if (project.deploymentType === "docker") {
        const activeDep = await this.deploymentRepo.findActiveForProject(job.projectId);
        const color = activeDep?.color === "GREEN" ? "green" : "blue";
        const containerName = `${project.name}-${color}`;

        const res = await execContainer(containerName, ["sh", "-c", cmd]);
        return res.stdout || res.stderr || "[ OK ] Command executed successfully";
      } else {
        // PM2 / Host process execution
        const res = await execFileAsync("sh", ["-c", cmd], {
          env: (project.env as Record<string, string>) || {},
          timeout: timeoutMs,
        });
        return res.stdout || res.stderr || "[ OK ] Command executed successfully";
      }
    } else {
      // Host standalone command
      const res = await execFileAsync("sh", ["-c", cmd], {
        timeout: timeoutMs,
      });
      return res.stdout || res.stderr || "[ OK ] Command executed successfully";
    }
  }

  async runJobById(id: string): Promise<CronExecutionResult> {
    const job = await cronRepository.findById(id);
    if (!job) throw new Error("Cron job not found");
    return this.executeJob(job, "MANUAL");
  }
}

export const cronRunnerService = new CronRunnerService();
