import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { PgDialect } from "drizzle-orm/pg-core";
import * as client from "../../src/db/client";
import redis from "../../src/services/redis.service";
import { EnvironmentRepository } from "../../src/repositories/environment.repository";

describe("deployment lease ownership", () => {
  const restores: Array<() => void> = [];
  afterEach(() => { restores.splice(0).reverse().forEach((restore) => restore()); });

  function database(results: unknown[][]) {
    const queries: Array<{ sql: string; params: unknown[] }> = [];
    const db = { update: () => ({ set: () => ({ where: (condition: any) => {
      queries.push(new PgDialect().sqlToQuery(condition));
      return { returning: async () => results.shift() ?? [] };
    } }) }) };
    const mock = spyOn(client, "getDb").mockReturnValue(db as any);
    restores.push(() => mock.mockRestore());
    return queries;
  }

  test("renews with its owner and fences a worker after ownership changes", async () => {
    const available = spyOn(redis, "isAvailable").mockReturnValue(false);
    restores.push(() => available.mockRestore());
    const queries = database([[{ id: "env" }], [{ id: "env" }], []]);
    const repo = new EnvironmentRepository();
    try {
      expect(await repo.acquireDeployLock("env")).toBe(true);
      expect(await repo.acquireDeployLock("env")).toBe(false);
      await repo.assertDeployLock("env");
      await expect(repo.assertDeployLock("env")).rejects.toThrow("ownership lost");
      expect(queries[1].sql).toContain('"Environment"."lockOwner"');
      expect(queries[1].params[1]).toEqual(queries[2].params[1]);
    } finally { await repo.releaseDeployLock("env"); }
    expect(queries.at(-1)?.params[1]).toEqual(queries[1].params[1]);
    const unrelated = new EnvironmentRepository();
    const count = queries.length;
    await unrelated.releaseDeployLock("env");
    expect(queries.length).toBe(count);
  });

  test("releases the Redis owner when database lock acquisition fails", async () => {
    const available = spyOn(redis, "isAvailable").mockReturnValue(true);
    const acquire = spyOn(redis, "acquireLock").mockResolvedValue(true);
    const release = spyOn(redis, "releaseLock").mockResolvedValue();
    restores.push(() => available.mockRestore(), () => acquire.mockRestore(), () => release.mockRestore());
    database([[]]);
    expect(await new EnvironmentRepository().acquireDeployLock("env")).toBe(false);
    expect(release).toHaveBeenCalledWith("env:env", acquire.mock.calls[0][2]);
  });
});
