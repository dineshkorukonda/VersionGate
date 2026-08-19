import { FastifyRequest, FastifyReply } from "fastify";
import { jobManagementService } from "../services/job-management.service";
import { logger } from "../utils/logger";

export async function getJobHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  const job = await jobManagementService.getJobById(req.params.id);
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

  const res = await jobManagementService.listAllJobs(limit, offset);
  reply.code(200).send(res);
}

export async function listProjectJobsHandler(
  req: FastifyRequest<{ Params: { id: string }; Querystring: { limit?: string; offset?: string } }>,
  reply: FastifyReply
): Promise<void> {
  const limit = Math.min(Math.max(parseInt(req.query.limit ?? "50", 10) || 50, 1), 200);
  const offset = Math.max(parseInt(req.query.offset ?? "0", 10) || 0, 0);

  const res = await jobManagementService.listProjectJobs(req.params.id, limit, offset);
  reply.code(200).send(res);
}

export async function cancelJobHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  const jobId = req.params.id;
  const { success } = await jobManagementService.cancelJob(jobId);
  if (!success) {
    return reply.code(400).send({ error: "BadRequest", message: "Job is not pending or not found" });
  }
  logger.info({ jobId }, "API: pending job cancelled");
  reply.code(200).send({ cancelled: true });
}
