import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { logger } from "../utils/logger";
import { normalizeDatabaseUrl } from "../utils/db-url";

let queryClient: postgres.Sql | null = null;
let dbInstance: PostgresJsDatabase<typeof schema> | null = null;

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (dbInstance) return dbInstance;

  const rawConnectionString = process.env.DATABASE_URL;
  if (!rawConnectionString?.trim()) {
    throw new Error("DATABASE_URL is not set");
  }

  const connectionString = normalizeDatabaseUrl(rawConnectionString);

  queryClient = postgres(connectionString, {
    max: 20,
    idle_timeout: 30,
    connect_timeout: 10,
  });

  dbInstance = drizzle(queryClient, { schema });
  return dbInstance;
}

export async function disconnectDb(): Promise<void> {
  if (queryClient) {
    logger.info("Closing database connection pool");
    await queryClient.end();
    queryClient = null;
    dbInstance = null;
  }
}

export default getDb;
