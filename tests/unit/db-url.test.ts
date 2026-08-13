import { describe, expect, test } from "bun:test";
import { normalizeDatabaseUrl } from "../../src/utils/db-url";

describe("normalizeDatabaseUrl Helper", () => {
  test("returns empty or raw string when input is falsy", () => {
    expect(normalizeDatabaseUrl("")).toBe("");
  });

  test("appends postgresql:// prefix if missing", () => {
    const raw = "user:pass@localhost:5432/versiongate";
    const res = normalizeDatabaseUrl(raw);
    expect(res).toContain("postgresql://user:pass@localhost:5432/versiongate");
  });

  test("automatically appends sslmode=require for Supabase cloud hosts", () => {
    const raw = "postgresql://postgres:pass@db.project.supabase.co:5432/postgres";
    const res = normalizeDatabaseUrl(raw);
    expect(res).toContain("sslmode=require");
  });

  test("automatically appends sslmode=require for Neon cloud hosts", () => {
    const raw = "postgres://alex:pass@ep-cool-db.us-east-2.aws.neon.tech/neondb";
    const res = normalizeDatabaseUrl(raw);
    expect(res).toContain("sslmode=require");
  });

  test("automatically appends pgbouncer=true for Supabase poolers on port 6543", () => {
    const raw = "postgres://postgres:pass@aws-0-us-east-1.pooler.supabase.com:6543/postgres";
    const res = normalizeDatabaseUrl(raw);
    expect(res).toContain("sslmode=require");
    expect(res).toContain("pgbouncer=true");
  });

  test("preserves existing query parameters when appending missing cloud params", () => {
    const raw = "postgresql://user:pass@db.supabase.co:5432/db?connect_timeout=10";
    const res = normalizeDatabaseUrl(raw);
    expect(res).toContain("connect_timeout=10");
    expect(res).toContain("sslmode=require");
  });
});
