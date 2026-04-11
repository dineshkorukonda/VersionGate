import type { FastifyReply, FastifyRequest } from "fastify";
import { runPreflightChecks } from "../services/preflight.service";

export async function preflightHandler(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const report = await runPreflightChecks();
  reply.code(200).send(report);
}
