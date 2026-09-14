import { randomBytes } from "crypto";
import { execFileAsync } from "../utils/exec";
import { config } from "../config/env";
import { logger } from "../utils/logger";
import { encrypt, decrypt } from "../utils/crypto";
import { isPortAvailableOnHost, parseExcludedPorts } from "../utils/port-manager";
import { databaseRepository } from "../repositories/database.repository";
import { ProjectRepository } from "../repositories/project.repository";
import { ManagedDatabaseSelect } from "../db/schema";
import { inspectContainer, stopContainer, removeContainer } from "../utils/docker";

export interface ProvisionDatabaseInput {
  name: string;
  engine: "postgres" | "mysql" | "redis" | "mongodb";
  version?: string;
  databaseName?: string;
  username?: string;
  password?: string;
  linkedProjectId?: string;
}

export interface ManagedDatabaseDetails extends ManagedDatabaseSelect {
  passwordDecrypted: string;
  connectionUriLocal: string;
  connectionUriDocker: string;
  running: boolean;
}

const DEFAULT_ENGINE_CONFIG: Record<
  "postgres" | "mysql" | "redis" | "mongodb",
  {
    image: (ver?: string) => string;
    internalPort: number;
    defaultPortRangeStart: number;
    defaultDb: string;
    defaultUser: string;
    envVarKey: string;
  }
> = {
  postgres: {
    image: (ver) => `postgres:${ver || "16-alpine"}`,
    internalPort: 5432,
    defaultPortRangeStart: 5433,
    defaultDb: "versiongate_app",
    defaultUser: "postgres",
    envVarKey: "DATABASE_URL",
  },
  mysql: {
    image: (ver) => `mysql:${ver || "8.4"}`,
    internalPort: 3306,
    defaultPortRangeStart: 3307,
    defaultDb: "versiongate_app",
    defaultUser: "root",
    envVarKey: "DATABASE_URL",
  },
  redis: {
    image: (ver) => `redis:${ver || "7-alpine"}`,
    internalPort: 6379,
    defaultPortRangeStart: 6380,
    defaultDb: "",
    defaultUser: "",
    envVarKey: "REDIS_URL",
  },
  mongodb: {
    image: (ver) => `mongo:${ver || "7"}`,
    internalPort: 27017,
    defaultPortRangeStart: 27018,
    defaultDb: "versiongate_app",
    defaultUser: "admin",
    envVarKey: "MONGODB_URL",
  },
};

export class DatabaseProvisioningService {
  private projectRepo = new ProjectRepository();

