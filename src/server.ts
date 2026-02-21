import { buildApp } from "./app";
import { config } from "./config/env";
import { logger } from "./utils/logger";
import prisma from "./prisma/client";

async function start(): Promise<void> {
  const app = await buildApp();

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "Shutting down");
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  try {
    await app.listen({ port: config.app.port, host: "0.0.0.0" });
    logger.info(
      { port: config.app.port, env: config.app.env },
      "ZeroShift Engine is running"
    );
  } catch (err) {
    logger.fatal({ err }, "Failed to start server");
    await prisma.$disconnect();
    process.exit(1);
  }
}

start();
