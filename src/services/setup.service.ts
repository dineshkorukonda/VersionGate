import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import { existsSync, readFileSync, rmSync } from "fs";
import * as schema from "../db/schema";
import type { getDb } from "../db/client";
import { createSessionWithClient, hashPassword, verifyPassword } from "./auth.service";
import { runDrizzleSchemaSync } from "../utils/drizzle-schema-sync";
import { writeEnvAtomically } from "../utils/env-file";
import { envFilePath } from "../utils/paths";

interface SetupConnection { db: ReturnType<typeof getDb>; close: () => Promise<void> }

/** Owns setup publication; failed initialization leaves the previous configuration intact. */
export class SetupService {
  private running = false;
  constructor(private readonly dependencies: {
    envPath?: string;
    syncSchema?: typeof runDrizzleSchemaSync;
    connect?: (url: string) => SetupConnection;
  } = {}) {}

  async initialize(input: {
    databaseUrl: string; email: string; password: string; envContent: string;
  }): Promise<string> {
    if (this.running) throw new Error("Setup is already in progress");
    this.running = true;
    const path = this.dependencies.envPath ?? envFilePath;
    let previous: Buffer | null = null;
    let connection: SetupConnection | undefined;
    let published = false;
    try {
      previous = existsSync(path) ? readFileSync(path) : null;
      (this.dependencies.syncSchema ?? runDrizzleSchemaSync)({ env: { ...process.env, DATABASE_URL: input.databaseUrl } });
      connection = this.dependencies.connect ? this.dependencies.connect(input.databaseUrl) : (() => {
        const client = postgres(input.databaseUrl, { max: 1, connect_timeout: 5 });
        return { db: drizzle(client, { schema }), close: () => client.end({ timeout: 5 }) };
      })();
      const passwordHash = await hashPassword(input.password);
      return await connection.db.transaction(async (tx) => {
        // Serializes first-admin creation, including another process using the same database.
        await tx.execute(sql`SELECT pg_advisory_xact_lock(1791606000)`);
        const [existing] = await tx.select().from(schema.users).limit(1);
        // A committed admin from an interrupted publication can be recovered with its credentials.
        if (existing && (existing.email !== input.email || !await verifyPassword(input.password, existing.passwordHash))) {
          throw new Error("An admin already exists; use its credentials to recover setup");
        }
        const user = existing ?? (await tx.insert(schema.users).values({ email: input.email, passwordHash }).returning())[0];
        const token = await createSessionWithClient(tx, user.id);
        writeEnvAtomically(path, input.envContent);
        published = true;
        return token;
      });
    } catch (err) {
      if (published) {
        if (previous) writeEnvAtomically(path, previous);
        else rmSync(path, { force: true });
      }
      throw err;
    } finally {
      // Releasing a failed setup connection must not mask its outcome.
      await connection?.close().catch(() => undefined);
      this.running = false;
    }
  }
}

export const setupService = new SetupService();
