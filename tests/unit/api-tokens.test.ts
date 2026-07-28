import { describe, test, expect } from "bun:test";
import { getUserFromApiToken } from "../../src/services/auth.service";

describe("API Token Authentication Helper", () => {
  test("getUserFromApiToken returns null for empty or invalid token format", async () => {
    expect(await getUserFromApiToken(undefined)).toBeNull();
    expect(await getUserFromApiToken("")).toBeNull();
    expect(await getUserFromApiToken("invalid_prefix_12345")).toBeNull();
  });
});
