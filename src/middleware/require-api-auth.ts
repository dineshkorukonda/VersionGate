import type { FastifyReply, FastifyRequest } from "fastify";
import { getUserFromSessionToken } from "../services/auth.service";
import { getSessionTokenFromRequest } from "../utils/cookie";

function pathOnly(url: string): string {
  const i = url.indexOf("?");
  return i === -1 ? url : url.slice(0, i);
}

function isPublicApiPath(path: string): boolean {
  if (path.startsWith("/api/v1/setup/")) return true;
  if (path.startsWith("/api/v1/auth/")) return true;
  if (path.startsWith("/api/v1/webhooks/")) return true;
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
 * Session cookie gate for `/api/v1/*` when the database URL is configured.
 * Public paths remain open (setup wizard, login/register, webhooks, CI self-update).
 * Settings are blocked until DATABASE_URL is set so `.env` cannot be edited anonymously.
 */
export async function requireApiAuth(req: AuthedRequest, reply: FastifyReply): Promise<void> {
  const path = pathOnly(req.url);
  if (!path.startsWith("/api/v1/")) return;
  if (isPublicApiPath(path)) return;

  if (!process.env.DATABASE_URL?.trim()) {
    if (path.startsWith("/api/v1/settings/")) {
      await reply.code(503).send({
        error: "ServiceUnavailable",
        message: "Database is not configured. Open /setup to finish installation, or set DATABASE_URL and restart.",
        code: "SETUP_REQUIRED",
      });
      return;
    }
    return;
  }

  let user: { id: string; email: string } | null;
  try {
    const raw = getSessionTokenFromRequest(req.headers.cookie);
    user = await getUserFromSessionToken(raw);
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
