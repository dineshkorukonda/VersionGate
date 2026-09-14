import { eq, desc } from "drizzle-orm";
import { getDb } from "../db/client";
import { projects, environments, projectDomains, jobs, ProjectSelect, ProjectInsert, JobSelect } from "../db/schema";
import { encrypt } from "../utils/crypto";
import { decryptProjectEnv, parseProjectEnv } from "../utils/env";
import { excludedPortsLive } from "../config/env";
import { findNextAvailableBasePort, parseExcludedPorts } from "../utils/port-manager";

export const DEFAULT_ENVIRONMENT_NAME = "production";

export class ProjectRepository {
  async create(data: Partial<ProjectInsert> & { name: string; repoUrl: string; localPath: string; appPort: number; basePort: number }): Promise<ProjectSelect> {
    const db = getDb();

    const preparedData = this.prepareCreateData(data);

    const project = await db.transaction(async (tx) => {
      const [created] = await tx.insert(projects).values(preparedData).returning();

      const now = new Date();
      await tx.insert(environments).values([
        {
          name: "development",
          projectId: created.id,
          branch: created.branch,
          serverHost: "localhost",
          basePort: created.basePort + 400,
          appPort: created.appPort,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: "staging",
          projectId: created.id,
          branch: created.branch,
          serverHost: "localhost",
          basePort: created.basePort + 200,
          appPort: created.appPort,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: DEFAULT_ENVIRONMENT_NAME,
          projectId: created.id,
          branch: created.branch,
          serverHost: "localhost",
          basePort: created.basePort,
          appPort: created.appPort,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      return created;
    });

    return this.hydrateProject(project);
  }

  async findById(id: string): Promise<ProjectSelect | null> {
    const db = getDb();
    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return project ? this.hydrateProject(project) : null;
  }

  async findByName(name: string): Promise<ProjectSelect | null> {
    const db = getDb();
    const [project] = await db.select().from(projects).where(eq(projects.name, name)).limit(1);
    return project ? this.hydrateProject(project) : null;
  }

  async findByWebhookSecret(secret: string): Promise<ProjectSelect | null> {
    const db = getDb();
    const [project] = await db.select().from(projects).where(eq(projects.webhookSecret, secret)).limit(1);
    return project ? this.hydrateProject(project) : null;
  }

  async findAll(): Promise<ProjectSelect[]> {
    const db = getDb();
    const rows = await db.select().from(projects).orderBy(desc(projects.createdAt));
    return rows.map((p) => this.hydrateProject(p));
  }

  async getProjectsSummary(): Promise<Array<ProjectSelect & {
    domains: Array<{ id: string; hostname: string; sslStatus: string; environmentName: string }>;
    latestJob: JobSelect | null;
  }>> {
    const db = getDb();
    const allProjects = await this.findAll();
    if (allProjects.length === 0) return [];

    const allDomains = await db.select().from(projectDomains);
    const allJobs = await db.select().from(jobs).orderBy(desc(jobs.createdAt));

    const domainsByProject = new Map<string, Array<{ id: string; hostname: string; sslStatus: string; environmentName: string }>>();
    for (const d of allDomains) {
      const list = domainsByProject.get(d.projectId) ?? [];
      list.push({
        id: d.id,
        hostname: d.hostname,
        sslStatus: d.sslStatus,
        environmentName: d.environmentName,
      });
      domainsByProject.set(d.projectId, list);
    }

    const latestJobByProject = new Map<string, JobSelect>();
    for (const j of allJobs) {
      if (!latestJobByProject.has(j.projectId)) {
        latestJobByProject.set(j.projectId, j);
      }
    }

    return allProjects.map((p) => ({
      ...p,
      domains: domainsByProject.get(p.id) ?? [],
      latestJob: latestJobByProject.get(p.id) ?? null,
    }));
  }

  async update(id: string, data: Partial<ProjectInsert>): Promise<ProjectSelect> {
    const db = getDb();
    const preparedData = this.prepareUpdateData(data);

    const [updated] = await db
      .update(projects)
      .set({ ...preparedData, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();

    return this.hydrateProject(updated);
  }

  async getNextBasePort(startPort = 3100): Promise<number> {
    const db = getDb();
    const rows = await db.select({ basePort: projects.basePort }).from(projects);
    const existingBasePorts = rows
      .map((r) => r.basePort)
      .filter((p): p is number => typeof p === "number");
    const excluded = parseExcludedPorts(excludedPortsLive());
    return findNextAvailableBasePort(startPort, excluded, existingBasePorts);
  }

  async delete(id: string): Promise<ProjectSelect> {
    const db = getDb();
    const [deleted] = await db.delete(projects).where(eq(projects.id, id)).returning();
    return this.hydrateProject(deleted);
  }

  private prepareCreateData(data: Partial<ProjectInsert>): ProjectInsert {
    const rawEnv = data.env;
    const now = new Date();
    return {
      ...(data as ProjectInsert),
      env: rawEnv !== undefined ? (this.encryptEnvValue(rawEnv) as any) : ({} as any),
      createdAt: now,
      updatedAt: now,
    };
  }

  private prepareUpdateData(data: Partial<ProjectInsert>): Partial<ProjectInsert> {
    if (data.env === undefined) {
      return data;
    }

    return {
      ...data,
      env: this.encryptEnvValue(data.env) as any,
    };
  }

  private hydrateProject(project: ProjectSelect): ProjectSelect {
    return {
      ...project,
      env: decryptProjectEnv(project.env),
    };
  }

  private encryptEnvValue(raw: unknown): Record<string, string> {
    const parsed = parseProjectEnv(raw);
    const encryptedEntries = Object.entries(parsed).map(([key, value]) => [key, encrypt(value)]);
    return Object.fromEntries(encryptedEntries);
  }
}
