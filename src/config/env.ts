import dotenv from "dotenv";

dotenv.config();

function require(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  app: {
    port: parseInt(optional("PORT", "3000"), 10),
    env: optional("NODE_ENV", "development"),
    logLevel: optional("LOG_LEVEL", "info"),
  },
  database: {
    url: require("DATABASE_URL"),
  },
  docker: {
    network: optional("DOCKER_NETWORK", "zeroshift-net"),
  },
  nginx: {
    configPath: optional("NGINX_CONFIG_PATH", "/etc/nginx/conf.d/upstream.conf"),
  },
  git: {
    projectsBasePath: optional("PROJECTS_BASE_PATH", "/var/zeroshift/projects"),
    token: optional("GIT_TOKEN", ""),
  },
  validation: {
    healthTimeoutMs: parseInt(optional("HEALTH_TIMEOUT_MS", "5000"), 10),
    retryDelayMs: parseInt(optional("HEALTH_RETRY_DELAY_MS", "2000"), 10),
    maxLatencyMs: parseInt(optional("HEALTH_MAX_LATENCY_MS", "2000"), 10),
    maxRetries: parseInt(optional("HEALTH_MAX_RETRIES", "5"), 10),
  },
} as const;
