/** PM2 must start from the repo root so `.env` resolves (see `src/utils/paths.ts`). */
const cwd = __dirname;

/** PM2 often inherits a minimal PATH; Docker is usually under /usr/bin. */
const pathEnv = ["/usr/local/bin", "/usr/bin", "/bin", process.env.PATH].filter(Boolean).join(":");

module.exports = {
  apps: [
    {
      name: "versiongate-api",
      cwd,
      script: "src/server.ts",
      interpreter: "bun",
      watch: false,
      kill_timeout: 3000,
      listen_timeout: 3000,
      env: { NODE_ENV: "production", PATH: pathEnv, IN_PROCESS_WORKER: "false" },
    },
    {
      name: "versiongate-worker",
      cwd,
      script: "src/worker/index.ts",
      interpreter: "bun",
      watch: false,
      /** Fork mode: single Bun worker process polls the job queue (API sets IN_PROCESS_WORKER=false). */
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production", PATH: pathEnv },
    },
  ],
};
