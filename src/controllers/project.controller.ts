import { FastifyRequest, FastifyReply } from "fastify";
import path from "path";
import { randomBytes } from "crypto";
import { ProjectRepository } from "../repositories/project.repository";
import { DeploymentRepository } from "../repositories/deployment.repository";
import { EnvironmentRepository } from "../repositories/environment.repository";
import { freeHostPort, removeContainer, stopContainer } from "../utils/docker";
import { enqueueJob } from "../services/job-queue.service";
import { config, excludedPortsLive } from "../config/env";
import { logger } from "../utils/logger";
import { validateEnvObject } from "../utils/env";
import { ProjectDomainService } from "../services/project-domain.service";
import { projectAnalyticsService } from "../services/project-analytics.service";
import { isProjectPortRangeSafe, parseExcludedPorts } from "../utils/port-manager";
import { deletePm2App } from "../utils/pm2";

const projectRepo = new ProjectRepository();
const deploymentRepo = new DeploymentRepository();
const envRepo = new EnvironmentRepository();
const projectDomainService = new ProjectDomainService();

interface CreateProjectBody {
  name: string;
  repoUrl: string;
  branch?: string;
  buildContext?: string;
  appPort: number;
  basePort?: number;
  healthPath?: string;
  deploymentType?: string;
  packageManager?: string;
  installCommand?: string;
  buildCommand?: string;
  startCommand?: string;
  env?: Record<string, string>;
}

interface ProjectParams {
  id: string;
}

interface UpdateEnvBody {
  env: Record<string, string>;
}

interface UpdateProjectBody {
  name?: string;
  repoUrl?: string;
  branch?: string;
  buildContext?: string;
  appPort?: number;
  healthPath?: string;
  basePort?: number;
  deploymentType?: string;
  packageManager?: string;
  installCommand?: string;
  buildCommand?: string;
  startCommand?: string;
  env?: Record<string, string>;
}

export async function createProjectHandler(
  req: FastifyRequest<{ Body: CreateProjectBody }>,
  reply: FastifyReply
): Promise<void> {
  const {
    name,
    repoUrl,
    branch = "main",
    buildContext = ".",
    appPort,
    basePort: requestedBasePort,
    healthPath = "/health",
    deploymentType = "docker",
    packageManager = "auto",
    installCommand,
    buildCommand,
    startCommand,
    env = {},
  } = req.body;

  const validDeploymentTypes = ["docker", "pm2"];
  if (deploymentType && !validDeploymentTypes.includes(deploymentType)) {
    return reply.code(400).send({
      error: "ValidationError",
      message: `Invalid deploymentType "${deploymentType}". Supported: ${validDeploymentTypes.join(", ")}`,
    });
  }

  const envError = validateEnvObject(env);
  if (envError) {
    return reply.code(400).send({ error: "ValidationError", message: envError });
  }

  let basePort: number;
  if (requestedBasePort !== undefined && Number.isInteger(requestedBasePort)) {
    const candidate = Number(requestedBasePort);
    const existing = await projectRepo.findAll();
    const existingBasePorts = existing.map((p) => p.basePort);
    const excluded = parseExcludedPorts(excludedPortsLive());
    const check = await isProjectPortRangeSafe(candidate, excluded, existingBasePorts, true);
    if (!check.safe) {
      return reply.code(400).send({
        error: "PortConflictError",
        message: `Requested basePort ${candidate} cannot be used: ${check.reason || "conflict detected"}. Conflicting port: ${check.conflictingPort}`,
        conflictingPort: check.conflictingPort,
      });
    }
    basePort = candidate;
  } else {
    // Auto-assign conflict-free basePort: avoids EXCLUDED_PORTS, existing projects, and host listeners.
    basePort = await projectRepo.getNextBasePort();
  }

  // Unique secret for the GitHub webhook URL — acts as authentication token.
  const webhookSecret = randomBytes(24).toString("hex");

  // localPath is auto-computed — set a placeholder before we have the id.
  // We create the project then update localPath with the generated id.
  const project = await projectRepo.create({
    name,
    repoUrl,
    branch,
    buildContext,
    appPort,
    healthPath,
    basePort,
    webhookSecret,
    deploymentType,
    packageManager,
    installCommand: installCommand?.trim() || null,
    buildCommand: buildCommand?.trim() || null,
    startCommand: startCommand?.trim() || null,
    localPath: "", // temporary; patched below
    env,
  });

  // Patch localPath now that we have the id
  const localPath = path.join(config.projectsRootPath, project.id);
  const updated = await projectRepo.update(project.id, { localPath });

  logger.info({ projectId: updated.id, name: updated.name, deploymentType }, "API: project created");
  reply.code(201).send({ project: updated });
}

