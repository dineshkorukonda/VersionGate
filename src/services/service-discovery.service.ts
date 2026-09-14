import fs from "fs";
import path from "path";
import { execFileAsync } from "../utils/exec";
import { config } from "../config/env";
import { logger } from "../utils/logger";
import { isPm2Available } from "../utils/pm2";
import { ProjectRepository, DEFAULT_ENVIRONMENT_NAME } from "../repositories/project.repository";
import { DeploymentRepository } from "../repositories/deployment.repository";
import { EnvironmentRepository } from "../repositories/environment.repository";
import { TrafficService } from "./traffic.service";
import { ProjectSelect, DeploymentSelect } from "../db/schema";

export interface DiscoveredDeployment {
  id: string;
  name: string;
  serviceType: "pm2" | "docker";
  status: "online" | "running" | "stopped";
  port?: number;
  containerName?: string;
  imageTag?: string;
  pm2Name?: string;
  localPath?: string;
  repoUrl?: string;
  branch?: string;
  alreadyAdopted: boolean;
}

export interface AdoptDeploymentInput {
  name: string;
  serviceType: "pm2" | "docker";
  port: number;
  repoUrl?: string;
  branch?: string;
  localPath?: string;
  containerName?: string;
  pm2Name?: string;
  imageTag?: string;
}

export class ServiceDiscoveryService {
  private projectRepo = new ProjectRepository();
  private deploymentRepo = new DeploymentRepository();
  private envRepo = new EnvironmentRepository();
  private trafficService = new TrafficService();

  /**
   * Attempts to parse git remote origin URL and current branch from a directory.
   */
  extractGitMetadata(dirPath: string): { repoUrl?: string; branch?: string } {
    try {
      const gitConfigPath = path.join(dirPath, ".git", "config");
      if (fs.existsSync(gitConfigPath)) {
        const content = fs.readFileSync(gitConfigPath, "utf-8");
        const urlMatch = content.match(/url\s*=\s*(.+)/i);
        let repoUrl: string | undefined;
        if (urlMatch) {
          repoUrl = urlMatch[1].trim();
        }

        let branch: string | undefined;
        const headPath = path.join(dirPath, ".git", "HEAD");
        if (fs.existsSync(headPath)) {
          const headContent = fs.readFileSync(headPath, "utf-8").trim();
          const refMatch = headContent.match(/ref:\s*refs\/heads\/(.+)/i);
          if (refMatch) {
            branch = refMatch[1].trim();
          }
        }

        return { repoUrl, branch };
      }
    } catch {
      // Ignored
    }
    return {};
  }

