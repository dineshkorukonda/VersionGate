import { createHmac, timingSafeEqual } from "crypto";

/**
 * Hop signature from versiongate.tech fan-out.
 * HMAC-SHA256 of `${installationId}.` + rawBody, header `X-VG-Relay-Signature: sha256=<hex>`.
 * Secret must match website RELAY_SECRET / engine GITHUB_STATE_SECRET.
 */
export function verifyRelayHopSignature(
  rawBody: Buffer,
  installationId: string,
  signatureHeader: string | undefined,
  secret: string
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expectedHex = createHmac("sha256", secret)
    .update(`${installationId}.`, "utf8")
    .update(rawBody)
    .digest("hex");
  const expected = `sha256=${expectedHex}`;
  try {
    const a = Buffer.from(signatureHeader, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

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

const DEFAULT_RELAY_ORIGIN = "https://versiongate.tech";

/** Notify the central relay of installation → this instance mapping. */
export async function registerInstallationWithRelay(opts: {
  installationId: string;
  userId: string;
  instanceUrl: string;
  relaySecret: string;
  relayOrigin?: string;
}): Promise<void> {
  const token = signRegisterPayload(
    {
      instanceUrl: opts.instanceUrl.trim().replace(/\/+$/, ""),
      installationId: opts.installationId,
      userId: opts.userId,
      ts: Date.now(),
    },
    opts.relaySecret
  );
  const origin = (opts.relayOrigin ?? DEFAULT_RELAY_ORIGIN).replace(/\/+$/, "");
  const res = await fetch(`${origin}/api/github/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Relay register failed (${res.status}): ${text.slice(0, 200)}`);
  }
}
