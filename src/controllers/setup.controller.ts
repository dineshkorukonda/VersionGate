import { FastifyRequest, FastifyReply } from "fastify";
import { execSync } from "child_process";
import { accessSync, constants, existsSync, mkdirSync, readFileSync } from "fs";
import { randomBytes } from "crypto";
import { join } from "path";
import { logger } from "../utils/logger";
import { config } from "../config/env";
import { envFilePath, projectRoot } from "../utils/paths";
import { setupService } from "../services/setup.service";
import { mergeDotenvContent } from "../utils/env-file";
import { notifySetupApplied } from "../services/post-setup-hooks.service";
import {
  AUTH_MIN_PASSWORD_LENGTH,
  isValidEmail,
  SESSION_MAX_AGE_SEC,
} from "../services/auth.service";
import { buildSetSessionCookie } from "../utils/cookie";
import { isValidHostname, isValidIpv4Address } from "../utils/domain-validation";
import { generateVersionGateNginxConf } from "../utils/nginx-versiongate-site";
import { writeNginxConfigFile } from "../utils/nginx-writer";
import { normalizeDatabaseUrl } from "../utils/db-url";

interface SetupApplyBody {
  domain: string;
  databaseUrl: string;
  adminEmail: string;
  adminPassword: string;
  geminiApiKey?: string;
}

const NGINX_SITE_CONF_PATH = "/etc/nginx/conf.d/versiongate.conf";
const NGINX_UPSTREAM_CONF_PATH = "/etc/nginx/conf.d/upstream.conf";
const DB_URL_REGEX = /^DATABASE_URL\s*=\s*"?([^"\n\r]+)"?\s*$/m;
const ENCRYPTION_KEY_REGEX = /^ENCRYPTION_KEY\s*=\s*"?([0-9a-fA-F]{64})"?\s*$/m;

function getEnvPath(): string {
  return envFilePath;
}

function readDatabaseUrl(): string | null {
  const envPath = getEnvPath();
  if (!existsSync(envPath)) return null;

  const content = readFileSync(envPath, "utf-8");
  const match = content.match(DB_URL_REGEX);
  return match ? match[1] : null;
}

function isConfigured(): boolean {
  const dbUrl = process.env.DATABASE_URL?.trim() || readDatabaseUrl();
  return !!dbUrl && dbUrl.length > 0;
}

function readExistingEncryptionKey(): string | null {
  const envPath = getEnvPath();
  if (!existsSync(envPath)) return null;

  const content = readFileSync(envPath, "utf-8");
  const match = content.match(ENCRYPTION_KEY_REGEX);
  return match ? match[1] : null;
}

function resolveProjectsRootPath(): string {
  const preferredPath = "/var/versiongate/projects";
  try {
    mkdirSync(preferredPath, { recursive: true });
    accessSync(preferredPath, constants.W_OK);
    return preferredPath;
  } catch {
    const fallbackPath = join(projectRoot, "projects");
    mkdirSync(fallbackPath, { recursive: true });
    return fallbackPath;
  }
}

interface DbCheckResult {
  ok: boolean;
  error?: string;
}

async function canConnectToDatabase(databaseUrl: string): Promise<DbCheckResult> {
  const postgres = (await import("postgres")).default;
  const client = postgres(databaseUrl, { connect_timeout: 5, max: 1 });
  try {
    await client`SELECT 1`;
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to connect to the provided PostgreSQL instance." };
  } finally {
    await client.end({ timeout: 5 }).catch(() => undefined);
  }
}

export async function getSetupStatusHandler(
  _req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const configured = isConfigured();

  let dbConnected = false;
  if (configured) {
    const dbUrl = process.env.DATABASE_URL?.trim() || readDatabaseUrl();
    if (dbUrl) {
      const normalized = normalizeDatabaseUrl(dbUrl);
      const res = await canConnectToDatabase(normalized);
      dbConnected = res.ok;
    }
  }

  const needsRestart = configured && !process.env.DATABASE_URL?.trim();

  return reply.code(200).send({ configured, dbConnected, needsRestart });
}

