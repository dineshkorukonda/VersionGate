import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test";
import * as auth from "../../src/services/auth.service";
import { listApiTokensHandler, createApiTokenHandler, revokeApiTokenHandler } from "../../src/controllers/auth.controller";
import { requireApiAuth, AuthedRequest } from "../../src/middleware/require-api-auth";

describe("requireApiAuth middleware", () => {
  let origDbUrl: string | undefined;

  beforeEach(() => {
    origDbUrl = process.env.DATABASE_URL;
  });

  afterEach(() => {
    process.env.DATABASE_URL = origDbUrl;
  });

  test("allows public API paths when database is not configured", async () => {
    delete process.env.DATABASE_URL;
    let codeSent = 0;

    const req = { url: "/api/v1/setup/status" } as AuthedRequest;
    const reply = {
      code: (c: number) => ({
        send: async () => {
          codeSent = c;
        },
      }),
    } as any;

    await requireApiAuth(req, reply);
    expect(codeSent).toBe(0); // Allowed through
  });

  test("blocks non-public API paths with 503 when database is not configured", async () => {
    delete process.env.DATABASE_URL;
    let codeSent = 0;
    let payloadSent: any = null;

    const req = { url: "/api/v1/projects" } as AuthedRequest;
    const reply = {
      code: (c: number) => ({
        send: async (payload: any) => {
          codeSent = c;
          payloadSent = payload;
        },
      }),
    } as any;

    await requireApiAuth(req, reply);
    expect(codeSent).toBe(503);
    expect(payloadSent?.code).toBe("SETUP_REQUIRED");
  });

  test("token routes authenticate sessions and support list, create and revoke", async () => {
    process.env.DATABASE_URL = "postgres://audit-test";
    const user = { id: "audit-user", email: "audit@example.test" };
    const session = spyOn(auth, "getUserFromSessionToken").mockResolvedValue(user);
    const list = spyOn(auth, "listApiTokens").mockResolvedValue([]);
    const create = spyOn(auth, "createApiToken").mockResolvedValue({
      id: "token-id", name: "test", token: "vg_test", tokenPrefix: "vg_test", createdAt: new Date(),
    });
    const revoke = spyOn(auth, "revokeApiToken").mockResolvedValue(true);
    try {
      for (const [url, handler] of [
        ["/api/v1/auth/tokens", listApiTokensHandler],
        ["/api/v1/auth/tokens", createApiTokenHandler],
        ["/api/v1/auth/tokens/token-id", revokeApiTokenHandler],
      ] as const) {
        const req = { url, headers: { cookie: "vg_session=test" }, body: { name: "test" }, params: { id: "token-id" } } as any;
        let status = 200;
        const reply = { code(c: number) { status = c; return this; }, send() { return this; } } as any;
        await requireApiAuth(req, reply);
        expect(req.authUser).toEqual(user);
        await handler(req, reply);
        expect(status).toBeLessThan(300);
      }
      expect(list).toHaveBeenCalledWith(user.id);
      expect(create).toHaveBeenCalledWith(user.id, "test");
      expect(revoke).toHaveBeenCalledWith(user.id, "token-id");
      session.mockResolvedValue(null);
      let denied = 0;
      await requireApiAuth({ url: "/api/v1/auth/tokens", headers: {} } as any, {
        code(c: number) { denied = c; return this; }, send() {},
      } as any);
      expect(denied).toBe(401);
    } finally {
      session.mockRestore(); list.mockRestore(); create.mockRestore(); revoke.mockRestore();
    }
  });
});
