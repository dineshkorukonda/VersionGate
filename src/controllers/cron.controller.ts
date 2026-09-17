import { FastifyReply, FastifyRequest } from "fastify";
import { cronRepository } from "../repositories/cron.repository";
import { cronRunnerService } from "../services/cron-runner.service";
import { serverSpecsService } from "../services/server-specs.service";
import { logger } from "../utils/logger";

interface CreateCronJobBody {
  name: string;
  schedule: string;
  targetType: "HTTP" | "COMMAND";
  httpMethod?: "GET" | "POST" | "PUT";
  httpPath?: string;
  httpHeaders?: Record<string, string>;
  command?: string;
  timeoutSeconds?: number;
  enabled?: boolean;
  projectId?: string;
  environmentId?: string;
}

export async function listCronJobsHandler(
  req: FastifyRequest<{ Querystring: { projectId?: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { projectId } = req.query;
    const cronJobs = projectId
      ? await cronRepository.findByProjectId(projectId)
      : await cronRepository.findAll();
    return reply.status(200).send({ cronJobs });
  } catch (err: any) {
    logger.error({ err }, "Failed to list cron jobs");
    return reply.status(500).send({ error: "Failed to list cron jobs", message: err?.message });
  }
}

export async function getCronJobHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const cronJob = await cronRepository.findById(req.params.id);
    if (!cronJob) {
      return reply.status(404).send({ error: "Cron job not found" });
    }
    return reply.status(200).send({ cronJob });
  } catch (err: any) {
    logger.error({ err, id: req.params.id }, "Failed to get cron job");
    return reply.status(500).send({ error: "Failed to get cron job", message: err?.message });
  }
}

export async function createCronJobHandler(
  req: FastifyRequest<{ Body: CreateCronJobBody }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { name, schedule, targetType, httpMethod, httpPath, httpHeaders, command, timeoutSeconds, enabled, projectId, environmentId } = req.body;

    if (!name?.trim()) {
      return reply.status(400).send({ error: "Name is required" });
    }
    if (!schedule?.trim()) {
      return reply.status(400).send({ error: "Schedule is required" });
    }
    const scheduleParts = schedule.trim().split(/\s+/);
    if (scheduleParts.length !== 5) {
      return reply.status(400).send({ error: "Schedule must be a standard 5-part cron expression (e.g. */15 * * * *)" });
    }

    const created = await cronRepository.create({
      name: name.trim(),
      schedule: schedule.trim(),
      targetType: targetType || "HTTP",
      httpMethod: httpMethod || "GET",
      httpPath: httpPath?.trim() || undefined,
      httpHeaders: httpHeaders || undefined,
      command: command?.trim() || undefined,
      timeoutSeconds: timeoutSeconds || 60,
      enabled: enabled !== false,
      projectId: projectId || undefined,
      environmentId: environmentId || undefined,
    });

    return reply.status(201).send({ cronJob: created });
  } catch (err: any) {
    logger.error({ err }, "Failed to create cron job");
    return reply.status(400).send({ error: "Failed to create cron job", message: err?.message });
  }
}

export async function updateCronJobHandler(
  req: FastifyRequest<{ Params: { id: string }; Body: Partial<CreateCronJobBody> }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const existing = await cronRepository.findById(req.params.id);
    if (!existing) {
      return reply.status(404).send({ error: "Cron job not found" });
    }

    if (req.body.schedule) {
      const scheduleParts = req.body.schedule.trim().split(/\s+/);
      if (scheduleParts.length !== 5) {
        return reply.status(400).send({ error: "Schedule must be a standard 5-part cron expression" });
      }
    }

    const updated = await cronRepository.update(req.params.id, req.body);
    return reply.status(200).send({ cronJob: updated });
  } catch (err: any) {
    logger.error({ err, id: req.params.id }, "Failed to update cron job");
    return reply.status(400).send({ error: "Failed to update cron job", message: err?.message });
  }
}

export async function deleteCronJobHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const deleted = await cronRepository.delete(req.params.id);
    if (!deleted) {
      return reply.status(404).send({ error: "Cron job not found" });
    }
    return reply.status(200).send({ status: "deleted" });
  } catch (err: any) {
    logger.error({ err, id: req.params.id }, "Failed to delete cron job");
    return reply.status(500).send({ error: "Failed to delete cron job", message: err?.message });
  }
}

export async function triggerCronJobHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const result = await cronRunnerService.runJobById(req.params.id);
    return reply.status(200).send(result);
  } catch (err: any) {
    logger.error({ err, id: req.params.id }, "Failed to trigger cron job");
    return reply.status(400).send({ error: "Failed to trigger cron job", message: err?.message });
  }
}

export async function getCronJobLogsHandler(
  req: FastifyRequest<{ Params: { id: string }; Querystring: { limit?: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const logs = await cronRepository.findLogsByJobId(req.params.id, isNaN(limit) ? 50 : limit);
    return reply.status(200).send({ logs });
  } catch (err: any) {
    logger.error({ err, id: req.params.id }, "Failed to get cron job logs");
    return reply.status(500).send({ error: "Failed to get cron job logs", message: err?.message });
  }
}

export async function getServerCapacitySpecsHandler(
  _req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const specs = serverSpecsService.getServerCapacity();
    return reply.status(200).send(specs);
  } catch (err: any) {
    logger.error({ err }, "Failed to get server capacity specs");
    return reply.status(500).send({ error: "Failed to get server capacity", message: err?.message });
  }
}
