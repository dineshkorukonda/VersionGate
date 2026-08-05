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
  } catch (err: any) {
    const stderr = err?.stderr?.toString() ?? "";
    const stdout = err?.stdout?.toString() ?? "";
    logger.error({ stderr, stdout }, "Drizzle schema sync failed");
    throw err;
  }
}

/** @deprecated Use runDrizzleSchemaSync */
export const runPrismaSchemaSync = runDrizzleSchemaSync;