export async function listProjectsHandler(
  req: FastifyRequest<{ Querystring?: { summary?: string } }>,
  reply: FastifyReply
): Promise<void> {
  const isSummary = req.query?.summary === "true";
  if (isSummary) {
    const projects = await projectRepo.getProjectsSummary();
    return reply.code(200).send({ projects });
  }
  const projects = await projectRepo.findAll();
  reply.code(200).send({ projects });
}

export async function listProjectsSummaryHandler(
  _req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const projects = await projectRepo.getProjectsSummary();
  reply.code(200).send({ projects });
}

export async function getProjectHandler(
  req: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply
): Promise<void> {
  const project = await projectRepo.findById(req.params.id);
  if (!project) {
    return reply.code(404).send({ error: "NotFound", message: "Project not found" });
  }
  reply.code(200).send({ project });
}

export async function deleteProjectHandler(
  req: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = req.params;
  const project = await projectRepo.findById(id);
  if (!project) {
    return reply.code(404).send({ error: "NotFound", message: "Project not found" });
  }

  const deployments = await deploymentRepo.findAllForProject(id);
  for (const d of deployments) {
    await stopContainer(d.containerName).catch((err) => {
      logger.warn({ err, containerName: d.containerName }, "deleteProject: stop container");
    });
    await removeContainer(d.containerName).catch((err) => {
      logger.warn({ err, containerName: d.containerName }, "deleteProject: remove container");
    });
    if (project.deploymentType === "pm2") {
      await deletePm2App(d.containerName).catch(() => null);
    }
  }
  await freeHostPort(project.basePort).catch(() => null);
  await freeHostPort(project.basePort + 1).catch(() => null);

  await projectDomainService.cleanupProjectDomains(id, project.name);

  await projectRepo.delete(id);
  reply.code(204).send();
}

export async function rollbackProjectHandler(
  req: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply
): Promise<void> {
  const projectId = req.params.id;
  const defaultEnv = await envRepo.findDefaultForProject(projectId);
  if (!defaultEnv) {
    return reply.code(400).send({
      error: "ValidationError",
      message: "Project has no default environment",
    });
  }
  const jobId = await enqueueJob("ROLLBACK", projectId, {}, defaultEnv.id);
  logger.info({ projectId, environmentId: defaultEnv.id, jobId }, "API: rollback enqueued");
  reply.code(202).send({ jobId, status: "PENDING", environmentId: defaultEnv.id });
}

