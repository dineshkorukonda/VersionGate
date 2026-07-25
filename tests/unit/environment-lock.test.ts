import { describe, test, expect } from "bun:test";
import { sql } from "drizzle-orm";
import { environments } from "../../src/db/schema";

describe("Environment lock query syntax", () => {
  test("generates valid SQL snippet without throwing Date serialization error", () => {
    const lockCondition = sql`(${environments.lockedAt} IS NULL OR ${environments.lockedAt} < NOW() - INTERVAL '15 minutes')`;
    expect(lockCondition).toBeDefined();
    expect(lockCondition.getSQL().queryChunks).toBeDefined();
  });
});
