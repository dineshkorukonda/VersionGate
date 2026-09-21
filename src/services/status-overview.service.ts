import os from "os";
import { getDb } from "../db/client";
import { sql, eq } from "drizzle-orm";
import { jobs } from "../db/schema";
import redisService from "./redis.service";
import { ProjectRepository } from "../repositories/project.repository";
import { DeploymentRepository } from "../repositories/deployment.repository";
import { EnvironmentRepository } from "../repositories/environment.repository";
import { GitService } from "./git.service";
import { isPm2Available, listPm2Processes } from "../utils/pm2";
import { inspectContainer } from "../utils/docker";
import { config } from "../config/env";
import { systemMetrics } from "./system-metrics.service";
import { enqueueJob } from "./job-queue.service";
import { logger } from "../utils/logger";

export interface SubsystemStatus {
  id: string;
  name: string;
  category: "core" | "runtime" | "network" | "integration";
  status: "operational" | "degraded" | "down" | "unconfigured";
  latencyMs?: number;
  details?: Record<string, unknown>;
  description: string;
}

export interface ApplicationStatus {
  projectId: string;
  projectName: string;
  serviceType: "pm2" | "docker";
  branch: string;
  repoUrl: string;
  localPath?: string | null;
  activePort?: number | null;
  healthPath: string;
  status: "healthy" | "degraded" | "error" | "stopped" | "uninitialized";
  healthLatencyMs?: number;
  activeDeployment?: {
    id: string;
    version: number;
    color: string;
    status: string;
    containerName: string;
    commitSha?: string | null;
    commitMessage?: string | null;
    commitAuthor?: string | null;
    updatedAt: string;
  } | null;
  latestCommit?: {
    sha: string;
    message: string;
    author: string;
    date: string;
  } | null;
  isCommitSynced: boolean;
  autoDeployEnabled: boolean;
  webhookConfigured: boolean;
  metrics?: {
    cpuPercent?: number;
    memoryBytes?: number;
    uptime?: number;
  };
  diagnosticMessage: string;
}

export interface ComprehensiveStatusReport {
  timestamp: string;
  overallStatus: "operational" | "degraded" | "down";
  uptime: number;
  subsystems: SubsystemStatus[];
  applications: ApplicationStatus[];
  summary: {
    totalSubsystems: number;
    operationalSubsystems: number;
    totalApplications: number;
    healthyApplications: number;
    outOfSyncApplications: number;
    autoDeployActiveCount: number;
  };
  systemTelemetry: {
    cpuPercent: number;
    memoryPercent: number;
    memoryUsed: number;
    memoryTotal: number;
    diskPercent: number;
    diskUsed: number;
    diskTotal: number;
    loadAvg: number[];
    uptime: number;
  };
}

export class StatusOverviewService {
  private readonly projectRepo = new ProjectRepository();
  private readonly deploymentRepo = new DeploymentRepository();
  private readonly envRepo = new EnvironmentRepository();
  private readonly gitService = new GitService();

