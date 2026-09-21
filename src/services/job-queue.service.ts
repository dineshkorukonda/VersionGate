import { eq, and, asc, sql, lt, gte } from "drizzle-orm";
import { getDb } from "../db/client";
import { jobs, projects, environments, JobSelect, ProjectSelect, EnvironmentSelect } from "../db/schema";
import redisService from "./redis.service";

export type JobWithDetails = JobSelect & {
  project: ProjectSelect;
  environment: EnvironmentSelect | null;
};

export async function claimNextJob(): Promise<JobWithDetails | null> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [next] = await tx
      .select()
      .from(jobs)
      .where(eq(jobs.status, "PENDING"))
      .orderBy(asc(jobs.createdAt))
      .limit(1)
      .for("update", { skipLocked: true });

    if (!next) return null;

    const [updated] = await tx
      .update(jobs)
      .set({ status: "RUNNING", startedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(jobs.id, next.id), eq(jobs.status, "PENDING")))
      .returning();

    if (!updated) return null;

    const [project] = await tx.select().from(projects).where(eq(projects.id, updated.projectId)).limit(1);
    if (!project) return null;

    let environment: EnvironmentSelect | null = null;
    if (updated.environmentId) {
      const [env] = await tx.select().from(environments).where(eq(environments.id, updated.environmentId)).limit(1);
      environment = env ?? null;
    }

    return {
      ...updated,
      project,
      environment,
    };
  });
}

export async function completeJob(jobId: string, result: unknown): Promise<JobSelect> {
  const db = getDb();
  const [updated] = await db
    .update(jobs)
    .set({
      status: "COMPLETE",
      completedAt: new Date(),
      updatedAt: new Date(),
      result: result as any,
    })
    .where(eq(jobs.id, jobId))
    .returning();

  return updated;
}

export async function failJob(jobId: string, error: string): Promise<JobSelect> {
  const db = getDb();
  const [updated] = await db
    .update(jobs)
    .set({
      status: "FAILED",
      completedAt: new Date(),
      updatedAt: new Date(),
      error,
    })
    .where(eq(jobs.id, jobId))
    .returning();

  return updated;
}

/** Cap stored job logs to prevent unbounded JSONB growth on long deploys. */
export const MAX_JOB_LOG_LINES = 5000;

export async function appendLog(jobId: string, line: string): Promise<void> {
  // 1. Redis pub/sub real-time log broadcast
  if (redisService.isAvailable()) {
    await redisService.publishLog(jobId, line);
  }

  // 2. Atomic PostgreSQL JSONB append with tail retention
  const db = getDb();
  const jsonArrayStr = JSON.stringify([line]);

  await db.execute(sql`
    UPDATE "Job"
    SET logs = (
      SELECT COALESCE(jsonb_agg(trimmed.line ORDER BY trimmed.idx), '[]'::jsonb)
      FROM (
        SELECT line, idx
        FROM (
          SELECT value AS line, row_number() OVER () AS idx
          FROM jsonb_array_elements("Job".logs || ${jsonArrayStr}::jsonb)
        ) combined
        ORDER BY idx DESC
        LIMIT ${MAX_JOB_LOG_LINES}
      ) trimmed
    ),
    "updatedAt" = NOW()
    WHERE id = ${jobId}
  `);
}

export async function enqueueJob(
  type: string,
  projectId: string,
  payload: Record<string, unknown>,
  environmentId?: string
): Promise<string> {
  const db = getDb();
  const now = new Date();
  const [job] = await db
    .insert(jobs)
    .values({
      type,
      projectId,
      ...(environmentId ? { environmentId } : {}),
      payload: payload as any,
      status: "PENDING",
      logs: sql`'[]'::jsonb`,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return job.id;
}

/** Jobs running longer than this are marked failed instead of re-queued on restart. */
export const STALE_RUNNING_JOB_MS = 2 * 60 * 60 * 1000;

export async function recoverStuckJobs(staleAfterMs = STALE_RUNNING_JOB_MS): Promise<number> {
  const db = getDb();
  const now = new Date();
  const staleCutoff = new Date(now.getTime() - staleAfterMs);

  const failed = await db
    .update(jobs)
    .set({
      status: "FAILED",
      completedAt: now,
      updatedAt: now,
      error: "Job exceeded maximum runtime and was stopped during worker restart",
    })
    .where(and(eq(jobs.status, "RUNNING"), lt(jobs.startedAt, staleCutoff)))
    .returning();

  const requeued = await db
    .update(jobs)
    .set({
      status: "PENDING",
      startedAt: null,
      updatedAt: now,
      error: null,
    })
    .where(and(eq(jobs.status, "RUNNING"), gte(jobs.startedAt, staleCutoff)))
    .returning();

  return failed.length + requeued.length;
}

export async function cancelPendingJob(jobId: string): Promise<boolean> {
  const db = getDb();
  const r = await db
    .update(jobs)
    .set({
      status: "CANCELLED",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.id, jobId), eq(jobs.status, "PENDING")))
    .returning();

  return r.length === 1;
}
