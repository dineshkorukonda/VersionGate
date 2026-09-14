import { describe, test, expect } from "bun:test";
import { ProjectRepository } from "../../src/repositories/project.repository";
import { listProjectsSummaryHandler, listProjectsHandler } from "../../src/controllers/project.controller";

describe("Aggregated Project Overview Summary", () => {
  test("ProjectRepository has getProjectsSummary method", () => {
    const repo = new ProjectRepository();
    expect(typeof repo.getProjectsSummary).toBe("function");
  });

  test("listProjectsSummaryHandler is defined as a Fastify handler", () => {
    expect(typeof listProjectsSummaryHandler).toBe("function");
    expect(typeof listProjectsHandler).toBe("function");
  });
});
