import { eq, desc, max } from "drizzle-orm";
import { getDb } from "../db/client";
import { projects, environments, ProjectSelect, ProjectInsert } from "../db/schema";
import { encrypt } from "../utils/crypto";
import { decryptProjectEnv, parseProjectEnv } from "../utils/env";

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
    const [res] = await db.select({ maxPort: max(projects.basePort) }).from(projects);
    if (!res || res.maxPort === null || res.maxPort === undefined) return startPort;
    return res.maxPort + 500;
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