  generatePassword(length = 24): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const bytes = randomBytes(length);
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  }

  formatConnectionUri(
    engine: "postgres" | "mysql" | "redis" | "mongodb",
    host: string,
    port: number,
    username: string | null | undefined,
    password: string,
    databaseName: string | null | undefined
  ): string {
    const encPass = encodeURIComponent(password);
    const encUser = username ? encodeURIComponent(username) : "";

    switch (engine) {
      case "postgres":
        return `postgresql://${encUser}:${encPass}@${host}:${port}/${databaseName || "postgres"}?sslmode=disable`;
      case "mysql":
        return `mysql://${encUser}:${encPass}@${host}:${port}/${databaseName || "mysql"}`;
      case "redis":
        return password ? `redis://:${encPass}@${host}:${port}` : `redis://${host}:${port}`;
      case "mongodb":
        return `mongodb://${encUser}:${encPass}@${host}:${port}/${databaseName || "admin"}?authSource=admin`;
      default:
        return "";
    }
  }

  async findAvailablePort(engine: "postgres" | "mysql" | "redis" | "mongodb"): Promise<number> {
    const cfg = DEFAULT_ENGINE_CONFIG[engine];
    const excluded = parseExcludedPorts(process.env.EXCLUDED_PORTS);
    const existing = await databaseRepository.findAll();
    const usedPorts = new Set(existing.map((d) => d.hostPort));

    let candidate = cfg.defaultPortRangeStart;
    while (candidate <= 65535) {
      if (!excluded.has(candidate) && !usedPorts.has(candidate)) {
        const free = await isPortAvailableOnHost(candidate);
        if (free) {
          return candidate;
        }
      }
      candidate++;
    }
    throw new Error(`Unable to find an available host port for database engine ${engine}`);
  }

  async provision(input: ProvisionDatabaseInput): Promise<ManagedDatabaseSelect> {
    const nameClean = input.name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    if (!nameClean) {
      throw new Error("Invalid database name");
    }

    const existing = await databaseRepository.findByName(nameClean);
    if (existing) {
      throw new Error(`Database with name "${nameClean}" already exists`);
    }

    const cfg = DEFAULT_ENGINE_CONFIG[input.engine];
    if (!cfg) {
      throw new Error(`Unsupported database engine: ${input.engine}`);
    }

    const hostPort = await this.findAvailablePort(input.engine);
    const password = input.password || this.generatePassword(24);
    const passwordEncrypted = encrypt(password);
    const databaseName = input.databaseName || (input.engine === "redis" ? null : cfg.defaultDb);
    const username = input.username || (input.engine === "redis" ? null : cfg.defaultUser);
    const containerName = `vg-db-${nameClean}`;
    const volumeName = `vg-data-${nameClean}`;
    const version = input.version || (input.engine === "postgres" ? "16-alpine" : input.engine === "mysql" ? "8.4" : input.engine === "redis" ? "7-alpine" : "7");

    logger.info({ name: nameClean, engine: input.engine, hostPort, containerName }, "Provisioning managed database");

    try {
      await execFileAsync(config.dockerBin, ["volume", "create", volumeName]);
    } catch (err) {
      logger.warn({ volumeName, err }, "Notice on volume creation (may already exist)");
    }

    const dockerArgs: string[] = [
      "run",
      "-d",
      "--name", containerName,
      "--network", config.dockerNetwork,
      "--restart", "unless-stopped",
      "-p", `0.0.0.0:${hostPort}:${cfg.internalPort}`,
    ];

    switch (input.engine) {
      case "postgres":
        dockerArgs.push(
          "-v", `${volumeName}:/var/lib/postgresql/data`,
          "-e", `POSTGRES_DB=${databaseName}`,
          "-e", `POSTGRES_USER=${username}`,
          "-e", `POSTGRES_PASSWORD=${password}`,
          cfg.image(version)
        );
        break;

      case "mysql":
        dockerArgs.push(
          "-v", `${volumeName}:/var/lib/mysql`,
          "-e", `MYSQL_DATABASE=${databaseName}`,
          "-e", `MYSQL_ROOT_PASSWORD=${password}`,
          cfg.image(version)
        );
        break;

      case "redis":
        dockerArgs.push(
          "-v", `${volumeName}:/data`,
          cfg.image(version),
          "redis-server",
          "--requirepass", password,
          "--appendonly", "yes"
        );
        break;

      case "mongodb":
        dockerArgs.push(
          "-v", `${volumeName}:/data/db`,
          "-e", `MONGO_INITDB_ROOT_USERNAME=${username}`,
          "-e", `MONGO_INITDB_ROOT_PASSWORD=${password}`,
          "-e", `MONGO_INITDB_DATABASE=${databaseName}`,
          cfg.image(version)
        );
        break;
    }

    try {
      await removeContainer(containerName).catch(() => null);
      await execFileAsync(config.dockerBin, dockerArgs);
    } catch (err: any) {
      const errMsg = err?.stderr?.toString() || err?.message || String(err);
      logger.error({ containerName, errMsg }, "Failed to start database container");
      throw new Error(`Database container failed to start: ${errMsg}`);
    }

    const record = await databaseRepository.create({
      name: nameClean,
      engine: input.engine,
      version,
      containerName,
      hostPort,
      internalPort: cfg.internalPort,
      databaseName,
      username,
      passwordEncrypted,
      status: "RUNNING",
      volumeName,
      linkedProjectId: input.linkedProjectId || null,
    });

    if (input.linkedProjectId) {
      await this.linkToProject(record.id, input.linkedProjectId).catch((err) => {
        logger.warn({ databaseId: record.id, err }, "Failed to auto-link database to project env");
      });
    }

    return record;
  }

  async getDetails(id: string): Promise<ManagedDatabaseDetails | null> {
    const record = await databaseRepository.findById(id);
    if (!record) return null;

    let running = false;
    try {
      running = await inspectContainer(record.containerName);
    } catch {
      running = false;
    }

    const passwordDecrypted = decrypt(record.passwordEncrypted);
    const connectionUriLocal = this.formatConnectionUri(
      record.engine,
      "127.0.0.1",
      record.hostPort,
      record.username,
      passwordDecrypted,
      record.databaseName
    );
    const connectionUriDocker = this.formatConnectionUri(
      record.engine,
      "host.docker.internal",
      record.hostPort,
      record.username,
      passwordDecrypted,
      record.databaseName
    );

    return {
      ...record,
      passwordDecrypted,
      connectionUriLocal,
      connectionUriDocker,
      running,
    };
  }

  async listAll(): Promise<(ManagedDatabaseSelect & { running: boolean })[]> {
    const records = await databaseRepository.findAll();
    const result = await Promise.all(
      records.map(async (rec) => {
        let running = false;
        try {
          running = await inspectContainer(rec.containerName);
        } catch {
          running = false;
        }
        return {
          ...rec,
          running,
        };
      })
    );
    return result;
  }

  async start(id: string): Promise<boolean> {
    const record = await databaseRepository.findById(id);
    if (!record) throw new Error("Database not found");

    try {
      await execFileAsync(config.dockerBin, ["start", record.containerName]);
      await databaseRepository.update(id, { status: "RUNNING" });
      return true;
    } catch (err: any) {
      logger.error({ id, err }, "Failed to start database container");
      throw new Error(`Failed to start database: ${err?.message || String(err)}`);
    }
  }

  async stop(id: string): Promise<boolean> {
    const record = await databaseRepository.findById(id);
    if (!record) throw new Error("Database not found");

    try {
      await stopContainer(record.containerName);
      await databaseRepository.update(id, { status: "STOPPED" });
      return true;
    } catch (err: any) {
      logger.error({ id, err }, "Failed to stop database container");
      throw new Error(`Failed to stop database: ${err?.message || String(err)}`);
    }
  }

  async delete(id: string, dropVolume = false): Promise<boolean> {
    const record = await databaseRepository.findById(id);
    if (!record) return false;

    logger.info({ id, name: record.name, dropVolume }, "Deleting managed database");

    await removeContainer(record.containerName).catch(() => null);

    if (dropVolume && record.volumeName) {
      try {
        await execFileAsync(config.dockerBin, ["volume", "rm", "-f", record.volumeName]);
      } catch (err) {
        logger.warn({ volumeName: record.volumeName, err }, "Could not drop volume (may still be in use)");
      }
    }

    return databaseRepository.delete(id);
  }

  async linkToProject(databaseId: string, projectId: string, envKeyOverride?: string): Promise<{ success: boolean; envKey: string; uri: string }> {
    const details = await this.getDetails(databaseId);
    if (!details) {
      throw new Error("Database not found");
    }

    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new Error("Target project not found");
    }

    const cfg = DEFAULT_ENGINE_CONFIG[details.engine];
    const targetKey = envKeyOverride || cfg.envVarKey;
    const targetUri = project.deploymentType === "docker" ? details.connectionUriDocker : details.connectionUriLocal;

    const currentEnv = (project.env as Record<string, string>) || {};
    const updatedEnv = {
      ...currentEnv,
      [targetKey]: targetUri,
    };

    await this.projectRepo.update(projectId, {
      env: updatedEnv as any,
    });

    await databaseRepository.update(databaseId, {
      linkedProjectId: projectId,
    });

    logger.info({ databaseId, projectId, targetKey }, "Auto-linked database URI into project environment variables");

    return {
      success: true,
      envKey: targetKey,
      uri: targetUri,
    };
  }

  async unlinkFromProject(databaseId: string): Promise<{ success: boolean }> {
    const record = await databaseRepository.findById(databaseId);
    if (!record) {
      throw new Error("Database not found");
    }

    await databaseRepository.update(databaseId, {
      linkedProjectId: null,
    });

    logger.info({ databaseId, previousProjectId: record.linkedProjectId }, "Unlinked database from project");

    return { success: true };
  }
}

export const databaseProvisioningService = new DatabaseProvisioningService();