  /**
   * Scans PM2 and Docker to find running external/custom services.
   */
  async discoverUnmanagedServices(): Promise<DiscoveredDeployment[]> {
    let existingNames = new Set<string>();
    let existingPorts = new Set<number>();
    try {
      const existingProjects = await this.projectRepo.findAll();
      existingNames = new Set(existingProjects.map((p) => p.name.toLowerCase()));
      existingPorts = new Set(existingProjects.map((p) => p.appPort));
    } catch {
      // Database might not be initialized or configured yet
    }

    const results: DiscoveredDeployment[] = [];

    // 1. Scan PM2 processes
    try {
      const pm2Ready = await isPm2Available();
      if (pm2Ready) {
        const { stdout } = await execFileAsync("pm2", ["jlist"]);
        const items = JSON.parse(stdout || "[]");
        if (Array.isArray(items)) {
          for (const item of items) {
            const name = String(item.name || "");
            // Filter out VersionGate internal engine processes
            if (
              name.startsWith("versiongate") ||
              name.startsWith("vg-") ||
              name === "versiongate-api" ||
              name === "versiongate-worker"
            ) {
              continue;
            }

            const pm2Env = item.pm2_env || {};
            const cwd = pm2Env.pm_cwd || pm2Env.cwd || "";
            const envPort = pm2Env.PORT || pm2Env.env?.PORT;
            const parsedPort = envPort ? parseInt(envPort, 10) : undefined;

            const git = cwd ? this.extractGitMetadata(cwd) : {};
            const isAdopted = existingNames.has(name.toLowerCase());

            results.push({
              id: `pm2-${item.pm_id}-${name}`,
              name,
              serviceType: "pm2",
              status: pm2Env.status === "online" ? "online" : "stopped",
              port: parsedPort,
              pm2Name: name,
              localPath: cwd || undefined,
              repoUrl: git.repoUrl,
              branch: git.branch || "main",
              alreadyAdopted: isAdopted,
            });
          }
        }
      }
    } catch (err) {
      logger.debug({ err }, "Service discovery PM2 scan skipped or failed");
    }

    // 2. Scan Docker containers
    try {
      const { stdout } = await execFileAsync(config.dockerBin, [
        "ps",
        "-a",
        "--format",
        "{{json .}}",
      ]);
      const lines = stdout.split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const c = JSON.parse(line);
          const containerName = (c.Names || "").replace(/^\//, "");
          const image = c.Image || "";
          const statusRaw = (c.Status || "").toLowerCase();

          // Filter out VersionGate internal containers and databases
          if (
            containerName.startsWith("versiongate") ||
            containerName.startsWith("vg-db-") ||
            containerName.startsWith("vg-app-")
          ) {
            continue;
          }

          // Parse exposed port (e.g. "0.0.0.0:8080->80/tcp")
          let hostPort: number | undefined;
          const portsRaw = c.Ports || "";
          const portMatch = portsRaw.match(/0\.0\.0\.0:(\d+)->/);
          if (portMatch) {
            hostPort = parseInt(portMatch[1], 10);
          }

          const isAdopted =
            existingNames.has(containerName.toLowerCase()) ||
            (hostPort !== undefined && existingPorts.has(hostPort));

          results.push({
            id: `docker-${c.ID}-${containerName}`,
            name: containerName,
            serviceType: "docker",
            status: statusRaw.startsWith("up") ? "running" : "stopped",
            port: hostPort,
            containerName,
            imageTag: image,
            alreadyAdopted: isAdopted,
          });
        } catch {
          // ignore line parse error
        }
      }
    } catch (err) {
      logger.debug({ err }, "Service discovery Docker scan skipped or failed");
    }

    return results;
  }

  /**
   * Adopts an unmanaged service into VersionGate, registering Project, Environments,
   * and an initial ACTIVE Deployment record.
   */
  async adoptService(input: AdoptDeploymentInput): Promise<{
    project: ProjectSelect;
    deployment: DeploymentSelect;
  }> {
    const cleanName = input.name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    const existing = await this.projectRepo.findByName(cleanName);
    if (existing) {
      throw new Error(`Project with name "${cleanName}" is already managed in VersionGate`);
    }

    if (!input.port || input.port < 1 || input.port > 65535) {
      throw new Error(`Valid host port is required to adopt service (received: ${input.port})`);
    }

    const basePort = await this.projectRepo.getNextBasePort();
    const repoUrl = input.repoUrl?.trim() || `https://github.com/local/${cleanName}`;
    const localPath = input.localPath || path.join(config.projectsRootPath, cleanName);

    logger.info({ name: cleanName, serviceType: input.serviceType, port: input.port }, "Adopting service into VersionGate");

    // 1. Create project
    const project = await this.projectRepo.create({
      name: cleanName,
      repoUrl,
      branch: input.branch || "main",
      localPath,
      appPort: input.port,
      basePort,
      deploymentType: input.serviceType,
      healthPath: "/health",
      buildContext: ".",
    });

    // 2. Find production environment created by projectRepo
    const environments = await this.envRepo.findAllForProject(project.id);
    const prodEnv = environments.find((e) => e.name === DEFAULT_ENVIRONMENT_NAME) || environments[0];

    // 3. Create initial ACTIVE deployment record pointing directly to the running service
    const containerName = input.containerName || input.pm2Name || `vg-adopted-${cleanName}`;
    const imageTag = input.imageTag || `adopted/${cleanName}:latest`;

    const deployment = await this.deploymentRepo.create({
      version: 1,
      imageTag,
      containerName,
      port: input.port,
      color: "BLUE",
      status: "ACTIVE",
      environment: { connect: { id: prodEnv.id } },
    });

    // 4. Update Nginx upstream if production
    try {
      await this.trafficService.switchTrafficTo(input.port, {
        projectName: cleanName,
        environmentName: DEFAULT_ENVIRONMENT_NAME,
      });
    } catch (err) {
      logger.warn({ err }, "Notice: Nginx upstream switch skipped or had warning during adoption");
    }

    return { project, deployment };
  }
}

export const serviceDiscoveryService = new ServiceDiscoveryService();
