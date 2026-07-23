import { execSync } from "child_process";
import { projectRoot } from "./paths";
import { logger } from "./logger";

export type PrismaSchemaSyncMode = "migrate" | "push";

const DEFAULT_TIMEOUT_MS = 180_000;
const MAX_P3009_HEAL_ROUNDS = 5;

type ExecSyncError = Error & { status?: number; stderr?: string; stdout?: string };

function errorText(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  const x = e as ExecSyncError;
  const parts = [e.message];
  if (typeof x.stderr === "string" && x.stderr.trim()) parts.push(x.stderr);
  if (typeof x.stdout === "string" && x.stdout.trim()) parts.push(x.stdout);
  return parts.join("\n");
}

function execSyncWithLogs(command: string, opts: { cwd: string; env: NodeJS.ProcessEnv; timeout: number }): void {
  try {
    execSync(command, {
      cwd: opts.cwd,
      env: opts.env,
      timeout: opts.timeout,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e: unknown) {
    const x = e as ExecSyncError;
    if (typeof x.stderr === "string" && x.stderr.trim()) {
      logger.error({ stderr: x.stderr.trimEnd().slice(-12_000) }, `${command} stderr`);
    }
    if (typeof x.stdout === "string" && x.stdout.trim()) {
      logger.error({ stdout: x.stdout.trimEnd().slice(-8000) }, `${command} stdout`);
    }
    throw e;
  }
}

/** Neon pooled hosts include `-pooler.`; Prisma migrate needs a session-capable host for `pg_advisory_lock`. */
const NEON_POOLER_MARKER = "-pooler.";

/**
 * If `DATABASE_URL` points at a Neon pooler host, derive the usual direct hostname by dropping `-pooler.`.
 * Returns null when not applicable or parse fails. Explicit `DIRECT_DATABASE_URL` always wins (see {@link envForMigrateDeploy}).
 */
export function tryInferNeonDirectDatabaseUrl(poolerDatabaseUrl: string): string | null {
  try {
    const trimmed = poolerDatabaseUrl.trim();
    if (!trimmed) return null;
    const usePostgresqlScheme = /^postgresql:/i.test(trimmed);
    const normalized = trimmed.replace(/^postgresql:/i, "postgres:");
    if (!/^postgres:/i.test(normalized)) return null;
    const u = new URL(normalized);
    const host = u.hostname;
    if (!host.toLowerCase().includes("neon.tech")) return null;
    const p = host.indexOf(NEON_POOLER_MARKER);
    if (p === -1) return null;
    u.hostname = `${host.slice(0, p)}.${host.slice(p + NEON_POOLER_MARKER.length)}`;
    let out = u.toString();
    if (usePostgresqlScheme) out = out.replace(/^postgres:/i, "postgresql:");
    return out;
  } catch {
    return null;
  }
}

/** Prisma Migrate needs a real DB session for advisory locks — Neon pooler URLs often hit P1002. */
export function envForMigrateDeploy(base: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const explicitDirect = base.DIRECT_DATABASE_URL?.trim();
  if (explicitDirect) {
    return { ...base, DATABASE_URL: explicitDirect };
  }
  const pooler = base.DATABASE_URL?.trim();
  if (!pooler) return base;
  const inferred = tryInferNeonDirectDatabaseUrl(pooler);
  if (!inferred) return base;
  return { ...base, DATABASE_URL: inferred };
}

/** Migration folder names cited in P3009 / P3018 messages. */
export function extractFailedMigrationNames(message: string): string[] {
  const names = new Set<string>();
  const re =
    /(?:The\s+)?`([0-9]{14}_[A-Za-z0-9_]+)`\s+migration(?:\s+started|\s+failed|[\s\S]*?failed)?/gi;
  for (const m of message.matchAll(re)) {
    names.add(m[1]);
  }
  // Fallback: Migration name: foo
  for (const m of message.matchAll(/Migration name:\s*([0-9]{14}_[A-Za-z0-9_]+)/gi)) {
    names.add(m[1]);
  }
  return [...names];
}

function markMigrationsApplied(
  names: string[],
  opts: { cwd: string; env: NodeJS.ProcessEnv; timeout: number }
): void {
  for (const name of names) {
    logger.warn(
      { migration: name },
      "Auto-healing failed Prisma migration — marking as applied (schema usually already synced via prior db push / partial apply)"
    );
    try {
      execSyncWithLogs(`bunx prisma migrate resolve --applied ${name}`, opts);
    } catch (e: unknown) {
      const msg = errorText(e);
      // Already applied is fine; keep going.
      if (/\bP3008\b/i.test(msg) || /already recorded as applied/i.test(msg)) {
        logger.info({ migration: name }, "Migration already marked applied — continuing");
        continue;
      }
      throw e;
    }
  }
}

function healFailedMigrationsThenDeploy(opts: {
  cwd: string;
  migrateEnv: NodeJS.ProcessEnv;
  appEnv: NodeJS.ProcessEnv;
  timeout: number;
  firstErr: unknown;
}): void {
  let lastErr: unknown = opts.firstErr;
  for (let round = 0; round < MAX_P3009_HEAL_ROUNDS; round++) {
    const msg = errorText(lastErr);
    if (!/\bP3009\b/i.test(msg) && !/\bfailed migrations\b/i.test(msg)) {
      break;
    }
    const names = extractFailedMigrationNames(msg);
    if (names.length === 0) {
      logger.error("P3009 without a parseable migration name — cannot auto-heal");
      break;
    }
    markMigrationsApplied(names, {
      cwd: opts.cwd,
      env: opts.migrateEnv,
      timeout: opts.timeout,
    });
    try {
      execSyncWithLogs("bunx prisma migrate deploy", {
        cwd: opts.cwd,
        env: opts.migrateEnv,
        timeout: opts.timeout,
      });
      logger.info("Database migrations applied after auto-heal (prisma migrate deploy)");
      return;
    } catch (e: unknown) {
      lastErr = e;
    }
  }

  // Schema may already match from an earlier push / partial apply — sync then baseline remaining history.
  logger.warn(
    { err: errorText(lastErr) },
    "migrate deploy still blocked — syncing schema with db push, then resolving any remaining failed migrations"
  );
  execSyncWithLogs("bunx prisma db push --accept-data-loss", {
    cwd: opts.cwd,
    env: opts.appEnv,
    timeout: opts.timeout,
  });

  try {
    execSyncWithLogs("bunx prisma migrate deploy", {
      cwd: opts.cwd,
      env: opts.migrateEnv,
      timeout: opts.timeout,
    });
    logger.info("Database migrations applied after db push heal");
    return;
  } catch (e: unknown) {
    const msg = errorText(e);
    if (/\bP3009\b/i.test(msg) || /\bfailed migrations\b/i.test(msg)) {
      const names = extractFailedMigrationNames(msg);
      if (names.length > 0) {
        markMigrationsApplied(names, {
          cwd: opts.cwd,
          env: opts.migrateEnv,
          timeout: opts.timeout,
        });
        execSyncWithLogs("bunx prisma migrate deploy", {
          cwd: opts.cwd,
          env: opts.migrateEnv,
          timeout: opts.timeout,
        });
        logger.info("Database migrations applied after resolve + deploy following db push");
        return;
      }
    }
    throw e;
  }
}

/**
 * Applies Prisma schema changes: prefer `migrate deploy` (versioned migrations in repo),
 * with automatic heal for failed migration history (P3009) so self-update does not require SSH.
 */
export function runPrismaSchemaSync(options: {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  mode?: PrismaSchemaSyncMode;
  timeoutMs?: number;
  /** When true, do not fall back to db push / auto-heal if migrate deploy fails */
  strictMigrate?: boolean;
}): void {
  const cwd = options.cwd ?? projectRoot;
  const env = options.env ?? process.env;
  const mode = options.mode ?? "migrate";
  const timeout = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const strict = options.strictMigrate ?? false;

  if (mode === "push") {
    logger.info("Database schema sync: prisma db push (PRISMA_SCHEMA_SYNC=push)");
    execSyncWithLogs("bunx prisma db push --accept-data-loss", {
      cwd,
      env,
      timeout,
    });
    return;
  }

  const migrateEnv = envForMigrateDeploy(env);
  if (env.DIRECT_DATABASE_URL?.trim()) {
    logger.info("prisma migrate deploy: using DIRECT_DATABASE_URL as DATABASE_URL (avoids pooler advisory-lock timeouts)");
  } else if (migrateEnv.DATABASE_URL !== env.DATABASE_URL) {
    logger.info(
      "prisma migrate deploy: inferred Neon direct URL from pooler DATABASE_URL (dropped `-pooler.` host label). Set DIRECT_DATABASE_URL in .env if your project uses a different direct endpoint."
    );
  }

  try {
    execSyncWithLogs("bunx prisma migrate deploy", {
      cwd,
      env: migrateEnv,
      timeout,
    });
    logger.info("Database migrations applied (prisma migrate deploy)");
    return;
  } catch (firstErr: unknown) {
    const msg = errorText(firstErr);
    if (strict) {
      throw firstErr;
    }

    // P3009: failed row in _prisma_migrations — auto resolve + retry (common after setup push fallback).
    if (/\bP3009\b/i.test(msg) || /\bfailed migrations\b/i.test(msg)) {
      healFailedMigrationsThenDeploy({
        cwd,
        migrateEnv,
        appEnv: env,
        timeout,
        firstErr,
      });
      return;
    }

    // P1002 on pooler: retry once on migrate env (direct); if still failing, push then continue.
    if (/\bP1002\b/i.test(msg) || /advisory lock/i.test(msg)) {
      logger.warn(
        { err: msg },
        "prisma migrate deploy hit advisory-lock timeout — retrying once on direct URL, then db push if needed"
      );
      try {
        execSyncWithLogs("bunx prisma migrate deploy", {
          cwd,
          env: migrateEnv,
          timeout: Math.max(timeout, 180_000),
        });
        logger.info("Database migrations applied on retry (prisma migrate deploy)");
        return;
      } catch (retryErr: unknown) {
        logger.warn(
          { err: errorText(retryErr) },
          "migrate deploy still timing out — falling back to prisma db push so upgrades are not blocked"
        );
        execSyncWithLogs("bunx prisma db push --accept-data-loss", {
          cwd,
          env,
          timeout,
        });
        logger.warn("Database schema synced via prisma db push fallback (advisory lock)");
        return;
      }
    }

    // P3005 = DB never baselined for Migrate; push would emit wrong one-shot DDL without backfills.
    if (/\bP3005\b/i.test(msg) || /baseline an existing production database/i.test(msg)) {
      logger.error(
        { err: msg },
        "prisma migrate deploy failed (baseline required). Not using db push fallback — see docs/database-migrations.md"
      );
      throw firstErr;
    }

    if (/\bP1001\b/i.test(msg)) {
      logger.error({ err: msg }, "prisma migrate deploy failed (database unreachable)");
      throw firstErr;
    }

    logger.warn(
      { err: msg },
      "prisma migrate deploy failed — falling back to prisma db push (legacy or drifted database)"
    );
    execSyncWithLogs("bunx prisma db push --accept-data-loss", {
      cwd,
      env,
      timeout,
    });
    logger.warn("Database schema synced via prisma db push fallback");
  }
}
