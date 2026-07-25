import { eq, and, asc, isNotNull, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { environments, deployments, EnvironmentSelect } from "../db/schema";
import redisService from "../services/redis.service";

export const DEFAULT_ENVIRONMENT_NAME = "production";

export class EnvironmentRepository {
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
    // 1. Try Redis Distributed Lock if Redis is available
    if (redisService.isAvailable()) {
      const acquiredRedis = await redisService.acquireLock(`env:${id}`, 900_000); // 15 mins TTL
      if (!acquiredRedis) return false;
    }

    // 2. Database lock update
    const db = getDb();
    // Also auto-expire DB locks older than 15 minutes
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

    const result = await db
      .update(environments)
      .set({ lockedAt: new Date() })
      .where(
        and(
          eq(environments.id, id),
          sql`(${environments.lockedAt} IS NULL OR ${environments.lockedAt} < ${fifteenMinsAgo})`
        )
      )
      .returning();

    return result.length === 1;
  }

  async releaseDeployLock(id: string): Promise<void> {
    if (redisService.isAvailable()) {
      await redisService.releaseLock(`env:${id}`);
    }

    const db = getDb();
    await db
      .update(environments)
      .set({ lockedAt: null })
      .where(eq(environments.id, id));
  }

  async clearStaleDeployLocks(): Promise<number> {
    const db = getDb();
    // Clear locks for environments that have lockedAt set but no DEPLOYING deployments
    const activeDeployingEnvs = db
      .select({ environmentId: deployments.environmentId })
      .from(deployments)
      .where(eq(deployments.status, "DEPLOYING"));

    const result = await db
      .update(environments)
      .set({ lockedAt: null })
      .where(
        and(
          isNotNull(environments.lockedAt),
          sql`${environments.id} NOT IN (${activeDeployingEnvs})`
        )
      )
      .returning();

    return result.length;
  }
}
