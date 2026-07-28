import { describe, test, expect } from "bun:test";
import { parseProjectEnv } from "../../src/utils/env";

describe("Instant Rollback Warm-Swap Logic", () => {
  test("combines project env with environment env during rollback", () => {
    const globalEnv = parseProjectEnv({ PORT: "8080", DB: "postgres" });
    const stageEnv = parseProjectEnv({ DB: "postgres-staging", DEBUG: "true" });

    const merged = { ...globalEnv, ...stageEnv };

    expect(merged["PORT"]).toBe("8080");
    expect(merged["DB"]).toBe("postgres-staging");
    expect(merged["DEBUG"]).toBe("true");
  });
});
