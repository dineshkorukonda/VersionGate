import fs from "fs/promises";
import path from "path";
import { logger } from "./logger";

const ROUTE_REGEXES = [
  // Express / Fastify / Koa / Hono / NestJS / Router / Gin / etc.
  /(?:\b(?:app|router|fastify|server|hono|route|r|api)\s*\.(?:get|all|use|route)|@(?:Get|Route))\s*\(\s*['"`]([^'"`]+)['"`]/gi,
  // Python Flask / FastAPI: @app.get('/health'), @router.get('/v1/health'), path('health/', ...)
  /@(?:app|router|api)\s*\.(?:get|route)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
  // Go Gin / Chi / Echo / Fiber: .GET("/health", ...), .Handle("/health", ...)
  /\.(?:GET|Get|Handle|HandleFunc|Route)\s*\(\s*['"`]([^'"`]+)['"`]/g,
];

const HEALTH_CANDIDATE_ORDER = [
  "/health",
  "/api/health",
  "/v1/health",
  "/api/v1/health",
  "/v2/health",
  "/api/v2/health",
  "/healthz",
  "/live",
  "/livez",
  "/ready",
  "/readyz",
  "/alive",
  "/ping",
  "/status",
  "/api/status",
  "/v1/status",
  "/api/v1/status",
  "/up",
  "/api",
  "/v1",
  "/api/v1",
  "/version",
  "/info",
  "/",
];

/**
 * Scans source directory files to detect declared HTTP routes and returns the best health check endpoint.
 */
export async function detectHealthPathFromDir(dirPath: string): Promise<string | undefined> {
  try {
    const stat = await fs.stat(dirPath).catch(() => null);
    if (!stat || !stat.isDirectory()) return undefined;

    const detectedRoutes = new Set<string>();

    const scanFiles = async (currentDir: string, depth: number): Promise<void> => {
      if (depth > 3) return;
      const entries = await fs.readdir(currentDir, { withFileTypes: true }).catch(() => []);
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (
            entry.name.startsWith(".") ||
            entry.name === "node_modules" ||
            entry.name === "dist" ||
            entry.name === "build" ||
            entry.name === ".git" ||
            entry.name === "coverage"
          ) {
            continue;
          }
          await scanFiles(path.join(currentDir, entry.name), depth + 1);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if ([".ts", ".js", ".mjs", ".cjs", ".py", ".go", ".rs", ".rb", ".php"].includes(ext)) {
            try {
              const content = await fs.readFile(path.join(currentDir, entry.name), "utf-8");
              if (content.length > 500_000) continue; // Skip huge generated files

              for (const rx of ROUTE_REGEXES) {
                rx.lastIndex = 0;
                let match: RegExpExecArray | null;
                while ((match = rx.exec(content)) !== null) {
                  const rawPath = (match[1] || "").trim();
                  if (rawPath && rawPath.startsWith("/")) {
                    detectedRoutes.add(rawPath);
                  } else if (rawPath && !rawPath.includes("://") && !rawPath.includes(" ")) {
                    detectedRoutes.add(`/${rawPath}`);
                  }
                }
              }
            } catch {
              // Ignore file read error
            }
          }
        }
      }
    };

    await scanFiles(dirPath, 1);

    if (detectedRoutes.size === 0) {
      return undefined;
    }

    // Match against priority candidates
    for (const cand of HEALTH_CANDIDATE_ORDER) {
      if (detectedRoutes.has(cand)) {
        logger.info({ dirPath, detectedPath: cand }, "Auto-detected health path from codebase source");
        return cand;
      }
    }

    // Check partial matches (e.g. routes ending in /health or /ping)
    for (const route of detectedRoutes) {
      if (
        route.endsWith("/health") ||
        route.endsWith("/healthz") ||
        route.endsWith("/ping") ||
        route.endsWith("/status") ||
        route.endsWith("/live")
      ) {
        logger.info({ dirPath, detectedPath: route }, "Auto-detected partial health path from codebase source");
        return route;
      }
    }

    // If root route is defined
    if (detectedRoutes.has("/")) {
      return "/";
    }

    return undefined;
  } catch {
    return undefined;
  }
}
