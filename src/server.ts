import { buildApp } from "./app";
import { config } from "./config/env";
import { logger } from "./utils/logger";
import prisma from "./prisma/client";
import { ReconciliationService } from "./services/reconciliation.service";
import { ContainerMonitorService } from "./services/container-monitor.service";
import { systemMetrics } from "./controllers/system.controller";

async function start(): Promise<void> {
  const app = await buildApp();
  const monitor = new ContainerMonitorService();

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "Shutting down");
    systemMetrics.stop();
    monitor.stop();
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  try {
    const PORT = config.port || 9090;

    // Run reconciliation before accepting requests — cleans up any crashed deploys
    // Skip if database is not configured (setup wizard not completed yet)
    if (config.databaseUrl) {
      try {
        const reconciliation = new ReconciliationService();
        const report = await reconciliation.reconcile();
        logger.info(report, "Startup reconciliation complete");
      } catch (err) {
        logger.warn({ err }, "Startup reconciliation failed (database may not be ready)");
      }
    } else {
      logger.warn("DATABASE_URL not set — skipping startup reconciliation. Complete setup at /setup");
    }

    await app.listen({ port: PORT, host: "0.0.0.0" });
    logger.info(
      {
        port: PORT,
        dockerNetwork: config.dockerNetwork,
        nginxConfigPath: config.nginxConfigPath,
        projectsRootPath: config.projectsRootPath,
      },
      "VersionGate Engine is running"
    );

    monitor.start();
    systemMetrics.start();

    if (!config.databaseUrl) {
      logger.info("Setup wizard available at http://0.0.0.0:" + PORT + "/setup");
    }
  } catch (err) {
    logger.fatal({ err }, "Failed to start server");
    await prisma.$disconnect();
    process.exit(1);
  }
}

start();
