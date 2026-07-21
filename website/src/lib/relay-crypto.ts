import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies GitHub `X-Hub-Signature-256` (HMAC SHA256 of raw body).
 */
export function verifyGithubWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secret: string
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const receivedHex = signatureHeader.slice("sha256=".length);
  const expectedHex = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(receivedHex, "hex");
    const b = Buffer.from(expectedHex, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Hop signature for fan-out: HMAC-SHA256 hex of `${installationId}.${rawBody}`.
 * Header: `X-VG-Relay-Signature: sha256=<hex>`
 */
export function createRelayHopSignature(rawBody: Buffer, installationId: string, secret: string): string {
  const hex = createHmac("sha256", secret).update(`${installationId}.`, "utf8").update(rawBody).digest("hex");
  return `sha256=${hex}`;
}

export function verifyRelayHopSignature(
  rawBody: Buffer,
  installationId: string,
  signatureHeader: string | undefined,
  secret: string
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = createRelayHopSignature(rawBody, installationId, secret);
  try {
    const a = Buffer.from(signatureHeader, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Signed register body for POST /api/github/register */
export interface RegisterPayload {
  instanceUrl: string;
  installationId: string;
  userId?: string;
  ts: number;
}

function canonicalRegisterJson(p: RegisterPayload): string {
  return JSON.stringify({
    instanceUrl: p.instanceUrl,
    installationId: p.installationId,
    userId: p.userId ?? "",
    ts: p.ts,
  });
}

export function signRegisterPayload(p: RegisterPayload, secret: string): string {
  const body = canonicalRegisterJson(p);
  const sig = createHmac("sha256", secret).update(body, "utf8").digest("hex");
  return Buffer.from(JSON.stringify({ p, sig }), "utf8").toString("base64url");
}

const REGISTER_MAX_AGE_MS = 5 * 60 * 1000;

export function parseRegisterPayload(token: string, secret: string): RegisterPayload | null {
  if (!token || !secret) return null;
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const o = JSON.parse(raw) as { p?: RegisterPayload; sig?: string };
    if (!o.p || typeof o.sig !== "string") return null;
    const body = canonicalRegisterJson(o.p);
    const expected = createHmac("sha256", secret).update(body, "utf8").digest("hex");
    const a = Buffer.from(o.sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    if (Date.now() - o.p.ts > REGISTER_MAX_AGE_MS) return null;
    if (!/^\d+$/.test(o.p.installationId)) return null;
    return o.p;
  } catch {
    return null;
  }
}
