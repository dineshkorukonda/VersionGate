import os from "os";
import { getDb } from "../db/client";
import { sql } from "drizzle-orm";
import redisService from "./redis.service";
import { DeploymentRepository } from "../repositories/deployment.repository";
import { inspectContainer } from "../utils/docker";
import { logger } from "../utils/logger";
import { systemMetrics } from "../controllers/system.controller";

export interface EngineHealthAlert {
  id: string;
  type: string;
  message: string;
  severity: "low" | "medium" | "high";
}

export interface EngineHealthReport {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  uptime: number;
  database: { connected: boolean; latencyMs: number };
  redis: { connected: boolean; available: boolean };
  containers: { totalActive: number; healthyCount: number; failedCount: number };
  system: { cpuPercent: number; memoryPercent: number; diskPercent: number };
  alerts: EngineHealthAlert[];
}

const CHECK_INTERVAL_MS = 30_000;

export class EngineHealthMonitorService {
  private readonly repo: DeploymentRepository;
  private timer: ReturnType<typeof setInterval> | undefined;
  private running = false;
  private latestReport: EngineHealthReport = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: os.uptime(),
    database: { connected: false, latencyMs: 0 },
    redis: { connected: false, available: false },
    containers: { totalActive: 0, healthyCount: 0, failedCount: 0 },
    system: { cpuPercent: 0, memoryPercent: 0, diskPercent: 0 },
    alerts: [],
  };

  constructor() {
    this.repo = new DeploymentRepository();
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.tick().catch((err) => {
        logger.error({ err }, "EngineHealthMonitor: unexpected error in tick");
      });
    }, CHECK_INTERVAL_MS);

    this.timer.unref();
    logger.info({ intervalMs: CHECK_INTERVAL_MS }, "EngineHealthMonitor: background service started");
    void this.tick();
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = undefined;
    logger.info("EngineHealthMonitor: stopped");
  }

  getLatestReport(): EngineHealthReport {
    return this.latestReport;
  }

  private async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;

    try {
      const timestamp = new Date().toISOString();
      const uptime = os.uptime();
      const alerts: EngineHealthAlert[] = [];

      // 1. Database Check
      let dbConnected = false;
      let dbLatencyMs = 0;
      if (process.env.DATABASE_URL?.trim()) {
        const startDb = Date.now();
        try {
          const db = getDb();
          await db.execute(sql`SELECT 1`);
          dbConnected = true;
          dbLatencyMs = Date.now() - startDb;
        } catch (err) {
          dbConnected = false;
          alerts.push({
            id: "db_down",
            type: "Database",
            message: "PostgreSQL database connection failed",
            severity: "high",
          });
        }
      }

      // 2. Redis Check
      const redisAvailable = redisService.isAvailable();

      // 3. Container State Audit
      let totalActive = 0;
      let healthyCount = 0;
      let failedCount = 0;

      if (dbConnected) {
        try {
          const activeDeploys = await this.repo.findAllActiveWithProjects();
          totalActive = activeDeploys.length;

          for (const d of activeDeploys) {
            let isRunning = false;
            try {
              isRunning = await inspectContainer(d.containerName);
            } catch {
              isRunning = false;
            }

            if (isRunning) {
              healthyCount++;
            } else {
              failedCount++;
              alerts.push({
                id: `container_failed_${d.id}`,
                type: "Container",
                message: `Container ${d.containerName} (project: ${d.project.name}) is down`,
                severity: "high",
              });
            }
          }
        } catch (err) {
          logger.warn({ err }, "EngineHealthMonitor: container state check warning");
        }
      }

      // 4. System Metrics
      const sysStats = systemMetrics.getStats();
      const cpuPercent = sysStats?.cpu_percent ?? 0;
      const memoryPercent = sysStats?.memory_percent ?? 0;
      const diskPercent = sysStats?.disk_percent ?? 0;

      if (cpuPercent > 90) {
        alerts.push({
          id: "cpu_high",
          type: "System",
          message: `CPU usage high (${cpuPercent.toFixed(1)}%)`,
          severity: "medium",
        });
      }
      if (memoryPercent > 90) {
        alerts.push({
          id: "mem_high",
          type: "System",
          message: `Memory usage high (${memoryPercent.toFixed(1)}%)`,
          severity: "medium",
        });
      }
      if (diskPercent > 90) {
        alerts.push({
          id: "disk_high",
          type: "System",
          message: `Disk usage high (${diskPercent.toFixed(1)}%)`,
          severity: "high",
        });
      }

      // Overall status determination
      const hasHighAlerts = alerts.some((a) => a.severity === "high");
      const status = hasHighAlerts ? "error" : alerts.length > 0 ? "degraded" : "ok";

      this.latestReport = {
        status,
        timestamp,
        uptime,
        database: { connected: dbConnected, latencyMs: dbLatencyMs },
        redis: { connected: redisAvailable, available: redisAvailable },
        containers: { totalActive, healthyCount, failedCount },
        system: { cpuPercent, memoryPercent, diskPercent },
        alerts,
      };

      logger.debug(
        { status, activeContainers: totalActive, healthy: healthyCount, alertsCount: alerts.length },
        "EngineHealthMonitor: tick completed"
      );
    } finally {
      this.running = false;
    }
  }
}

export const engineHealthMonitor = new EngineHealthMonitorService();
