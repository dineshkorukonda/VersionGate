import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";

export interface InstallMapping {
  instanceUrl: string;
  userId?: string;
  registeredAt: string;
}

function normalizeInstanceUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function instanceKeyHash(instanceUrl: string): string {
  return createHash("sha256").update(normalizeInstanceUrl(instanceUrl), "utf8").digest("hex").slice(0, 32);
}

export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function installKey(installationId: string | number): string {
  return `vg:install:${installationId}`;
}

function instanceIndexKey(instanceUrl: string): string {
  return `vg:instance:${instanceKeyHash(instanceUrl)}:installs`;
}

export async function setInstallMapping(
  installationId: string | number,
  mapping: { instanceUrl: string; userId?: string }
): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    throw new Error("Redis is not configured (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).");
  }
  const instanceUrl = normalizeInstanceUrl(mapping.instanceUrl);
  const payload: InstallMapping = {
    instanceUrl,
    userId: mapping.userId,
    registeredAt: new Date().toISOString(),
  };
  const id = String(installationId);
  await redis.set(installKey(id), payload);
  await redis.sadd(instanceIndexKey(instanceUrl), id);
}

export async function getInstallMapping(installationId: string | number): Promise<InstallMapping | null> {
  const redis = getRedis();
  if (!redis) return null;
  const raw = await redis.get<InstallMapping | string>(installKey(String(installationId)));
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as InstallMapping;
    } catch {
      return null;
    }
  }
  return raw;
}

export async function deleteInstallMapping(installationId: string | number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const id = String(installationId);
  const existing = await getInstallMapping(id);
  await redis.del(installKey(id));
  if (existing?.instanceUrl) {
    await redis.srem(instanceIndexKey(existing.instanceUrl), id);
  }
}

export function isValidInstanceUrl(instanceUrl: string): boolean {
  const t = instanceUrl.trim();
  if (!t) return false;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    if (!u.hostname) return false;
    return true;
  } catch {
    return false;
  }
}
