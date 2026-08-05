import { existsSync } from "fs";
import dotenv from "dotenv";
import { envFilePath } from "../utils/paths";

dotenv.config({ path: envFilePath });

function parseTruthyEnv(key: string, defaultValue: boolean): boolean {
  const raw = process.env[key]?.trim().toLowerCase();
  if (raw === undefined || raw === "") return defaultValue;
  if (["true", "1", "yes", "on"].includes(raw)) return true;
  if (["false", "0", "no", "off"].includes(raw)) return false;
  return defaultValue;
}

function resolveDrizzleSchemaSyncMode(): "migrate" | "push" {
  const raw =
    process.env.DRIZZLE_SCHEMA_SYNC?.trim().toLowerCase() ??
    process.env.PRISMA_SCHEMA_SYNC?.trim().toLowerCase() ??
    "push";
  return raw === "migrate" ? "migrate" : "push";
}

/** Default and normalize so startup, self-update, and spawned CLIs all see an explicit value. */
(() => {
  const mode = resolveDrizzleSchemaSyncMode();
  process.env.DRIZZLE_SCHEMA_SYNC = mode;
})();

/** Docker CLI path: explicit `DOCKER_BIN`, else first existing common path, else `docker` (relies on PATH). */
function resolveDockerBin(): string {
  const fromEnv = process.env.DOCKER_BIN?.trim();
  if (fromEnv) return fromEnv;
  for (const p of ["/usr/bin/docker", "/usr/local/bin/docker", "/snap/bin/docker"]) {
    if (existsSync(p)) return p;
  }
  return "docker";
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function normalizePublicUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

const drizzleSchemaSync = resolveDrizzleSchemaSyncMode();

export const config = {
  port: parseInt(optionalEnv("PORT", "9090"), 10) || 9090,
  logLevel: optionalEnv("LOG_LEVEL", "info"),
  databaseUrl: optionalEnv("DATABASE_URL", ""),
  /**
   * Schema sync mode label for operators. Both values run `drizzle-kit push` today;
   * `migrate` is kept for legacy `.env` files that used Prisma migrate naming.
   */
  drizzleSchemaSync,
  /**
   * When false, the API process does not poll the job queue (use PM2 `versiongate-worker` or `src/worker/index.ts`).
   * Default true for Docker/single-process installs.
   */
  inProcessWorker: parseTruthyEnv("IN_PROCESS_WORKER", true),
  dockerBin: resolveDockerBin(),
  dockerNetwork: optionalEnv("DOCKER_NETWORK", "versiongate-net"),
  nginxConfigPath: optionalEnv("NGINX_CONFIG_PATH", "/etc/nginx/conf.d/upstream.conf"),
  projectsRootPath: optionalEnv("PROJECTS_ROOT_PATH", "/var/versiongate/projects"),
  monixPath: optionalEnv("MONIX_PATH", "/opt/monix"),
  monixPort: parseInt(optionalEnv("MONIX_PORT", "3030"), 10),
  geminiApiKey: optionalEnv("GEMINI_API_KEY", ""),
  geminiModel: optionalEnv("GEMINI_MODEL", "gemini-2.5-pro"),
  validation: {
    healthTimeoutMs: 5000,
    retryDelayMs: 2000,
    maxLatencyMs: 2000,
    maxRetries: 15, // 30 seconds total — accommodates slow-booting apps
  },
  /** Long random string. Enables GET/POST `/api/v1/system/update/*` (Bearer auth). */
  selfUpdateSecret: optionalEnv("SELF_UPDATE_SECRET", "").trim(),
  /** Tracked branch for git fetch/merge (must match your deploy remote). */
  selfUpdateGitBranch: optionalEnv("SELF_UPDATE_GIT_BRANCH", "main"),
  /** If > 0, periodically fetch origin and log or auto-apply (see SELF_UPDATE_AUTO_APPLY). */
  selfUpdatePollMs: Math.max(0, parseInt(optionalEnv("SELF_UPDATE_POLL_MS", "0"), 10) || 0),
  /** When true with SELF_UPDATE_POLL_MS, runs apply when origin is ahead (fast-forward only). */
  selfUpdateAutoApply:
    optionalEnv("SELF_UPDATE_AUTO_APPLY", "").toLowerCase() === "true" ||
    optionalEnv("SELF_UPDATE_AUTO_APPLY", "") === "1",
  /** When true, API startup skips Drizzle schema sync (emergency only — run push manually, then unset). */
  skipMigrateOnBoot:
    optionalEnv("SKIP_MIGRATE_ON_BOOT", "").toLowerCase() === "true" ||
    optionalEnv("SKIP_MIGRATE_ON_BOOT", "") === "1",
  /** Session cookie `Secure` flag — enable when the UI is HTTPS-only. */
  cookieSecure: optionalEnv("COOKIE_SECURE", "").toLowerCase() === "true",

  /** GitHub App (REST + webhooks). PEM may use `\n` escapes in `.env`. */
  githubAppId: optionalEnv("GITHUB_APP_ID", "").trim(),
  githubAppClientId: optionalEnv("GITHUB_APP_CLIENT_ID", "").trim(),
  githubAppPrivateKey: optionalEnv("GITHUB_APP_PRIVATE_KEY", "").replace(/\\n/g, "\n"),
  /** Verifies GitHub App webhook signatures (X-Hub-Signature-256). */
  githubWebhookSecret: optionalEnv("GITHUB_WEBHOOK_SECRET", "").trim(),

  /**
   * Public base URL of this instance (no trailing slash), e.g. `https://vg.example.com`.
   * Required for GitHub App install flow (relay signs `state` with `GITHUB_STATE_SECRET`).
   */
  publicUrl: normalizePublicUrl(optionalEnv("PUBLIC_URL", "")),
  /**
   * Shared with the versiongate.tech install relay — HMAC for GitHub `state` (same value as relay `RELAY_SECRET`).
   */
  githubStateSecret: optionalEnv("GITHUB_STATE_SECRET", "").trim(),
} as const;

/** Live values (updated when .env is patched at runtime). */
export function selfUpdateSecretLive(): string {
  return (process.env.SELF_UPDATE_SECRET ?? "").trim();
}

export function selfUpdateBranchLive(): string {
  const b = (process.env.SELF_UPDATE_GIT_BRANCH ?? config.selfUpdateGitBranch).trim();
  return b || "main";
}

export function selfUpdatePollMsLive(): number {
  const raw = process.env.SELF_UPDATE_POLL_MS;
  const n = raw !== undefined ? parseInt(raw, 10) : config.selfUpdatePollMs;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function selfUpdateAutoApplyLive(): boolean {
  const v = (process.env.SELF_UPDATE_AUTO_APPLY ?? "").toLowerCase();
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return config.selfUpdateAutoApply;
}

export function inProcessWorkerLive(): boolean {
  return parseTruthyEnv("IN_PROCESS_WORKER", config.inProcessWorker);
}
