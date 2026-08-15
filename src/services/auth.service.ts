import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db/client";
import { users, sessions, apiTokens } from "../db/schema";

const scryptAsync = promisify(scrypt);

const SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60;

export { SESSION_MAX_AGE_SEC };

export const AUTH_MIN_PASSWORD_LENGTH = 10;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(plain, salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [saltHex, hashHex] = parts;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const derived = (await scryptAsync(plain, salt, 64)) as Buffer;
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

export async function createSession(userId: string): Promise<string> {
  const db = getDb();
  const raw = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1000);

  await db.insert(sessions).values({
    tokenHash,
    userId,
    expiresAt,
  });

  return raw;
}

export async function createSessionWithClient(_client: any, userId: string): Promise<string> {
  return createSession(userId);
}

export async function deleteSessionByRawToken(raw: string | undefined): Promise<void> {
  if (!raw) return;
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(raw)));
}

export async function getUserFromSessionToken(
  rawToken: string | undefined
): Promise<{ id: string; email: string } | null> {
  if (!rawToken) return null;
  const db = getDb();
  const tokenHash = hashToken(rawToken);

  const [row] = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      userId: users.id,
      email: users.email,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);

  if (!row) return null;

  if (row.expiresAt < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, row.sessionId));
    return null;
  }

  return { id: row.userId, email: row.email };
}

export function isValidEmail(email: string): boolean {
  const t = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

// ── API Token Management (CI/CD Bearer token auth) ─────────────────────────

export async function createApiToken(
  userId: string,
  name: string
): Promise<{ id: string; name: string; token: string; tokenPrefix: string; createdAt: Date }> {
  const db = getDb();
  const rawBytes = randomBytes(24).toString("hex");
  const rawToken = `vg_live_${rawBytes}`;
  const tokenHash = hashToken(rawToken);
  const tokenPrefix = `vg_live_${rawBytes.slice(0, 6)}...`;

  const [row] = await db
    .insert(apiTokens)
    .values({
      name: name.trim(),
      tokenHash,
      tokenPrefix,
      userId,
    })
    .returning();

  return {
    id: row.id,
    name: row.name,
    token: rawToken,
    tokenPrefix: row.tokenPrefix,
    createdAt: row.createdAt,
  };
}

export async function listApiTokens(
  userId: string
): Promise<Array<{ id: string; name: string; tokenPrefix: string; lastUsedAt: Date | null; createdAt: Date }>> {
  const db = getDb();
  return db
    .select({
      id: apiTokens.id,
      name: apiTokens.name,
      tokenPrefix: apiTokens.tokenPrefix,
      lastUsedAt: apiTokens.lastUsedAt,
      createdAt: apiTokens.createdAt,
    })
    .from(apiTokens)
    .where(eq(apiTokens.userId, userId));
}

export async function revokeApiToken(userId: string, tokenId: string): Promise<boolean> {
  const db = getDb();
  await db
    .delete(apiTokens)
    .where(and(eq(apiTokens.id, tokenId), eq(apiTokens.userId, userId)));
  return true;
}

export async function getUserFromApiToken(
  rawToken: string | undefined
): Promise<{ id: string; email: string } | null> {
  if (!rawToken || !rawToken.startsWith("vg_")) return null;
  const db = getDb();
  const tokenHash = hashToken(rawToken);

  const [row] = await db
    .select({
      tokenId: apiTokens.id,
      expiresAt: apiTokens.expiresAt,
      userId: users.id,
      email: users.email,
    })
    .from(apiTokens)
    .innerJoin(users, eq(apiTokens.userId, users.id))
    .where(eq(apiTokens.tokenHash, tokenHash))
    .limit(1);

  if (!row) return null;

  if (row.expiresAt && row.expiresAt < new Date()) {
    await db.delete(apiTokens).where(eq(apiTokens.id, row.tokenId));
    return null;
  }

  // Update lastUsedAt asynchronously
  db.update(apiTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiTokens.id, row.tokenId))
    .catch(() => null);

  return { id: row.userId, email: row.email };
}