  async getComprehensiveStatus(): Promise<ComprehensiveStatusReport> {
    const timestamp = new Date().toISOString();
    const uptime = os.uptime();
    const subsystems: SubsystemStatus[] = [];

    // 1. API Subsystem
    subsystems.push({
      id: "api",
      name: "Fastify API Server",
      category: "core",
      status: "operational",
      description: "Zero-downtime REST control plane and deployment orchestration API",
      details: {
        port: 9090,
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
      },
    });

    // 2. Database Subsystem
    let dbConnected = false;
    let dbLatencyMs = 0;
    try {
      const start = Date.now();
      const db = getDb();
      await db.execute(sql`SELECT 1`);
      dbConnected = true;
      dbLatencyMs = Date.now() - start;
      subsystems.push({
        id: "database",
        name: "PostgreSQL Database",
        category: "core",
        status: "operational",
        latencyMs: dbLatencyMs,
        description: "Primary relational state store and deployment metadata database",
        details: { connection: "active", latencyMs: dbLatencyMs },
      });
    } catch (err: any) {
      subsystems.push({
        id: "database",
        name: "PostgreSQL Database",
        category: "core",
        status: "down",
        description: "PostgreSQL connection failed",
        details: { error: err?.message || String(err) },
      });
    }

    // 3. Redis Subsystem
    const redisAvailable = redisService.isAvailable();
    subsystems.push({
      id: "redis",
      name: "Redis Pub/Sub & Lock Broker",
      category: "core",
      status: redisAvailable ? "operational" : "degraded",
      description: "Distributed job locking and real-time deployment log event stream broker",
      details: { available: redisAvailable, port: 6379 },
    });

    // 4. Job Queue & Background Worker Subsystem
    let pendingJobs = 0;
    let runningJobs = 0;
    if (dbConnected) {
      try {
        const db = getDb();
        const pending = await db.select({ count: sql<number>`count(*)` }).from(jobs).where(eq(jobs.status, "PENDING"));
        const running = await db.select({ count: sql<number>`count(*)` }).from(jobs).where(eq(jobs.status, "RUNNING"));
        pendingJobs = Number(pending[0]?.count ?? 0);
        runningJobs = Number(running[0]?.count ?? 0);
      } catch {
        // ignore
      }
    }
    subsystems.push({
      id: "worker",
      name: "Deployment Queue Worker",
      category: "core",
      status: runningJobs > 10 ? "degraded" : "operational",
      description: "Atomic transactional deployment executor and rollback state machine",
      details: { pendingJobs, runningJobs },
    });

    // 5. Docker Container Runtime Subsystem
    let dockerAvailable = false;
    try {
      const { execFileAsync } = await import("../utils/exec");
      await execFileAsync(config.dockerBin, ["version"]);
      dockerAvailable = true;
    } catch {
      dockerAvailable = false;
    }
    subsystems.push({
      id: "docker",
      name: "Docker Container Runtime",
      category: "runtime",
      status: dockerAvailable ? "operational" : "degraded",
      description: "Container virtualization engine for isolated container workloads",
      details: { binary: config.dockerBin, available: dockerAvailable },
    });

    // 6. PM2 Host Supervisor Subsystem
    let pm2Ready = false;
    let pm2Processes: any[] = [];
    try {
      pm2Ready = await isPm2Available();
      if (pm2Ready) {
        pm2Processes = await listPm2Processes();
      }
    } catch {
      pm2Ready = false;
    }
    subsystems.push({
      id: "pm2",
      name: "Host PM2 Process Supervisor",
      category: "runtime",
      status: pm2Ready ? "operational" : "degraded",
      description: "Direct host process execution supervisor for native Node.js / Bun workloads",
      details: { available: pm2Ready, activeProcesses: pm2Processes.length },
    });

    // 7. Reverse Proxy Subsystem
    const nginxAvailable = Boolean(config.nginxConfigPath);
    subsystems.push({
      id: "nginx",
      name: "Nginx Stage Reverse Proxy & SSL",
      category: "network",
      status: nginxAvailable ? "operational" : "degraded",
      description: "High-performance zero-downtime Blue/Green traffic switcher and custom domain routing",
      details: { configPath: config.nginxConfigPath },
    });

    // 8. GitHub Webhook & Relay Subsystem
    const githubRelayConfigured = Boolean(config.githubWebhookSecret || config.githubAppId);
    subsystems.push({
      id: "github_relay",
      name: "GitHub Webhook & App Relay",
      category: "integration",
      status: githubRelayConfigured ? "operational" : "unconfigured",
      description: "Receives commit push events from GitHub and triggers automatic background deployments",
      details: {
        appConfigured: Boolean(config.githubAppId),
        webhookSecretSet: Boolean(config.githubWebhookSecret),
      },
    });

    // 9. Auto-Deploy Synchronization Engine
    subsystems.push({
      id: "autodeploy_engine",
      name: "Auto-Deploy Synchronization Engine",
      category: "core",
      status: "operational",
      description: "Continuous Git commit change detection and zero-downtime push deployment validator",
      details: { active: true },
    });

    // 10. Scan All Managed Applications
    const applications: ApplicationStatus[] = [];
    let healthyAppsCount = 0;
    let outOfSyncAppsCount = 0;

    if (dbConnected) {
      try {
        const allProjects = await this.projectRepo.findAll();

        for (const project of allProjects) {
          const defaultEnv = await this.envRepo.findDefaultForProject(project.id);
          const activeDeploy = defaultEnv
            ? await this.deploymentRepo.findActiveForEnvironment(defaultEnv.id)
            : null;

          // Resolve latest commit from git
          let latestCommit: { sha: string; message: string; author: string; date: string } | null = null;
          try {
            latestCommit = await this.gitService.getLatestCommit(project);
          } catch {
            latestCommit = null;
          }

          const deployedSha = activeDeploy?.commitSha ?? null;
          const isCommitSynced = Boolean(
            deployedSha && latestCommit?.sha && (deployedSha === latestCommit.sha || deployedSha.startsWith(latestCommit.sha) || latestCommit.sha.startsWith(deployedSha))
          );

          if (!isCommitSynced && latestCommit?.sha) {
            outOfSyncAppsCount++;
          }

          // Check runtime health
          let isRunning = false;
          let healthLatencyMs = 0;
          let procCpu: number | undefined;
          let procMemory: number | undefined;
          let procUptime: number | undefined;

          if (activeDeploy?.containerName) {
            if (project.deploymentType === "pm2") {
              const matchedPm2 = pm2Processes.find(
                (p) => p.name === activeDeploy.containerName || p.name === `vg-adopted-${project.name}` || p.name === project.name
              );
              if (matchedPm2 && matchedPm2.status === "online") {
                isRunning = true;
                procCpu = matchedPm2.cpu;
                procMemory = matchedPm2.memory;
                procUptime = matchedPm2.uptime;
              }
            } else {
              try {
                isRunning = await inspectContainer(activeDeploy.containerName);
              } catch {
                isRunning = false;
              }
            }
          }

          let healthStatus: ApplicationStatus["status"] = "uninitialized";
          if (activeDeploy) {
            if (isRunning) {
              healthStatus = "healthy";
              healthyAppsCount++;
            } else {
              healthStatus = activeDeploy.status === "DEPLOYING" ? "degraded" : "stopped";
            }
          }

          // Build diagnostics message
          let diagnosticMessage = "";
          if (!activeDeploy) {
            diagnosticMessage = "[ NOT DEPLOYED ] Project registered; initial deployment required to activate auto-deploy";
          } else if (isCommitSynced) {
            diagnosticMessage = `[ OK ] Auto-deploying on push to ${project.branch}; synced with commit ${latestCommit?.sha.slice(0, 7) || "latest"}`;
          } else if (latestCommit?.sha) {
            diagnosticMessage = `[ PENDING DEPLOY ] Deployed commit ${deployedSha ? deployedSha.slice(0, 7) : "unknown"} is behind latest commit ${latestCommit.sha.slice(0, 7)} ("${latestCommit.message.slice(0, 40)}")`;
          } else {
            diagnosticMessage = `[ READY ] Auto-deploy enabled for branch ${project.branch} (awaiting initial git clone/fetch)`;
          }

          applications.push({
            projectId: project.id,
            projectName: project.name,
            serviceType: (project.deploymentType as "pm2" | "docker") || "docker",
            branch: project.branch,
            repoUrl: project.repoUrl,
            localPath: project.localPath,
            activePort: activeDeploy?.port ?? project.appPort,
            healthPath: project.healthPath || "/health",
            status: healthStatus,
            healthLatencyMs,
            activeDeployment: activeDeploy
              ? {
                  id: activeDeploy.id,
                  version: activeDeploy.version,
                  color: activeDeploy.color,
                  status: activeDeploy.status,
                  containerName: activeDeploy.containerName,
                  commitSha: activeDeploy.commitSha,
                  commitMessage: activeDeploy.commitMessage,
                  commitAuthor: activeDeploy.commitAuthor,
                  updatedAt: activeDeploy.updatedAt.toISOString(),
                }
              : null,
            latestCommit,
            isCommitSynced,
            autoDeployEnabled: true,
            webhookConfigured: Boolean(project.webhookSecret),
            metrics: {
              cpuPercent: procCpu,
              memoryBytes: procMemory,
              uptime: procUptime,
            },
            diagnosticMessage,
          });
        }
      } catch (err) {
        logger.error({ err }, "StatusOverviewService: failed to aggregate applications status");
      }
    }

    // System Telemetry
    const sysStats = systemMetrics.getStats();
    const systemTelemetry = {
      cpuPercent: sysStats?.cpu_percent ?? 0,
      memoryPercent: sysStats?.memory_percent ?? 0,
      memoryUsed: sysStats?.memory_used ?? 0,
      memoryTotal: sysStats?.memory_total ?? os.totalmem(),
      diskPercent: sysStats?.disk_percent ?? 0,
      diskUsed: sysStats?.disk_used ?? 0,
      diskTotal: sysStats?.disk_total ?? 0,
      loadAvg: sysStats?.load_avg ?? os.loadavg(),
      uptime: sysStats?.uptime ?? os.uptime(),
    };

    const operationalSubsystems = subsystems.filter((s) => s.status === "operational").length;
    const overallStatus =
      !dbConnected
        ? "down"
        : operationalSubsystems < subsystems.length - 2
        ? "degraded"
        : "operational";

    return {
      timestamp,
      overallStatus,
      uptime,
      subsystems,
      applications,
      summary: {
        totalSubsystems: subsystems.length,
        operationalSubsystems,
        totalApplications: applications.length,
        healthyApplications: healthyAppsCount,
        outOfSyncApplications: outOfSyncAppsCount,
        autoDeployActiveCount: applications.length,
      },
      systemTelemetry,
    };
  }