export async function applySetupHandler(
  req: FastifyRequest<{ Body: SetupApplyBody }>,
  reply: FastifyReply
): Promise<void> {
  const { domain, databaseUrl, adminEmail, adminPassword, geminiApiKey } = req.body;

  if (!databaseUrl || databaseUrl.trim().length === 0) {
    return reply.code(400).send({ error: "BadRequest", message: "databaseUrl is required" });
  }

  if (!domain || domain.trim().length === 0) {
    return reply.code(400).send({ error: "BadRequest", message: "domain is required" });
  }

  const email =
    typeof adminEmail === "string" ? adminEmail.trim().toLowerCase() : "";
  const password = typeof adminPassword === "string" ? adminPassword : "";
  if (!isValidEmail(email)) {
    return reply.code(400).send({ error: "BadRequest", message: "Invalid admin email" });
  }
  if (password.length < AUTH_MIN_PASSWORD_LENGTH) {
    return reply.code(400).send({
      error: "BadRequest",
      message: `Admin password must be at least ${AUTH_MIN_PASSWORD_LENGTH} characters`,
    });
  }

  const normalizedDomain = domain.trim().toLowerCase();
  const domainIsIp = isValidIpv4Address(normalizedDomain);
  const domainIsHostname = isValidHostname(normalizedDomain);
  if (!domainIsIp && !domainIsHostname) {
    return reply.code(400).send({
      error: "BadRequest",
      message: "domain must be a valid domain name or IPv4 address",
    });
  }

  const existingDatabaseUrl = readDatabaseUrl();
  if (existingDatabaseUrl?.trim() || process.env.DATABASE_URL?.trim()) {
    return reply.code(409).send({
      error: "SetupError",
      message:
        "Setup already has DATABASE_URL in .env. Edit or remove DATABASE_URL manually and restart before re-running the wizard.",
    });
  }

  // 1. Normalize & validate database connection
  const normalizedDbUrl = normalizeDatabaseUrl(databaseUrl);
  logger.info({ rawUrl: databaseUrl, normalizedUrl: normalizedDbUrl }, "Setup: validating database connection…");
  const dbCheck = await canConnectToDatabase(normalizedDbUrl);
  if (!dbCheck.ok) {
    req.log.error("Setup: database connection validation failed");
    return reply.code(422).send({
      statusCode: 422,
      error: "Unprocessable Entity",
      message: "Database connection validation failed.",
      details: dbCheck.error || "Unable to connect to the provided PostgreSQL instance.",
      hint: "Ensure special characters in your password are URL-encoded and SSL is enabled (sslmode=require).",
    });
  }

  // Keep configuration private until schema, admin and session initialization succeed.
  const envPath = getEnvPath();
  const encryptionKey = readExistingEncryptionKey() ?? randomBytes(32).toString("hex");
  const githubStateSecret = process.env.GITHUB_STATE_SECRET?.trim() || "";
  const jwtSecret = process.env.JWT_SECRET?.trim() || randomBytes(32).toString("hex");
  const projectsRootPath = resolveProjectsRootPath();
  const publicUrl = domainIsIp ? `http://${normalizedDomain}:9090` : `https://${normalizedDomain}`;
  const updates: Record<string, string> = {
    DATABASE_URL: normalizedDbUrl, PORT: "9090", NODE_ENV: "production", DOCKER_NETWORK: "versiongate-net",
    NGINX_CONFIG_PATH: NGINX_UPSTREAM_CONF_PATH, PROJECTS_ROOT_PATH: projectsRootPath,
    PUBLIC_DOMAIN: normalizedDomain, PUBLIC_URL: publicUrl, PUBLIC_BASE_PATH: "/",
    ENCRYPTION_KEY: encryptionKey, GITHUB_STATE_SECRET: githubStateSecret, JWT_SECRET: jwtSecret,
  };
  if (geminiApiKey?.trim()) updates.GEMINI_API_KEY = geminiApiKey.trim();
  const envContent = mergeDotenvContent(existsSync(envPath) ? readFileSync(envPath, "utf-8") : "", updates);
  let sessionToken: string;
  try {
    sessionToken = await setupService.initialize({ databaseUrl: normalizedDbUrl, email, password, envContent });
  } catch {
    logger.error("Setup initialization failed; previous configuration retained");
    return reply.code(500).send({ error: "SetupError", message: "Setup initialization failed. Correct the database configuration or admin credentials and retry." });
  }
  Object.assign(process.env, updates);

  notifySetupApplied();

  reply.header(
    "Set-Cookie",
    buildSetSessionCookie(sessionToken, SESSION_MAX_AGE_SEC, config.cookieSecure)
  );

  // 4. Write Nginx config (best-effort)
  try {
    const nginxConf = generateVersionGateNginxConf({
      serverName: domainIsIp ? "_" : normalizedDomain,
      defaultServer: domainIsIp,
      upstreamHost: "127.0.0.1",
      upstreamPort: 9090,
      basePath: "/",
    });
    await writeNginxConfigFile(NGINX_SITE_CONF_PATH, nginxConf);
    if (!existsSync(NGINX_UPSTREAM_CONF_PATH)) {
      await writeNginxConfigFile(
        NGINX_UPSTREAM_CONF_PATH,
        "# Written by VersionGate on production deploy/promote\n"
      );
    }

    try {
      execSync("nginx -t && nginx -s reload", { stdio: "pipe", timeout: 10_000 });
      logger.info("Setup: Nginx configuration applied and reloaded");
    } catch {
      logger.warn("Setup: Nginx config written but reload failed (may need manual reload)");
    }
  } catch {
    logger.warn("Setup: Could not write Nginx config (permission denied — configure manually)");
  }

  return reply.code(200).send({ configured: true });
}
