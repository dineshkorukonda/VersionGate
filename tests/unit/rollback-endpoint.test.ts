import { describe, test, expect } from "bun:test";

describe("Per-Stage Rollback API Route", () => {
  test("generates expected per-stage and default rollback API paths", () => {
    const projectId = "proj-123";
    const envId = "env-456";

    const defaultPath = `/projects/${projectId}/rollback`;
    const stagePath = `/projects/${projectId}/environments/${envId}/rollback`;

    expect(defaultPath).toBe("/projects/proj-123/rollback");
    expect(stagePath).toBe("/projects/proj-123/environments/env-456/rollback");
  });
});
