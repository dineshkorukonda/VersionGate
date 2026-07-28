import { describe, test, expect } from "bun:test";
import { parseProjectEnv } from "../../src/utils/env";

describe("Per-Environment Env Merging", () => {
  test("merges global project env with stage environment env overrides", () => {
    const projectEnv = parseProjectEnv({ NODE_ENV: "production", API_URL: "https://api.example.com", DB_HOST: "localhost" });
    const stageEnv = parseProjectEnv({ NODE_ENV: "staging", API_URL: "https://staging-api.example.com" });

    const merged = { ...projectEnv, ...stageEnv };

    expect(merged["NODE_ENV"]).toBe("staging");
    expect(merged["API_URL"]).toBe("https://staging-api.example.com");
    expect(merged["DB_HOST"]).toBe("localhost");
  });
});
