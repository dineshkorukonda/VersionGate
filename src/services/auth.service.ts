import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { users, sessions } from "../db/schema";

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
