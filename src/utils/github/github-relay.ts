import { createHmac, timingSafeEqual } from "crypto";
import { config } from "../../config/env";

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

function resolveRelayOrigin(explicit?: string): string {
  return (explicit ?? config.githubRelayOrigin ?? DEFAULT_RELAY_ORIGIN).trim().replace(/\/+$/, "");
}

function resolveRelayTimeout(explicit?: number): number {
  return explicit ?? config.githubRelayTimeoutMs ?? 15_000;
}

/** Notify the central relay of installation → this instance mapping. */
export async function registerInstallationWithRelay(opts: {
  installationId: string;
  userId: string;
  instanceUrl: string;
  relaySecret: string;
  relayOrigin?: string;
  timeoutMs?: number;
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
  const origin = resolveRelayOrigin(opts.relayOrigin);
  const timeoutMs = resolveRelayTimeout(opts.timeoutMs);
  const res = await fetch(`${origin}/api/github/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Relay register failed (${res.status}): ${text.slice(0, 200)}`);
  }
}

export interface RelayRepoRow {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  defaultBranch: string;
  cloneUrl: string;
  htmlUrl: string;
  language: string | null;
  updatedAt: string | null;
  pushedAt: string | null;
}

export async function fetchReposFromRelay(opts: {
  installationId: string;
  relaySecret: string;
  relayOrigin?: string;
  timeoutMs?: number;
}): Promise<RelayRepoRow[]> {
  const origin = resolveRelayOrigin(opts.relayOrigin);
  const timeoutMs = resolveRelayTimeout(opts.timeoutMs);
  const sig = createHmac("sha256", opts.relaySecret)
    .update(`repos:${opts.installationId}`, "utf8")
    .digest("hex");

  const res = await fetch(
    `${origin}/api/github/repos?installation_id=${opts.installationId}&sig=${sig}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Relay fetch repos failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { repositories?: RelayRepoRow[] };
  return data.repositories ?? [];
}

export async function fetchBranchesFromRelay(opts: {
  installationId: string;
  owner: string;
  repo: string;
  relaySecret: string;
  relayOrigin?: string;
  timeoutMs?: number;
}): Promise<{ name: string; sha: string | undefined }[]> {
  const origin = resolveRelayOrigin(opts.relayOrigin);
  const timeoutMs = resolveRelayTimeout(opts.timeoutMs);
  const sig = createHmac("sha256", opts.relaySecret)
    .update(`branches:${opts.installationId}:${opts.owner}/${opts.repo}`, "utf8")
    .digest("hex");

  const res = await fetch(
    `${origin}/api/github/repos/${encodeURIComponent(opts.owner)}/${encodeURIComponent(opts.repo)}/branches?installation_id=${opts.installationId}&sig=${sig}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Relay fetch branches failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { branches?: { name: string; sha: string | undefined }[] };
  return data.branches ?? [];
}

export interface RelayProbeResult {
  reachable: boolean;
  status: number;
  latencyMs: number;
  origin: string;
  endpoint: string;
  error?: string;
}

/**
 * Probes central relay reachability and measures round-trip latency.
 * Tries /api/github/health first, then falls back to /api/github/repos probe.
 */
export async function probeRelayReachability(opts?: {
  relayOrigin?: string;
  timeoutMs?: number;
}): Promise<RelayProbeResult> {
  const origin = resolveRelayOrigin(opts?.relayOrigin);
  const timeoutMs = resolveRelayTimeout(opts?.timeoutMs);
  const start = Date.now();

  try {
    // Try health probe first
    const healthRes = await fetch(`${origin}/api/github/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(Math.min(timeoutMs, 6000)),
    });
    const latencyMs = Date.now() - start;
    if (healthRes.ok) {
      return {
        reachable: true,
        status: healthRes.status,
        latencyMs,
        origin,
        endpoint: "/api/github/health",
      };
    }
  } catch {
    // If health route not deployed on older relay, fallback to repos route
  }

  // Fallback probe: GET /api/github/repos (returns 400 Bad Request when healthy without params)
  const probeStart = Date.now();
  try {
    const res = await fetch(`${origin}/api/github/repos`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const latencyMs = Date.now() - probeStart;
    // 400, 200, 401 are valid responses from an active HTTP relay server
    const reachable = res.status > 0 && res.status < 500;
    return {
      reachable,
      status: res.status,
      latencyMs,
      origin,
      endpoint: "/api/github/repos",
    };
  } catch (err) {
    const latencyMs = Date.now() - probeStart;
    return {
      reachable: false,
      status: 0,
      latencyMs,
      origin,
      endpoint: "/api/github/repos",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

