import { eq, desc } from "drizzle-orm";
import { getDb } from "../db/client";
import {
  managedDatabases,
  ManagedDatabaseSelect,
  ManagedDatabaseInsert,
} from "../db/schema";

export class DatabaseRepository {
  async create(data: ManagedDatabaseInsert): Promise<ManagedDatabaseSelect> {
    const db = getDb();
    const [created] = await db.insert(managedDatabases).values(data).returning();
    return created;
  }

  async findById(id: string): Promise<ManagedDatabaseSelect | null> {
    const db = getDb();
    const [found] = await db
      .select()
      .from(managedDatabases)
      .where(eq(managedDatabases.id, id))
      .limit(1);
    return found || null;
  }

  async findByName(name: string): Promise<ManagedDatabaseSelect | null> {
    const db = getDb();
    const [found] = await db
      .select()
      .from(managedDatabases)
      .where(eq(managedDatabases.name, name))
      .limit(1);
    return found || null;
  }

  async findAll(): Promise<ManagedDatabaseSelect[]> {
    const db = getDb();
    return db
      .select()
      .from(managedDatabases)
      .orderBy(desc(managedDatabases.createdAt));
  }

  async findByProjectId(projectId: string): Promise<ManagedDatabaseSelect[]> {
    const db = getDb();
    return db
      .select()
      .from(managedDatabases)
      .where(eq(managedDatabases.linkedProjectId, projectId))
      .orderBy(desc(managedDatabases.createdAt));
  }

  async update(
    id: string,
    data: Partial<ManagedDatabaseInsert>
  ): Promise<ManagedDatabaseSelect> {
    const db = getDb();
    const [updated] = await db
      .update(managedDatabases)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(managedDatabases.id, id))
      .returning();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const db = getDb();
    const result = await db
      .delete(managedDatabases)
      .where(eq(managedDatabases.id, id))
      .returning();
    return result.length > 0;
  }
}

export const databaseRepository = new DatabaseRepository();
