import { describe, test, expect } from "bun:test";
import { DatabaseProvisioningService } from "../../src/services/database-provisioning.service";

describe("Database Provisioning & Connection URI Generator", () => {
  const service = new DatabaseProvisioningService();

  test("generates high-entropy password of given length", () => {
    const pass1 = service.generatePassword(32);
    const pass2 = service.generatePassword(32);
    expect(pass1.length).toBe(32);
    expect(pass2.length).toBe(32);
    expect(pass1).not.toBe(pass2);
    expect(/^[a-zA-Z0-9]+$/.test(pass1)).toBe(true);
  });

  test("formats PostgreSQL connection URI correctly", () => {
    const uri = service.formatConnectionUri(
      "postgres",
      "127.0.0.1",
      5433,
      "postgres",
      "s3cr3t#P@ss",
      "my_app_db"
    );
    expect(uri).toBe(
      "postgresql://postgres:s3cr3t%23P%40ss@127.0.0.1:5433/my_app_db?sslmode=disable"
    );
  });

  test("formats MySQL connection URI correctly", () => {
    const uri = service.formatConnectionUri(
      "mysql",
      "host.docker.internal",
      3307,
      "root",
      "mysqlpass",
      "shop_db"
    );
    expect(uri).toBe("mysql://root:mysqlpass@host.docker.internal:3307/shop_db");
  });

  test("formats Redis connection URI with password", () => {
    const uri = service.formatConnectionUri(
      "redis",
      "127.0.0.1",
      6380,
      null,
      "redisauth123",
      null
    );
    expect(uri).toBe("redis://:redisauth123@127.0.0.1:6380");
  });

  test("formats Redis connection URI without password", () => {
    const uri = service.formatConnectionUri(
      "redis",
      "127.0.0.1",
      6380,
      null,
      "",
      null
    );
    expect(uri).toBe("redis://127.0.0.1:6380");
  });

  test("formats MongoDB connection URI correctly", () => {
    const uri = service.formatConnectionUri(
      "mongodb",
      "host.docker.internal",
      27018,
      "admin",
      "mongopass",
      "analytics"
    );
    expect(uri).toBe(
      "mongodb://admin:mongopass@host.docker.internal:27018/analytics?authSource=admin"
    );
  });

  test("unlinkFromProject unlinks database successfully", async () => {
    let updatedId: string | null = null;
    let updatePayload: any = null;

    const mockDbRepo = {
      findById: async (id: string) => {
        if (id === "db-123") {
          return { id: "db-123", name: "test-db", linkedProjectId: "proj-abc" } as any;
        }
        return null;
      },
      update: async (id: string, data: any) => {
        updatedId = id;
        updatePayload = data;
        return { id, ...data } as any;
      },
    } as any;

    const testService = new DatabaseProvisioningService({} as any, mockDbRepo);
    const result = await testService.unlinkFromProject("db-123");

    expect(result.success).toBe(true);
    expect(updatedId).toBe("db-123");
    expect(updatePayload).toEqual({ linkedProjectId: null });
  });

  test("unlinkFromProject throws if database not found", async () => {
    const mockDbRepo = {
      findById: async () => null,
      update: async () => {},
    } as any;

    const testService = new DatabaseProvisioningService({} as any, mockDbRepo);
    try {
      await testService.unlinkFromProject("non-existent-db-id");
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.message).toBe("Database not found");
    }
  });
});
