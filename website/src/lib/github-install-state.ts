import { createHmac, timingSafeEqual } from "node:crypto";

const RELAY_STATE_MAX_AGE_MS = 60 * 60 * 1000;

export interface RelayInstallPayload {
  instanceUrl: string;
  userId: string;
  ts: number;
}

function canonicalPayloadJson(p: RelayInstallPayload): string {
  return JSON.stringify({ instanceUrl: p.instanceUrl, userId: p.userId, ts: p.ts });
}

/** Must stay in sync with VersionGate engine `src/utils/github-install-state.ts`. */
export function parseRelayInstallState(state: string | undefined, secret: string): RelayInstallPayload | null {
  if (!state || !secret) return null;
  try {
    const raw = Buffer.from(state, "base64url").toString("utf8");
    const o = JSON.parse(raw) as { p?: RelayInstallPayload; sig?: string };
    if (!o.p || typeof o.sig !== "string") return null;
    const body = canonicalPayloadJson(o.p);
    const expected = createHmac("sha256", secret).update(body, "utf8").digest("hex");
    const a = Buffer.from(o.sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    if (Date.now() - o.p.ts > RELAY_STATE_MAX_AGE_MS) return null;
    return o.p;
  } catch {
    return null;
  }
}