  async checkAndSyncAutoDeploy(options: { projectId?: string; forceDeploy?: boolean } = {}): Promise<{
    checkedCount: number;
    triggeredCount: number;
    results: Array<{
      projectId: string;
      projectName: string;
      branch: string;
      latestCommitSha?: string;
      deployedCommitSha?: string;
      synced: boolean;
      deployTriggered: boolean;
      jobId?: string;
      reason: string;
    }>;
  }> {
    let allProjects: any[] = [];
    try {
      allProjects = options.projectId
        ? [await this.projectRepo.findById(options.projectId)].filter(Boolean)
        : await this.projectRepo.findAll();
    } catch (err) {
      logger.warn({ err }, "checkAndSyncAutoDeploy: database query skipped");
      return { checkedCount: 0, triggeredCount: 0, results: [] };
    }

    const results: Array<{
      projectId: string;
      projectName: string;
      branch: string;
      latestCommitSha?: string;
      deployedCommitSha?: string;
      synced: boolean;
      deployTriggered: boolean;
      jobId?: string;
      reason: string;
    }> = [];

    let triggeredCount = 0;

    for (const project of allProjects) {
      if (!project) continue;
      let defaultEnv: any = null;
      try {
        defaultEnv = await this.envRepo.findDefaultForProject(project.id);
      } catch {
        defaultEnv = null;
      }
      if (!defaultEnv) {
        results.push({
          projectId: project.id,
          projectName: project.name,
          branch: project.branch,
          synced: false,
          deployTriggered: false,
          reason: "No default environment configured",
        });
        continue;
      }

      const activeDeploy = await this.deploymentRepo.findActiveForEnvironment(defaultEnv.id);
      let latestCommit: { sha: string; message: string; author: string; date: string } | null = null;
      try {
        latestCommit = await this.gitService.getLatestCommit(project);
      } catch {
        latestCommit = null;
      }

      const deployedSha = activeDeploy?.commitSha ?? "";
      const latestSha = latestCommit?.sha ?? "";
      const isSynced = Boolean(deployedSha && latestSha && (deployedSha === latestSha || deployedSha.startsWith(latestSha) || latestSha.startsWith(deployedSha)));

      const shouldDeploy = Boolean(options.forceDeploy || (!isSynced && latestSha) || !activeDeploy);

      if (shouldDeploy) {
        try {
          const jobId = await enqueueJob("DEPLOY", project.id, {}, defaultEnv.id);
          triggeredCount++;
          results.push({
            projectId: project.id,
            projectName: project.name,
            branch: project.branch,
            latestCommitSha: latestSha,
            deployedCommitSha: deployedSha,
            synced: isSynced,
            deployTriggered: true,
            jobId,
            reason: options.forceDeploy
              ? "Manual sync requested"
              : !activeDeploy
              ? "Initial deployment enqueued"
              : `New commit ${latestSha.slice(0, 7)} detected (was ${deployedSha.slice(0, 7) || "none"})`,
          });
        } catch (err: any) {
          results.push({
            projectId: project.id,
            projectName: project.name,
            branch: project.branch,
            latestCommitSha: latestSha,
            deployedCommitSha: deployedSha,
            synced: isSynced,
            deployTriggered: false,
            reason: `Failed to enqueue deploy job: ${err?.message || String(err)}`,
          });
        }
      } else {
        results.push({
          projectId: project.id,
          projectName: project.name,
          branch: project.branch,
          latestCommitSha: latestSha,
          deployedCommitSha: deployedSha,
          synced: isSynced,
          deployTriggered: false,
          reason: isSynced ? "Already in sync with latest commit" : "No new commits found",
        });
      }
    }

    return {
      checkedCount: allProjects.length,
      triggeredCount,
      results,
    };
  }
}

export const statusOverviewService = new StatusOverviewService();
