import { FastifyRequest, FastifyReply } from "fastify";
import { ProjectRepository } from "../repositories/project.repository";
import { EnvironmentRepository } from "../repositories/environment.repository";
import { DeploymentRepository } from "../repositories/deployment.repository";

const projectRepo = new ProjectRepository();
const envRepo = new EnvironmentRepository();
const deploymentRepo = new DeploymentRepository();

interface ProjectParams {
  id: string;
}

/** Stable ordering for default env names (dev → staging → prod); unknown names sort last. */
function chainOrderForEnvironmentName(name: string): number {
  const n = name.trim().toLowerCase();
  if (n === "development" || n === "dev") return 0;
  if (n === "staging") return 1;
  if (n === "production" || n === "prod") return 2;
  return 50;
}

export async function listEnvironmentsHandler(
  req: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply
): Promise<void> {
  const project = await projectRepo.findById(req.params.id);
  if (!project) {
    return reply.code(404).send({ error: "NotFound", message: "Project not found" });
  }

  const rows = await envRepo.findAllForProject(req.params.id);
  const sorted = [...rows].sort((a, b) => {
    const d = chainOrderForEnvironmentName(a.name) - chainOrderForEnvironmentName(b.name);
    if (d !== 0) return d;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  const environments = [];
  for (const e of sorted) {
    const active = await deploymentRepo.findActiveForEnvironment(e.id);
    environments.push({
      id: e.id,
      name: e.name,
      chainOrder: chainOrderForEnvironmentName(e.name),
      branch: e.branch,
      basePort: e.basePort,
      appPort: e.appPort,
      env: (e as typeof e & { env?: Record<string, string> }).env ?? {},
      activeDeployment: active
        ? {
            id: active.id,
            version: active.version,
            imageTag: active.imageTag,
            status: active.status,
            port: active.port,
            color: active.color,
          }
        : null,
    });
  }

  reply.code(200).send({ environments });
}

export async function updateEnvironmentEnvHandler(
  req: FastifyRequest<{ Params: { id: string; envId: string }; Body: { env: Record<string, string> } }>,
  reply: FastifyReply
): Promise<void> {
  const { id: projectId, envId } = req.params;
  const project = await projectRepo.findById(projectId);
  if (!project) {
    return reply.code(404).send({ error: "NotFound", message: "Project not found" });
  }

  const envRow = await envRepo.findById(envId);
  if (!envRow || envRow.projectId !== projectId) {
    return reply.code(404).send({ error: "NotFound", message: "Environment not found" });
  }

  const newEnv = req.body?.env ?? {};
  const updated = await envRepo.updateEnv(envId, newEnv);
  reply.code(200).send({ environment: updated });
}