export async function updateProjectHandler(
  req: FastifyRequest<{ Params: ProjectParams; Body: UpdateProjectBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = req.params;
  const project = await projectRepo.findById(id);
  if (!project) {
    return reply.code(404).send({ error: "NotFound", message: "Project not found" });
  }
  if (req.body.deploymentType && !["docker", "pm2"].includes(req.body.deploymentType)) {
    return reply.code(400).send({
      error: "ValidationError",
      message: `Invalid deploymentType "${req.body.deploymentType}". Supported: docker, pm2`,
    });
  }
  if (req.body.env !== undefined) {
    const envError = validateEnvObject(req.body.env);
    if (envError) {
      return reply.code(400).send({ error: "ValidationError", message: envError });
    }
  }
  const updated = await projectRepo.update(id, req.body);
  logger.info({ projectId: id }, "API: project updated");
  reply.code(200).send({ project: updated });
}

export async function generatePipelineHandler(
  req: FastifyRequest<{ Params: ProjectParams; Body: { webhookUrl: string } }>,
  reply: FastifyReply
): Promise<void> {
  const project = await projectRepo.findById(req.params.id);
  if (!project) {
    return reply.code(404).send({ error: "NotFound", message: "Project not found" });
  }

  const { webhookUrl } = req.body;
  const apiKey = config.geminiApiKey;

  if (!apiKey) {
    return reply.code(400).send({ error: "NotConfigured", message: "GEMINI_API_KEY is not set in .env on the server" });
  }

  const prompt = `You are a senior DevOps engineer. Generate a production-ready GitHub Actions CI/CD workflow YAML for this project:

Name: ${project.name}
Repository: ${project.repoUrl}
Branch: ${project.branch}
Build context subdirectory: ${project.buildContext}
App port: ${project.appPort}
Health check path: ${project.healthPath}
VersionGate deploy webhook: ${webhookUrl}

Rules:
- Trigger on push to "${project.branch}" only
- Detect runtime: if bun.lockb exists use Bun, otherwise use Node.js with npm
- Cache dependencies (node_modules or bun cache)
- Steps: checkout → setup runtime → install → build → test (if test script exists, use --passWithNoTests) → deploy
- Deploy step: curl -s -o /dev/null -w "%{http_code}" -X POST "${webhookUrl}" and assert 200
- Use concurrency group to cancel in-progress runs on the same branch
- Output ONLY the raw YAML. No markdown, no code fences, no commentary.`;

  let geminiRes: Response;
  try {
    geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
        }),
      }
    );
  } catch (netErr) {
    logger.error({ err: netErr }, "generatePipeline: network error reaching Gemini API");
    return reply.code(502).send({ error: "GatewayError", message: "Could not reach Gemini API — check server internet access" });
  }

  if (!geminiRes.ok) {
    const errText = await geminiRes.text().catch(() => "");
    logger.error({ status: geminiRes.status, body: errText }, "generatePipeline: Gemini API returned error");
    return reply.code(502).send({ error: "GeminiError", message: `Gemini returned ${geminiRes.status}: ${errText.slice(0, 200)}` });
  }

  let data: { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  try {
    data = await geminiRes.json() as typeof data;
  } catch (parseErr) {
    logger.error({ err: parseErr }, "generatePipeline: failed to parse Gemini response");
    return reply.code(502).send({ error: "ParseError", message: "Invalid response from Gemini API" });
  }

  const yaml = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  if (!yaml) {
    logger.error({ data }, "generatePipeline: empty YAML from Gemini");
    return reply.code(502).send({ error: "EmptyResponse", message: "Gemini returned an empty response" });
  }

  logger.info({ projectId: project.id, lines: yaml.split("\n").length }, "generatePipeline: YAML generated");
  reply.code(200).send({ yaml });
}

export async function updateProjectEnvHandler(
  req: FastifyRequest<{ Params: ProjectParams; Body: UpdateEnvBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = req.params;
  const { env } = req.body;

  const envError = validateEnvObject(env);
  if (envError) {
    return reply.code(400).send({ error: "ValidationError", message: envError });
  }

  const project = await projectRepo.findById(id);
  if (!project) {
    return reply.code(404).send({ error: "NotFound", message: "Project not found" });
  }

  const updated = await projectRepo.update(id, { env });
  logger.info({ projectId: id, envKeys: Object.keys(env).length }, "API: project env updated");
  reply.code(200).send({ project: updated });
}

export async function getProjectAnalyticsHandler(
  req: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = req.params;
  const project = await projectRepo.findById(id);
  if (!project) {
    return reply.code(404).send({ error: "NotFound", message: "Project not found" });
  }

  const analytics = await projectAnalyticsService.getAnalytics(id);
  reply.code(200).send({ analytics });
}

