import { FastifyRequest, FastifyReply } from "fastify";
import { eq, desc, count } from "drizzle-orm";
import { getDb } from "../db/client";
import { jobs, projects } from "../db/schema";
import { cancelPendingJob } from "../services/job-queue.service";
import { logger } from "../utils/logger";

export async function getJobHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  const db = getDb();
  const [job] = await db.select().from(jobs).where(eq(jobs.id, req.params.id)).limit(1);
  if (!job) {
    return reply.code(404).send({ error: "NotFound", message: "Job not found" });
  }
  reply.code(200).send({ job });
}

export async function listAllJobsHandler(
  req: FastifyRequest<{ Querystring: { limit?: string; offset?: string } }>,
  reply: FastifyReply
): Promise<void> {
  const limit = Math.min(Math.max(parseInt(req.query.limit ?? "50", 10) || 50, 1), 200);
  const offset = Math.max(parseInt(req.query.offset ?? "0", 10) || 0, 0);

  const db = getDb();
  const [countRes] = await db.select({ value: count() }).from(jobs);
  const total = countRes?.value ?? 0;

  const rows = await db
    .select({
      job: jobs,
      project: { id: projects.id, name: projects.name },
    })
    .from(jobs)
    .innerJoin(projects, eq(jobs.projectId, projects.id))
    .orderBy(desc(jobs.createdAt))
    .limit(limit)
    .offset(offset);

  const result = rows.map((r) => ({
    ...r.job,
    project: r.project,
  }));

  reply.code(200).send({ jobs: result, total, limit, offset });
}

export async function listProjectJobsHandler(
  req: FastifyRequest<{ Params: { id: string }; Querystring: { limit?: string; offset?: string } }>,
  reply: FastifyReply
): Promise<void> {
  const limit = Math.min(Math.max(parseInt(req.query.limit ?? "50", 10) || 50, 1), 200);
  const offset = Math.max(parseInt(req.query.offset ?? "0", 10) || 0, 0);

  const db = getDb();
  const [countRes] = await db
    .select({ value: count() })
    .from(jobs)
    .where(eq(jobs.projectId, req.params.id));
  const total = countRes?.value ?? 0;

  const jobRows = await db
    .select()
    .from(jobs)
    .where(eq(jobs.projectId, req.params.id))
    .orderBy(desc(jobs.createdAt))
    .limit(limit)
    .offset(offset);

  reply.code(200).send({ jobs: jobRows, total, limit, offset });
}

export async function cancelJobHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  const jobId = req.params.id;
  const ok = await cancelPendingJob(jobId);
  if (!ok) {
    return reply.code(400).send({ error: "BadRequest", message: "Job is not pending or not found" });
  }
  logger.info({ jobId }, "API: pending job cancelled");
  reply.code(200).send({ cancelled: true });
}
