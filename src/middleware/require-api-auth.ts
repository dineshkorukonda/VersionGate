import type { FastifyReply, FastifyRequest } from "fastify";
import { getUserFromSessionToken, getUserFromApiToken } from "../services/auth.service";
import { getSessionTokenFromRequest } from "../utils/cookie";

function pathOnly(url: string): string {
  const i = url.indexOf("?");
  return i === -1 ? url : url.slice(0, i);
}

function isPublicApiPath(path: string): boolean {
  if (path.startsWith("/api/v1/setup/")) return true;
  if (path.startsWith("/api/v1/auth/")) return true;
  if (path.startsWith("/api/v1/webhooks/")) return true;
  if (path.startsWith("/api/webhooks/")) return true;
  if (path.startsWith("/api/auth/github/")) return true;
  if (
    path === "/api/v1/system/update/status" ||
    path === "/api/v1/system/update/apply" ||
    path === "/api/v1/system/update/webhook"
  ) {
    return true;
  }
  return false;
}

export type AuthedRequest = FastifyRequest & {
  authUser?: { id: string; email: string };
};

/**
 * Auth gate for `/api/v1/*` and `/api/github/*` when the database URL is configured.
 * Supports session cookies and API Bearer tokens (`Authorization: Bearer vg_live_...` or `X-API-Token`).
 */
export async function requireApiAuth(req: AuthedRequest, reply: FastifyReply): Promise<void> {
  const path = pathOnly(req.url);
  if (!path.startsWith("/api/v1/") && !path.startsWith("/api/github/")) return;
  if (isPublicApiPath(path)) return;

  if (!process.env.DATABASE_URL?.trim()) {
    await reply.code(503).send({
      error: "ServiceUnavailable",
      message: "Database is not configured. Open /setup to finish installation, or set DATABASE_URL and restart.",
      code: "SETUP_REQUIRED",
    });
    return;
  }

  let user: { id: string; email: string } | null = null;
  try {
    const authHeader = req.headers["authorization"];
    let token: string | undefined;
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.slice(7).trim();
    }
    if (!token) {
      token = req.headers["x-api-token"] as string | undefined;
    }

    if (token && token.startsWith("vg_")) {
      user = await getUserFromApiToken(token);
    } else {
      const rawCookie = getSessionTokenFromRequest(req.headers.cookie);
      user = await getUserFromSessionToken(rawCookie);
    }
  } catch {
    await reply.code(503).send({
      error: "ServiceUnavailable",
      message: "Database unavailable for authentication.",
    });
    return;
  }

  if (!user) {
    await reply.code(401).send({
      error: "Unauthorized",
      message: "Sign in required",
      code: "AUTH_REQUIRED",
    });
    return;
  }

  req.authUser = user;
}
