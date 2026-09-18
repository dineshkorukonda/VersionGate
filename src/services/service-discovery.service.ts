import fs from "fs";
import path from "path";
import { execFileAsync } from "../utils/exec";
import { config } from "../config/env";
import { logger } from "../utils/logger";
import { isPm2Available } from "../utils/pm2";
import { ProjectRepository, DEFAULT_ENVIRONMENT_NAME } from "../repositories/project.repository";
import { DeploymentRepository } from "../repositories/deployment.repository";
import { EnvironmentRepository } from "../repositories/environment.repository";
import { ProjectDomainRepository } from "../repositories/project-domain.repository";
import { ProjectDomainService } from "./project-domain.service";
import { isValidHostname } from "../utils/domain-validation";
import { normalizeGithubRepoUrl } from "../utils/github/github-repo-url";
import { reloadNginxBestEffort } from "../utils/nginx-reload";
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
  detectedDomains?: string[];
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
  customDomains?: string[];
}

export class ServiceDiscoveryService {
  private projectRepo = new ProjectRepository();
  private deploymentRepo = new DeploymentRepository();
  private envRepo = new EnvironmentRepository();
  private domainRepo = new ProjectDomainRepository();
  private domainService = new ProjectDomainService();
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
          const rawUrl = urlMatch[1].trim();
          const normalized = normalizeGithubRepoUrl(rawUrl);
          repoUrl = normalized || rawUrl;
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
   * Scans standard host Nginx configuration directories to detect any server blocks
   * proxy_passing to the given port.
   */
  extractNginxDomains(port: number): string[] {
    if (!port || port <= 0) return [];
    const candidateDirs = [
      "/etc/nginx/sites-enabled",
      "/etc/nginx/conf.d",
      "/etc/nginx/sites-available",
      "/usr/local/etc/nginx/servers",
    ];

    const detected = new Set<string>();
    const portRegexes = [
      new RegExp(`proxy_pass\\s+https?:\\/\\/(?:127\\.0\\.0\\.1|localhost|0\\.0\\.0\\.0):${port}(?:[\\/\\s;]|$)`, "i"),
      new RegExp(`server\\s+(?:127\\.0\\.0\\.1|localhost|0\\.0\\.0\\.0):${port}(?:[\\s;]|$)`, "i"),
    ];

    for (const dir of candidateDirs) {
      try {
        if (!fs.existsSync(dir)) continue;
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (
            file.startsWith("vg-app-") ||
            file.startsWith("vg-upstream-") ||
            file === "versiongate.conf"
          ) {
            continue;
          }
          const fullPath = path.join(dir, file);
          try {
            const stat = fs.statSync(fullPath);
            if (!stat.isFile()) continue;
            const content = fs.readFileSync(fullPath, "utf-8");
            const matchesPort = portRegexes.some((rx) => rx.test(content));
            if (!matchesPort) continue;

            const serverNameMatches = content.matchAll(/server_name\s+([^;]+);/gi);
            for (const match of serverNameMatches) {
              const rawNames = match[1].trim().split(/\s+/);
              for (const name of rawNames) {
                const cleaned = name.trim().toLowerCase();
                if (
                  cleaned &&
                  cleaned !== "_" &&
                  cleaned !== "localhost" &&
                  cleaned !== "127.0.0.1" &&
                  !cleaned.startsWith("~") &&
                  !cleaned.startsWith("$") &&
                  !/^\d{1,3}(\.\d{1,3}){3}$/.test(cleaned) &&
                  isValidHostname(cleaned)
                ) {
                  detected.add(cleaned);
                }
              }
            }
          } catch {
            // ignore unreadable file
          }
        }
      } catch {
        // ignore unreadable directory
      }
    }

