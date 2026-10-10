import { describe, expect, spyOn, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync, rmdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { SetupService } from "../../src/services/setup.service";
import { users, sessions } from "../../src/db/schema";
import * as envFile from "../../src/utils/env-file";

describe("retryable setup initialization", () => {
  test("preserves unrelated dotenv settings and literal replacement characters in credentials", () => {
    const content = envFile.mergeDotenvContent("CUSTOM_SETTING=preserved\nDATABASE_URL=\"\"\n", {
      DATABASE_URL: "postgres://admin:literal$&password@localhost/database",
    });
    expect(content).toContain("CUSTOM_SETTING=preserved");
    expect(content).toContain('DATABASE_URL="postgres://admin:literal$&password@localhost/database"');
  });
  for (const failure of ["migration", "session", "write", "commit"]) {
    test(`retains configuration and rolls back admin after ${failure} failure, then succeeds on retry`, async () => {
      const directory = mkdtempSync(join(tmpdir(), "vg-setup-test-"));
      const path = join(directory, ".env");
      writeFileSync(path, "CUSTOM_SETTING=preserved\n");
      let failing = true;
      let committed: any[] = [];
      let closed = 0;
      const db = { transaction: async (callback: (tx: any) => Promise<string>) => {
        const staged = [...committed];
        const tx = {
          execute: async () => {},
          select: () => ({ from: () => ({ limit: async () => staged }) }),
          insert: (table: unknown) => ({ values: (value: any) => {
            if (table === sessions) {
              if (failing && failure === "session") throw new Error("session failure");
              return Promise.resolve();
            }
            expect(table).toBe(users);
            const user = { id: "admin", ...value };
            staged.push(user);
            return { returning: async () => [user] };
          } }),
        };
        const result = await callback(tx);
        if (failing && failure === "commit") throw new Error("commit failure");
        committed = staged;
        return result;
      } };
      const service = new SetupService({
        envPath: path,
        syncSchema: () => { if (failing && failure === "migration") throw new Error("migration failure"); },
        connect: () => ({ db: db as any, close: async () => { closed++; } }),
      });
      const originalWrite = envFile.writeEnvAtomically;
      const writeMock = spyOn(envFile, "writeEnvAtomically").mockImplementation((target, content) => {
        if (failing && failure === "write") throw new Error("write failure");
        originalWrite(target, content);
      });
      const input = { databaseUrl: "postgres://setup-test", email: "admin@example.test", password: "audit-test-password", envContent: "CUSTOM_SETTING=preserved\nDATABASE_URL=postgres://setup-test\n" };
      const runtimeBefore = process.env.DATABASE_URL;
      try {
        await expect(service.initialize(input)).rejects.toThrow(`${failure} failure`);
        expect(readFileSync(path, "utf8")).toBe("CUSTOM_SETTING=preserved\n");
        expect(committed).toEqual([]);
        expect(process.env.DATABASE_URL).toBe(runtimeBefore);
        failing = false;
        expect(await service.initialize(input)).toBeString();
        expect(committed).toHaveLength(1);
        expect(readFileSync(path, "utf8")).toBe(input.envContent);
        expect(closed).toBe(failure === "migration" ? 1 : 2);
      } finally {
        writeMock.mockRestore();
        for (const name of readdirSync(directory)) rmSync(join(directory, name));
        rmdirSync(directory);
      }
    });
  }
});
