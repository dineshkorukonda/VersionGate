import { buildApp } from "./app";
import { config } from "./config/env";
import { logger } from "./utils/logger";
import { runDrizzleSchemaSync } from "./utils/drizzle-schema-sync";
import { disconnectDb } from "./db/client";
import { ReconciliationService } from "./services/reconciliation.service";
import { ContainerMonitorService } from "./services/container-monitor.service";
import { registerAfterSetup } from "./services/post-setup-hooks.service";
import { systemMetrics } from "./controllers/system.controller";
import { kickSelfUpdatePoll, stopSelfUpdatePoll } from "./services/self-update-poll.service";

import { engineHealthMonitor } from "./services/engine-monitor.service";

function databaseUrlLive(): string {
  return process.env.DATABASE_URL?.trim() ?? "";
}

async function start(): Promise<void> {
  const app = await buildApp();
  const monitor = new ContainerMonitorService();

  registerAfterSetup(() => {
    if (!databaseUrlLive()) return;
    monitor.start();
    engineHealthMonitor.start();
    void (async () => {
      try {
        const reconciliation = new ReconciliationService();
        const report = await reconciliation.reconcile();
        logger.info(report, "Post-setup reconciliation complete");
      } catch (err) {
        logger.warn({ err }, "Post-setup reconciliation failed");
      }
    })();
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "Shutting down");
    stopSelfUpdatePoll();
    systemMetrics.stop();
    engineHealthMonitor.stop();
    monitor.stop();
    await app.close();
    await disconnectDb();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  try {
    const PORT = config.port || 9090;

    if (databaseUrlLive()) {
      if (config.skipMigrateOnBoot) {
        logger.error(
          "SKIP_MIGRATE_ON_BOOT is set — skipped schema sync at startup."
        );
      } else {
        try {
          logger.info("Applying database migrations…");
          runDrizzleSchemaSync();

          try {
            const reconciliation = new ReconciliationService();
            const report = await reconciliation.reconcile();
            logger.info(report, "Startup reconciliation complete");
          } catch (err) {
            logger.warn({ err }, "Startup reconciliation failed");
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logger.warn(
            { err: message },
            "Database unavailable on boot — entering Setup Mode. Complete setup at /setup"
          );
        }
      }
    } else {
      logger.warn("DATABASE_URL not set — entering Setup Mode on port 9090");
    }

    await app.listen({ port: PORT, host: "0.0.0.0" });
    try {
      const srv = app.server as import("node:net").Server & { setMaxListeners?: (n: number) => void };
      srv.setMaxListeners?.(48);
    } catch {
      /* ignore */
    }
    logger.info(
      {
        port: PORT,
        dockerNetwork: config.dockerNetwork,
        nginxConfigPath: config.nginxConfigPath,
        projectsRootPath: config.projectsRootPath,
      },
      "VersionGate Engine is running"
    );

    if (databaseUrlLive()) {
      monitor.start();
      engineHealthMonitor.start();
    } else {
      logger.warn("DATABASE_URL not set — container monitor disabled until database is configured");
    }
    systemMetrics.start();

    if (!databaseUrlLive()) {
      logger.info("Setup wizard available at http://0.0.0.0:" + PORT + "/setup");
    }

    kickSelfUpdatePoll();
  } catch (err) {
    logger.fatal({ err }, "Failed to start server");
    await disconnectDb();
    process.exit(1);
  }
}

start();