    return Array.from(detected);
  }

  /**
   * Scans PM2 and Docker across available users and containers to find unmanaged running services.
   */
  async discoverUnmanagedServices(): Promise<DiscoveredDeployment[]> {
    let existingNames = new Set<string>();
    let existingPorts = new Set<number>();
    let managedContainerNames = new Set<string>();

    try {
      const existingProjects = await this.projectRepo.findAll();
      existingNames = new Set(existingProjects.map((p) => p.name.toLowerCase()));
      existingPorts = new Set(existingProjects.map((p) => p.appPort));

      // Collect all known deployment container names and Blue/Green slots
      const allDeployments = await this.deploymentRepo.findAll();
      for (const d of allDeployments) {
        if (d.containerName) {
          managedContainerNames.add(d.containerName.toLowerCase());
        }
        if (d.port) {
          existingPorts.add(d.port);
        }
      }

      for (const p of existingProjects) {
        const name = p.name.toLowerCase();
        managedContainerNames.add(`${name}-production-blue`);
        managedContainerNames.add(`${name}-production-green`);
        managedContainerNames.add(`${name}-staging-blue`);
        managedContainerNames.add(`${name}-staging-green`);
        managedContainerNames.add(`${name}-development-blue`);
        managedContainerNames.add(`${name}-development-green`);
        managedContainerNames.add(name);
        managedContainerNames.add(`vg-adopted-${name}`);
        if (p.basePort) {
          existingPorts.add(p.basePort);
          existingPorts.add(p.basePort + 1);
        }
      }
    } catch {
      // Database might not be initialized or configured yet
    }

    const results: DiscoveredDeployment[] = [];

    // 1. Scan PM2 processes across default and common user environments
    try {
      const pm2Ready = await isPm2Available();
      if (pm2Ready) {
        const pm2HomeCandidates: (string | undefined)[] = [
          undefined, // current user environment
          process.env.PM2_HOME,
          "/root/.pm2",
          "/home/ubuntu/.pm2",
          "/home/admin/.pm2",
          "/home/debian/.pm2",
        ];

        const seenKeys = new Set<string>();

        for (const home of pm2HomeCandidates) {
          try {
            const execOptions = home ? { env: { ...process.env, PM2_HOME: home } } : undefined;
            const { stdout } = await execFileAsync("pm2", ["jlist"], execOptions);
            const items = JSON.parse(stdout || "[]");
            if (Array.isArray(items)) {
              for (const item of items) {
                const name = String(item.name || "");
                const pmId = Number(item.pm_id ?? -1);
                const pid = Number(item.pid ?? 0);
                const uniqueKey = `${name}-${pmId}-${pid}`;
                if (seenKeys.has(uniqueKey)) continue;
                seenKeys.add(uniqueKey);

                // Filter out VersionGate core internal engine processes
                const isInternalEngine =
                  name === "versiongate" ||
                  name === "versiongate-api" ||
                  name === "versiongate-worker" ||
                  name === "versiongate-backend" ||
                  name === "versiongate-dashboard";
                if (isInternalEngine) continue;

                const pm2Env = item.pm2_env || {};
                const cwd = pm2Env.pm_cwd || pm2Env.cwd || "";

                // Deep port discovery: environment, args, .env file, or process sockets
                let parsedPort: number | undefined;
                const envCandidates = [
                  pm2Env.PORT,
                  pm2Env.env?.PORT,
                  pm2Env.env_production?.PORT,
                  pm2Env.env_development?.PORT,
                  pm2Env.env_prod?.PORT,
                  pm2Env.env_dev?.PORT,
                ];
                for (const c of envCandidates) {
                  if (c) {
                    const p = parseInt(String(c), 10);
                    if (p > 0 && p <= 65535) {
                      parsedPort = p;
                      break;
                    }
                  }
                }

                if (!parsedPort && cwd) {
                  const envFiles = [".env", ".env.production", ".env.local", ".env.prod"];
                  for (const f of envFiles) {
                    try {
                      const envPath = path.join(cwd, f);
                      if (fs.existsSync(envPath)) {
                        const content = fs.readFileSync(envPath, "utf-8");
                        const portMatch = content.match(/^PORT\s*=\s*(\d+)/m);
                        if (portMatch) {
                          const p = parseInt(portMatch[1], 10);
                          if (p > 0 && p <= 65535) {
                            parsedPort = p;
                            break;
                          }
                        }
                      }
                    } catch {
                      // ignore file read error
                    }
                  }
                }

                // Check Linux listening sockets for PID if not found
                if (!parsedPort && pid > 0 && process.platform !== "win32") {
                  try {
                    const { stdout: ssOut } = await execFileAsync("ss", ["-tlpn", "-H"]);
                    for (const line of ssOut.split("\n")) {
                      if (line.includes(`pid=${pid},`) || line.includes(`pid=${pid})`)) {
                        const match = line.match(/:(\d+)\s+/);
                        if (match) {
                          const p = parseInt(match[1], 10);
                          if (p > 0 && p <= 65535) {
                            parsedPort = p;
                            break;
                          }
                        }
                      }
                    }
                  } catch {
                    // ss not available
                  }
                }

                const git = cwd ? this.extractGitMetadata(cwd) : {};
                const detectedDomains = parsedPort ? this.extractNginxDomains(parsedPort) : [];
                const isAdopted = existingNames.has(name.toLowerCase());

                results.push({
                  id: `pm2-${pmId}-${name}`,
                  name,
                  serviceType: "pm2",
                  status: pm2Env.status === "online" ? "online" : "stopped",
                  port: parsedPort,
                  pm2Name: name,
                  localPath: cwd || undefined,
                  repoUrl: git.repoUrl,
                  branch: git.branch || "main",
                  detectedDomains: detectedDomains.length > 0 ? detectedDomains : undefined,
                  alreadyAdopted: isAdopted,
                });
              }
            }
          } catch {
            // ignore missing home failure
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
            containerName.startsWith("vg-app-") ||
            managedContainerNames.has(containerName.toLowerCase())
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

          const detectedDomains = hostPort ? this.extractNginxDomains(hostPort) : [];
          const isAdopted =
            existingNames.has(containerName.toLowerCase()) ||
            managedContainerNames.has(containerName.toLowerCase()) ||
            (hostPort !== undefined && existingPorts.has(hostPort));

          results.push({
            id: `docker-${c.ID}-${containerName}`,
            name: containerName,
            serviceType: "docker",
            status: statusRaw.startsWith("up") ? "running" : "stopped",
            port: hostPort,
            containerName,
            imageTag: image,
            detectedDomains: detectedDomains.length > 0 ? detectedDomains : undefined,
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
   * custom domains (if detected or provided), and an initial ACTIVE Deployment record.
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
    const rawRepoUrl = input.repoUrl?.trim();
    const repoUrl = rawRepoUrl
      ? normalizeGithubRepoUrl(rawRepoUrl) || rawRepoUrl
      : `https://github.com/local/${cleanName}`;
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
      isAdopted: true,
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

    // 4. Update Nginx upstream for path-based routing
    try {
      await this.trafficService.switchTrafficTo(input.port, {
        projectName: cleanName,
        environmentName: DEFAULT_ENVIRONMENT_NAME,
      });
    } catch (err) {
      logger.warn({ err }, "Notice: Nginx upstream switch skipped or had warning during adoption");
    }

    // 5. Attach any detected or provided custom domains
    const domainsToRegister = Array.isArray(input.customDomains) ? input.customDomains : [];
    if (domainsToRegister.length > 0) {
      let registeredCount = 0;
      for (const rawDomain of domainsToRegister) {
        const hostname = rawDomain.trim().toLowerCase();
        if (hostname && isValidHostname(hostname)) {
          const existingDomain = await this.domainRepo.findByHostname(hostname);
          if (!existingDomain) {
            await this.domainRepo.create({
              projectId: project.id,
              hostname,
              environmentName: DEFAULT_ENVIRONMENT_NAME,
              sslStatus: "pending_dns",
            });
            await this.domainService.writeUpstreamForProject(cleanName, input.port);
            await this.domainService.writeServerForHostname(cleanName, hostname);
            registeredCount++;
          }
        }
      }
      if (registeredCount > 0) {
        try {
          reloadNginxBestEffort();
        } catch {
          // non-blocking
        }
        logger.info({ projectName: cleanName, count: registeredCount }, "Registered custom domains during adoption");
      }
    }

    return { project, deployment };
  }
}

export const serviceDiscoveryService = new ServiceDiscoveryService();

