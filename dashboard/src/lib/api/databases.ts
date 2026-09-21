import { request } from "./client";
import type {
  CreateManagedDatabaseInput,
  DatabaseQueryResult,
  DatabaseSchemaResult,
  ManagedDatabase,
  ManagedDatabaseDetails,
} from "./types";

export function listManagedDatabases(): Promise<{ databases: ManagedDatabase[] }> {
  return request("GET", "/databases");
}

export function getManagedDatabase(id: string): Promise<{ database: ManagedDatabaseDetails }> {
  return request("GET", `/databases/${id}`);
}

export function createManagedDatabase(input: CreateManagedDatabaseInput): Promise<{ database: ManagedDatabase }> {
  return request("POST", "/databases", input);
}

export function startManagedDatabase(id: string): Promise<{ status: string }> {
  return request("POST", `/databases/${id}/start`);
}

export function stopManagedDatabase(id: string): Promise<{ status: string }> {
  return request("POST", `/databases/${id}/stop`);
}

export function deleteManagedDatabase(id: string, dropVolume = false): Promise<{ status: string }> {
  return request("DELETE", `/databases/${id}${dropVolume ? "?dropVolume=true" : ""}`);
}

export function linkManagedDatabase(
  databaseId: string,
  projectId: string,
  envKey?: string
): Promise<{ success: boolean; envKey: string; uri: string }> {
  return request("POST", `/databases/${databaseId}/link`, { projectId, envKey });
}

export function unlinkManagedDatabase(databaseId: string): Promise<{ success: boolean }> {
  return request("POST", `/databases/${databaseId}/unlink`);
}

export function getDatabaseLogs(
  databaseId: string,
  tail = 200
): Promise<{ lines: string[]; containerName: string }> {
  return request("GET", `/databases/${databaseId}/logs?tail=${tail}`);
}

export function getDatabaseSchema(databaseId: string): Promise<{ schema: DatabaseSchemaResult }> {
  return request("GET", `/databases/${databaseId}/schema`);
}

export function executeDatabaseQuery(
  databaseId: string,
  query: string,
  limit = 100
): Promise<DatabaseQueryResult> {
  return request("POST", `/databases/${databaseId}/query`, { query, limit });
}
