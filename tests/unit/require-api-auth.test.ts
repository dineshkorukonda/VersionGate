import { describe, test, expect, beforeEach, afterEach } from "bun:test";
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
});
