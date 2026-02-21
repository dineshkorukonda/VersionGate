import { FastifyRequest, FastifyReply } from "fastify";
import { DeploymentService } from "../services/deployment.service";

const deploymentService = new DeploymentService();

interface DeployBody {
  projectId: string;
}

export async function deployHandler(
  req: FastifyRequest<{ Body: DeployBody }>,
  reply: FastifyReply
): Promise<void> {
  const { projectId } = req.body;
  const result = await deploymentService.deploy({ projectId });
  reply.code(202).send(result);
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

export async function cancelDeployHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  const result = await deploymentService.cancelDeploy(req.params.id);
  reply.code(200).send(result);
}
