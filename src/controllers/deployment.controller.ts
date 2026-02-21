import { FastifyRequest, FastifyReply } from "fastify";
import { DeploymentService } from "../services/deployment.service";
import { RollbackService } from "../services/rollback.service";

const deploymentService = new DeploymentService();
const rollbackService = new RollbackService();

interface DeployBody {
  imageTag: string;
}

export async function deployHandler(
  req: FastifyRequest<{ Body: DeployBody }>,
  reply: FastifyReply
): Promise<void> {
  const { imageTag } = req.body;
  const result = await deploymentService.deploy({ imageTag });
  reply.code(202).send(result);
}

export async function rollbackHandler(
  _req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const result = await rollbackService.rollback();
  reply.code(200).send(result);
}

export async function listDeploymentsHandler(
  _req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const deployments = await deploymentService.getAllDeployments();
  reply.code(200).send({ deployments });
}

export async function statusHandler(
  _req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const active = await deploymentService.getActiveDeployment();
  reply.code(200).send({
    status: active ? "active" : "idle",
    activeDeployment: active ?? null,
  });
}
