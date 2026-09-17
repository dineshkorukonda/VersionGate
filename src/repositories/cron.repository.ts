import { eq, desc } from "drizzle-orm";
import { getDb } from "../db/client";
import {
  cronJobs,
  cronJobLogs,
  CronJobSelect,
  CronJobInsert,
  CronJobLogSelect,
  CronJobLogInsert,
} from "../db/schema";

export class CronRepository {
  async create(data: CronJobInsert): Promise<CronJobSelect> {
    const db = getDb();
    const [created] = await db.insert(cronJobs).values(data).returning();
    return created;
  }

  async findById(id: string): Promise<CronJobSelect | null> {
    const db = getDb();
    const [found] = await db
      .select()
      .from(cronJobs)
      .where(eq(cronJobs.id, id))
      .limit(1);
    return found || null;
  }

  async findAll(): Promise<CronJobSelect[]> {
    const db = getDb();
    return db
      .select()
      .from(cronJobs)
      .orderBy(desc(cronJobs.createdAt));
  }

  async findEnabled(): Promise<CronJobSelect[]> {
    const db = getDb();
    return db
      .select()
      .from(cronJobs)
      .where(eq(cronJobs.enabled, true))
      .orderBy(desc(cronJobs.createdAt));
  }

  async findByProjectId(projectId: string): Promise<CronJobSelect[]> {
    const db = getDb();
    return db
      .select()
      .from(cronJobs)
      .where(eq(cronJobs.projectId, projectId))
      .orderBy(desc(cronJobs.createdAt));
  }

  async update(id: string, data: Partial<CronJobInsert>): Promise<CronJobSelect> {
    const db = getDb();
    const [updated] = await db
      .update(cronJobs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(cronJobs.id, id))
      .returning();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const db = getDb();
    const result = await db
      .delete(cronJobs)
      .where(eq(cronJobs.id, id))
      .returning();
    return result.length > 0;
  }

  async createLog(data: CronJobLogInsert): Promise<CronJobLogSelect> {
    const db = getDb();
    const [created] = await db.insert(cronJobLogs).values(data).returning();
    return created;
  }

  async findLogsByJobId(cronJobId: string, limit = 50): Promise<CronJobLogSelect[]> {
    const db = getDb();
    return db
      .select()
      .from(cronJobLogs)
      .where(eq(cronJobLogs.cronJobId, cronJobId))
      .orderBy(desc(cronJobLogs.createdAt))
      .limit(limit);
  }
}

export const cronRepository = new CronRepository();
