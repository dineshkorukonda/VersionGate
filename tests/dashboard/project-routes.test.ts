import { describe, test, expect } from "bun:test";
import {
  projectTabFromPath,
  projectTabPath,
  type ProjectTab,
} from "../../dashboard/src/lib/project-routes";

describe("project-routes", () => {
  const projectId = "abc-123";

  test("projectTabFromPath resolves overview and tab suffixes", () => {
    expect(projectTabFromPath(`/projects/${projectId}`, projectId)).toBe("overview");
    expect(projectTabFromPath(`/projects/${projectId}/deployments`, projectId)).toBe("deployments");
    expect(projectTabFromPath(`/projects/${projectId}/logs`, projectId)).toBe("logs");
    expect(projectTabFromPath(`/projects/${projectId}/settings`, projectId)).toBe("settings");
    expect(projectTabFromPath(`/projects/${projectId}/deploy/job-1`, projectId)).toBe("deployments");
  });

  test("projectTabPath builds canonical paths", () => {
    const tabs: ProjectTab[] = [
      "overview",
      "deployments",
      "logs",
      "observability",
      "env",
      "domains",
      "databases",
      "cron",
      "settings",
    ];
    expect(projectTabPath(projectId, "overview")).toBe(`/projects/${projectId}`);
    expect(projectTabPath(projectId, "cron")).toBe(`/projects/${projectId}/cron`);
    for (const tab of tabs) {
      expect(projectTabPath(projectId, tab)).toContain(`/projects/${projectId}`);
    }
  });
});
