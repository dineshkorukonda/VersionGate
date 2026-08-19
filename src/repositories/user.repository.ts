import { count, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { users, UserSelect, UserInsert } from "../db/schema";

export class UserRepository {
  async countUsers(): Promise<number> {
    const db = getDb();
    const [res] = await db.select({ value: count() }).from(users);
    return res?.value ?? 0;
  }

  async findById(id: string): Promise<UserSelect | null> {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ?? null;
  }

  async findByEmail(email: string): Promise<UserSelect | null> {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    return user ?? null;
  }

  async create(data: UserInsert): Promise<UserSelect> {
    const db = getDb();
    const [created] = await db.insert(users).values({
      ...data,
      email: data.email.toLowerCase().trim(),
    }).returning();
    return created;
  }

  async createUser(data: UserInsert): Promise<UserSelect> {
    return this.create(data);
  }
}
