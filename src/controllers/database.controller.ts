import { FastifyReply, FastifyRequest } from "fastify";
import { databaseProvisioningService } from "../services/database-provisioning.service";
import { logger } from "../utils/logger";

interface CreateDatabaseBody {
  name: string;
  engine: "postgres" | "mysql" | "redis" | "mongodb";
  version?: string;
  databaseName?: string;
  username?: string;
  password?: string;
  linkedProjectId?: string;
}

interface LinkDatabaseBody {
  projectId: string;
  envKey?: string;
}

export async function listDatabasesHandler(
  _req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const databases = await databaseProvisioningService.listAll();
    return reply.status(200).send({ databases });
  } catch (err: any) {
    logger.error({ err }, "Failed to list managed databases");
    return reply.status(500).send({ error: "Failed to list databases", message: err?.message });
  }
}

export async function getDatabaseHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const database = await databaseProvisioningService.getDetails(req.params.id);
    if (!database) {
      return reply.status(404).send({ error: "Database not found" });
    }
    return reply.status(200).send({ database });
  } catch (err: any) {
    logger.error({ err }, "Failed to get managed database");
    return reply.status(500).send({ error: "Failed to get database", message: err?.message });
  }
}

export async function createDatabaseHandler(
  req: FastifyRequest<{ Body: CreateDatabaseBody }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const database = await databaseProvisioningService.provision(req.body);
    return reply.status(201).send({ database });
  } catch (err: any) {
    logger.error({ err }, "Failed to provision database");
    return reply.status(400).send({ error: "Failed to provision database", message: err?.message });
  }
}

export async function startDatabaseHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    await databaseProvisioningService.start(req.params.id);
    return reply.status(200).send({ status: "started" });
  } catch (err: any) {
    logger.error({ err }, "Failed to start database");
    return reply.status(400).send({ error: "Failed to start database", message: err?.message });
  }
}

export async function stopDatabaseHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    await databaseProvisioningService.stop(req.params.id);
    return reply.status(200).send({ status: "stopped" });
  } catch (err: any) {
    logger.error({ err }, "Failed to stop database");
    return reply.status(400).send({ error: "Failed to stop database", message: err?.message });
  }
}

export async function deleteDatabaseHandler(
  req: FastifyRequest<{ Params: { id: string }; Querystring: { dropVolume?: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const dropVolume = req.query.dropVolume === "true";
    const deleted = await databaseProvisioningService.delete(req.params.id, dropVolume);
    if (!deleted) {
      return reply.status(404).send({ error: "Database not found" });
    }
    return reply.status(200).send({ status: "deleted" });
  } catch (err: any) {
    logger.error({ err }, "Failed to delete database");
    return reply.status(400).send({ error: "Failed to delete database", message: err?.message });
  }
}

export async function linkDatabaseHandler(
  req: FastifyRequest<{ Params: { id: string }; Body: LinkDatabaseBody }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const result = await databaseProvisioningService.linkToProject(
      req.params.id,
      req.body.projectId,
      req.body.envKey
    );
    return reply.status(200).send(result);
  } catch (err: any) {
    logger.error({ err }, "Failed to link database to project");
    return reply.status(400).send({ error: "Failed to link database", message: err?.message });
  }
}

export async function unlinkDatabaseHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const result = await databaseProvisioningService.unlinkFromProject(req.params.id);
    return reply.status(200).send(result);
  } catch (err: any) {
    logger.error({ err }, "Failed to unlink database from project");
    return reply.status(400).send({ error: "Failed to unlink database", message: err?.message });
  }
}

export async function getDatabaseLogsHandler(
  req: FastifyRequest<{ Params: { id: string }; Querystring: { tail?: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const tail = req.query.tail ? parseInt(req.query.tail, 10) : 200;
    const result = await databaseProvisioningService.getLogs(req.params.id, isNaN(tail) ? 200 : tail);
    return reply.status(200).send(result);
  } catch (err: any) {
    if (err?.message === "Database not found") {
      return reply.status(404).send({ error: "Database not found" });
    }
    logger.error({ err }, "Failed to get database logs");
    return reply.status(500).send({ error: "Failed to get database logs", message: err?.message });
  }
}
