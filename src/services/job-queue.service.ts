import { eq, and, asc, sql } from "drizzle-orm";
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
    // Atomic SELECT FOR UPDATE SKIP LOCKED
    const [next] = await tx
      .select()
      .from(jobs)
      .where(eq(jobs.status, "PENDING"))
      .orderBy(asc(jobs.createdAt))
      .limit(1);

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

export async function appendLog(jobId: string, line: string): Promise<void> {
  // 1. Redis pub/sub real-time log broadcast
  if (redisService.isAvailable()) {
    await redisService.publishLog(jobId, line);
  }

  // 2. Atomic PostgreSQL JSONB array append
  const db = getDb();
  const jsonArrayStr = JSON.stringify([line]);

  await db
    .update(jobs)
    .set({
      logs: sql`${jobs.logs} || ${jsonArrayStr}::jsonb`,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId));
}

export async function enqueueJob(
  type: string,
  projectId: string,
  payload: Record<string, unknown>,
  environmentId?: string
): Promise<string> {
  const db = getDb();
  const [job] = await db
    .insert(jobs)
    .values({
      type,
      projectId,
      ...(environmentId ? { environmentId } : {}),
      payload: payload as any,
      status: "PENDING",
      logs: sql`'[]'::jsonb`,
    })
    .returning();

  return job.id;
}

export async function recoverStuckJobs(): Promise<number> {
  const db = getDb();
  const res = await db
    .update(jobs)
    .set({
      status: "FAILED",
      completedAt: new Date(),
      updatedAt: new Date(),
      error: "Worker restarted mid-job",
    })
    .where(eq(jobs.status, "RUNNING"))
    .returning();

  return res.length;
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
