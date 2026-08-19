import { count, eq, desc } from "drizzle-orm";
import { getDb } from "../db/client";
import { jobs, projects, JobSelect } from "../db/schema";

export interface JobWithProject extends JobSelect {
  project?: {
    id: string;
    name: string;
  };
}

export class JobRepository {
  async findById(id: string): Promise<JobSelect | null> {
    const db = getDb();
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    return job ?? null;
  }

  async countAll(): Promise<number> {
    const db = getDb();
    const [res] = await db.select({ value: count() }).from(jobs);
    return res?.value ?? 0;
  }

  async countByProjectId(projectId: string): Promise<number> {
    const db = getDb();
    const [res] = await db.select({ value: count() }).from(jobs).where(eq(jobs.projectId, projectId));
    return res?.value ?? 0;
  }

  async listAllWithProject(limit: number, offset: number): Promise<JobWithProject[]> {
    const db = getDb();
    const rows = await db
      .select({
        job: jobs,
        project: { id: projects.id, name: projects.name },
      })
      .from(jobs)
      .innerJoin(projects, eq(jobs.projectId, projects.id))
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .offset(offset);

    return rows.map((r) => ({
      ...r.job,
      project: r.project,
    }));
  }

  async listByProjectId(projectId: string, limit: number, offset: number): Promise<JobSelect[]> {
    const db = getDb();
    return db
      .select()
      .from(jobs)
      .where(eq(jobs.projectId, projectId))
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .offset(offset);
  }
}
