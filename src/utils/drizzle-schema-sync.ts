import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { projectRoot } from "./paths";
import { logger } from "./logger";

export function runDrizzleSchemaSync(options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): void {
  const cwd = options.cwd ?? projectRoot;
  const env = options.env ?? process.env;

  const hasTsConfig = existsSync(join(cwd, "drizzle.config.ts"));
  const hasJsonConfig = existsSync(join(cwd, "drizzle.config.json"));
  const configFlag = hasTsConfig
    ? "--config=drizzle.config.ts"
    : hasJsonConfig
    ? "--config=drizzle.config.json"
    : "";

  logger.info("Syncing database schema with Drizzle Kit...");
  try {
    execSync(`bunx drizzle-kit push ${configFlag}`.trim(), {
      cwd,
      env,
      stdio: "pipe",
    });
    logger.info("Database schema sync complete (Drizzle Kit)");
  } catch {
    logger.error("Drizzle schema sync failed; check database connectivity and schema configuration");
    throw new Error("Drizzle schema sync failed");
  }
}

/** @deprecated Use runDrizzleSchemaSync */
export const runPrismaSchemaSync = runDrizzleSchemaSync;

