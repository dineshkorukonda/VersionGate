import { describe, expect, spyOn, test } from "bun:test";
import { fetchReposFromRelay } from "../../src/utils/github/github-relay";

describe("relay TLS validation", () => {
  test("does not retry certificate failures with verification disabled", async () => {
    const fetchMock = spyOn(globalThis, "fetch").mockRejectedValue(new Error("TLS certificate validation failed"));
    try {
      await expect(fetchReposFromRelay({
        installationId: "123", relaySecret: "test-secret", relayOrigin: "https://relay.example.test",
      })).rejects.toThrow("TLS certificate validation failed");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][1]).not.toHaveProperty("tls");
    } finally { fetchMock.mockRestore(); }
  });
});
