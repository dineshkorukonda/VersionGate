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
    basePort: parseInt(optional("BASE_APP_PORT", "3100"), 10),
  },
  nginx: {
    configPath: optional("NGINX_CONFIG_PATH", "/etc/nginx/conf.d/upstream.conf"),
  },
} as const;
