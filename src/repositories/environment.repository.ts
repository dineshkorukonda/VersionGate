import { eq, and, asc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { DeploymentError } from "../utils/errors";
import { getDb } from "../db/client";
import { environments, EnvironmentSelect } from "../db/schema";
import redisService from "../services/redis.service";

export const DEFAULT_ENVIRONMENT_NAME = "production";

export const DEPLOY_LOCK_TTL_MS = 900_000;

export class EnvironmentRepository {
  private readonly leases = new Map<string, {
    owner: string; redis: boolean; timer: ReturnType<typeof setInterval>; lost: boolean;
  }>();
  async findById(id: string): Promise<EnvironmentSelect | null> {
    const db = getDb();
    const [env] = await db.select().from(environments).where(eq(environments.id, id)).limit(1);
    return env ?? null;
  }

  async findDefaultForProject(projectId: string): Promise<EnvironmentSelect | null> {
    const db = getDb();
    const [env] = await db
      .select()
      .from(environments)
      .where(and(eq(environments.projectId, projectId), eq(environments.name, DEFAULT_ENVIRONMENT_NAME)))
      .limit(1);
    return env ?? null;
  }

  async findByProjectAndName(projectId: string, name: string): Promise<EnvironmentSelect | null> {
    const db = getDb();
    const [env] = await db
      .select()
      .from(environments)
      .where(and(eq(environments.projectId, projectId), eq(environments.name, name)))
      .limit(1);
    return env ?? null;
  }

  async findAllForProject(projectId: string): Promise<EnvironmentSelect[]> {
    const db = getDb();
    return db
      .select()
      .from(environments)
      .where(eq(environments.projectId, projectId))
      .orderBy(asc(environments.createdAt));
  }

  async acquireDeployLock(id: string): Promise<boolean> {
    if (this.leases.has(id)) return false;
    const owner = randomUUID();
    const useRedis = redisService.isAvailable();
    if (useRedis && !await redisService.acquireLock(`env:${id}`, DEPLOY_LOCK_TTL_MS, owner)) return false;
    try {
      const result = await getDb().update(environments)
        .set({ lockedAt: new Date(), lockOwner: owner })
        .where(and(eq(environments.id, id),
          sql`(${environments.lockedAt} IS NULL OR ${environments.lockedAt} < NOW() - INTERVAL '15 minutes')`))
        .returning();
      if (result.length !== 1) {
        if (useRedis) await redisService.releaseLock(`env:${id}`, owner);
        return false;
      }
      const timer = setInterval(() => {
        void this.assertDeployLock(id).catch(() => {
          const lease = this.leases.get(id);
          if (lease?.owner === owner) lease.lost = true;
        });
      }, 30_000);
      timer.unref();
      this.leases.set(id, { owner, redis: useRedis, timer, lost: false });
      return true;
    } catch (err) {
      if (useRedis) await redisService.releaseLock(`env:${id}`, owner);
      throw err;
    }
  }

  /** Renew the lease and reject work after ownership is lost. */
  async assertDeployLock(id: string): Promise<void> {
    const lease = this.leases.get(id);
    if (!lease || lease.lost) throw new DeploymentError("Deployment lock ownership lost");
    const result = await getDb().update(environments)
      .set({ lockedAt: new Date() })
      .where(and(eq(environments.id, id), eq(environments.lockOwner, lease.owner),
        sql`${environments.lockedAt} >= NOW() - INTERVAL '15 minutes'`))
      .returning();
    if (result.length !== 1 || (lease.redis && !await redisService.renewLock(`env:${id}`, lease.owner, DEPLOY_LOCK_TTL_MS))) {
      lease.lost = true;
      throw new DeploymentError("Deployment lock ownership lost");
    }
  }

  async releaseDeployLock(id: string): Promise<void> {
    const lease = this.leases.get(id);
    if (!lease) return;
    clearInterval(lease.timer);
    this.leases.delete(id);
    try {
      await getDb().update(environments).set({ lockedAt: null, lockOwner: null })
        .where(and(eq(environments.id, id), eq(environments.lockOwner, lease.owner)));
    } finally {
      if (lease.redis) await redisService.releaseLock(`env:${id}`, lease.owner);
    }
  }

  async clearStaleDeployLocks(): Promise<number> {
    const result = await getDb().update(environments)
      .set({ lockedAt: null, lockOwner: null })
      .where(sql`${environments.lockedAt} < NOW() - INTERVAL '15 minutes'`)
      .returning();
    return result.length;
  }

  async updateEnv(id: string, env: Record<string, string>): Promise<EnvironmentSelect | null> {
    const db = getDb();
    const [updated] = await db
      .update(environments)
      .set({ env, updatedAt: new Date() })
      .where(eq(environments.id, id))
      .returning();
    return updated ?? null;
  }
}
