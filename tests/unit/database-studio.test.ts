import { describe, expect, it } from "bun:test";
import { databaseProvisioningService } from "../../src/services/database-provisioning.service";
import {
  getDatabaseSchemaHandler,
  executeDatabaseQueryHandler,
} from "../../src/controllers/database.controller";

describe("Database Studio & Query Runner Service", () => {
  it("DatabaseProvisioningService exposes getDatabaseSchema and executeDatabaseQuery methods", () => {
    expect(typeof databaseProvisioningService.getDatabaseSchema).toBe("function");
    expect(typeof databaseProvisioningService.executeDatabaseQuery).toBe("function");
  });

  it("getDatabaseSchemaHandler and executeDatabaseQueryHandler are defined as Fastify handlers", () => {
    expect(typeof getDatabaseSchemaHandler).toBe("function");
    expect(typeof executeDatabaseQueryHandler).toBe("function");
  });
});

