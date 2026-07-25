import { execSync } from "child_process";
import { projectRoot } from "./paths";
import { logger } from "./logger";

export function runDrizzleSchemaSync(options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): void {
  const cwd = options.cwd ?? projectRoot;
  const env = options.env ?? process.env;

  logger.info("Syncing database schema with Drizzle Kit...");
  try {
    execSync("bunx drizzle-kit push", {
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

export const runPrismaSchemaSync = runDrizzleSchemaSync;
