import { FastifyReply, FastifyRequest } from "fastify";
import { serviceDiscoveryService, AdoptDeploymentInput } from "../services/service-discovery.service";
import { logger } from "../utils/logger";

export async function discoverDeploymentsHandler(
  _req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const candidates = await serviceDiscoveryService.discoverUnmanagedServices();
    return reply.status(200).send({ candidates });
  } catch (err: any) {
    logger.error({ err }, "Failed to discover unmanaged services");
    return reply.status(500).send({ error: "DiscoveryError", message: err?.message });
  }
}

export async function adoptDeploymentHandler(
  req: FastifyRequest<{ Body: AdoptDeploymentInput }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const result = await serviceDiscoveryService.adoptService(req.body);
    return reply.status(201).send(result);
  } catch (err: any) {
    logger.error({ err }, "Failed to adopt service");
    return reply.status(400).send({ error: "AdoptionError", message: err?.message });
  }
}
