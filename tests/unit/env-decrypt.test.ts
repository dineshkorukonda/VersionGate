import { describe, test, expect } from "bun:test";
import { decryptProjectEnv } from "../../src/utils/env";
import { encrypt } from "../../src/utils/crypto";

describe("decryptProjectEnv", () => {
  test("decrypts properly encrypted env values", () => {
    const secret = "supersecret123";
    const encrypted = encrypt(secret);
    const env = { API_KEY: encrypted };

    const decrypted = decryptProjectEnv(env);
    expect(decrypted.API_KEY).toBe(secret);
  });

  test("falls back gracefully to raw value if decryption fails (e.g. key mismatch or plaintext)", () => {
    const plaintextEnv = { API_KEY: "plain_text_value" };

    const result = decryptProjectEnv(plaintextEnv);
    expect(result.API_KEY).toBe("plain_text_value");
  });

  test("properly decrypts and merges project env and stage env overrides", () => {
    const projectSecret = "global-db-pass";
    const stageSecret = "staging-db-pass";
    const projectEnv = decryptProjectEnv({ DB_PASS: encrypt(projectSecret), APP_ENV: "production" });
    const stageEnv = decryptProjectEnv({ DB_PASS: encrypt(stageSecret), STAGE_FLAG: "true" });
    const merged = { ...projectEnv, ...stageEnv };

    expect(merged.DB_PASS).toBe(stageSecret);
    expect(merged.APP_ENV).toBe("production");
    expect(merged.STAGE_FLAG).toBe("true");
  });
});
