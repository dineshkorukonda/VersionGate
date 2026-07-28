import type { FastifyReply, FastifyRequest } from "fastify";
import { count, eq } from "drizzle-orm";
import { config } from "../config/env";
import { logger } from "../utils/logger";
import { getDb } from "../db/client";
import { users } from "../db/schema";
import {
  AUTH_MIN_PASSWORD_LENGTH,
  SESSION_MAX_AGE_SEC,
  createApiToken,
  createSession,
  deleteSessionByRawToken,
  getUserFromSessionToken,
  hashPassword,
  isValidEmail,
  listApiTokens,
  revokeApiToken,
  verifyPassword,
} from "../services/auth.service";
import {
  buildClearSessionCookie,
  buildSetSessionCookie,
  getSessionTokenFromRequest,
} from "../utils/cookie";

export async function authStatusHandler(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    reply.code(200).send({
      databaseReady: false,
      hasUsers: false,
      authenticated: false,
    });
    return;
  }

  try {
    const db = getDb();
    const [res] = await db.select({ value: count() }).from(users);
    const hasUsers = (res?.value ?? 0) > 0;
    const raw = getSessionTokenFromRequest(req.headers.cookie);
    const user = await getUserFromSessionToken(raw);
    reply.code(200).send({
      databaseReady: true,
      hasUsers,
      authenticated: !!user,
      user: user ?? undefined,
    });
  } catch (err) {
    logger.warn({ err }, "authStatus: database error");
    reply.code(200).send({
      databaseReady: true,
      hasUsers: false,
      authenticated: false,
    });
  }
}

interface AuthBody {
  email: string;
  password: string;
}

export async function authRegisterHandler(
  req: FastifyRequest<{ Body: AuthBody }>,
  reply: FastifyReply
): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    reply.code(503).send({ error: "ServiceUnavailable", message: "Database not configured" });
    return;
  }

  const db = getDb();
  const [res] = await db.select({ value: count() }).from(users);
  const userCount = res?.value ?? 0;
  if (userCount > 0) {
    reply.code(403).send({ error: "Forbidden", message: "An admin account already exists" });
    return;
  }

  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!isValidEmail(email)) {
    reply.code(400).send({ error: "ValidationError", message: "Invalid email" });
    return;
  }
  if (password.length < AUTH_MIN_PASSWORD_LENGTH) {
    reply.code(400).send({
      error: "ValidationError",
      message: `Password must be at least ${AUTH_MIN_PASSWORD_LENGTH} characters`,
    });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({ email, passwordHash }).returning();

  const token = await createSession(user.id);
  reply.header("Set-Cookie", buildSetSessionCookie(token, SESSION_MAX_AGE_SEC, config.cookieSecure));
  reply.code(201).send({ user: { id: user.id, email: user.email } });
}

export async function authLoginHandler(
  req: FastifyRequest<{ Body: AuthBody }>,
  reply: FastifyReply
): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    reply.code(503).send({ error: "ServiceUnavailable", message: "Database not configured" });
    return;
  }

  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    reply.code(401).send({ error: "Unauthorized", message: "Invalid email or password" });
    return;
  }

  const token = await createSession(user.id);
  reply.header("Set-Cookie", buildSetSessionCookie(token, SESSION_MAX_AGE_SEC, config.cookieSecure));
  reply.code(200).send({ user: { id: user.id, email: user.email } });
}

export async function authLogoutHandler(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const raw = getSessionTokenFromRequest(req.headers.cookie);
  await deleteSessionByRawToken(raw);
  reply.header("Set-Cookie", buildClearSessionCookie(config.cookieSecure));
  reply.code(200).send({ ok: true });
}

export async function authMeHandler(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const raw = getSessionTokenFromRequest(req.headers.cookie);
  const user = await getUserFromSessionToken(raw);
  if (!user) {
    reply.code(401).send({ authenticated: false });
    return;
  }
  reply.code(200).send({ authenticated: true, user });
}

export async function listApiTokensHandler(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authed = req as FastifyRequest & { authUser?: { id: string; email: string } };
  if (!authed.authUser) {
    reply.code(401).send({ error: "Unauthorized", message: "Sign in required" });
    return;
  }
  const tokens = await listApiTokens(authed.authUser.id);
  reply.code(200).send({ tokens });
}

export async function createApiTokenHandler(
  req: FastifyRequest<{ Body: { name: string } }>,
  reply: FastifyReply
): Promise<void> {
  const authed = req as FastifyRequest & { authUser?: { id: string; email: string } };
  if (!authed.authUser) {
    reply.code(401).send({ error: "Unauthorized", message: "Sign in required" });
    return;
  }
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name) {
    reply.code(400).send({ error: "ValidationError", message: "Token name is required" });
    return;
  }
  const token = await createApiToken(authed.authUser.id, name);
  reply.code(201).send({ token });
}

export async function revokeApiTokenHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  const authed = req as FastifyRequest & { authUser?: { id: string; email: string } };
  if (!authed.authUser) {
    reply.code(401).send({ error: "Unauthorized", message: "Sign in required" });
    return;
  }
  const { id } = req.params;
  await revokeApiToken(authed.authUser.id, id);
  reply.code(200).send({ ok: true });
}
