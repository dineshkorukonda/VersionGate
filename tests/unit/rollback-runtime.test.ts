import { describe, expect, spyOn, test } from "bun:test";
import { RollbackService } from "../../src/services/rollback.service";
import { ProjectRepository } from "../../src/repositories/project.repository";
import { EnvironmentRepository } from "../../src/repositories/environment.repository";
import { DeploymentRepository } from "../../src/repositories/deployment.repository";
import { TrafficService } from "../../src/services/traffic.service";
import { ValidationService } from "../../src/services/validation.service";
import * as docker from "../../src/utils/docker";
import * as domains from "../../src/services/project-domain.service";

describe("rollback traffic isolation", () => {
  for (const environment of ["production", "staging", "development"]) {
    test(`${environment} rollback updates only its intended traffic`, async () => {
      const mocks = [
        spyOn(ProjectRepository.prototype, "findById").mockResolvedValue({ id: "project", name: "test", deploymentType: "docker", env: {}, healthPath: "/health" } as any),
        spyOn(EnvironmentRepository.prototype, "findById").mockResolvedValue({ id: "env", projectId: "project", name: environment, env: {}, appPort: 3000 } as any),
        spyOn(DeploymentRepository.prototype, "findActiveForEnvironment").mockResolvedValue({ id: "current", version: 2, containerName: "current" } as any),
        spyOn(DeploymentRepository.prototype, "findPreviousForEnvironment").mockResolvedValue({ id: "previous", version: 1, containerName: "previous", port: 10000 } as any),
        spyOn(DeploymentRepository.prototype, "updateStatus").mockResolvedValue({} as any),
        spyOn(docker, "inspectContainer").mockResolvedValue(true),
        spyOn(docker, "stopContainer").mockResolvedValue(),
        spyOn(docker, "removeContainer").mockResolvedValue(),
        spyOn(ValidationService.prototype, "validate").mockResolvedValue({ success: true } as any),
      ];
      const traffic = spyOn(TrafficService.prototype, "switchTrafficTo").mockResolvedValue();
      const domain = spyOn(domains, "syncCustomDomainUpstream").mockResolvedValue();
      try {
        await new RollbackService().rollback("project", "env");
        expect(traffic).toHaveBeenCalledTimes(environment === "production" ? 1 : 0);
        expect(domain).toHaveBeenCalledTimes(environment === "production" ? 1 : 0);
        if (environment === "production") expect(traffic).toHaveBeenCalledWith(10000, { projectName: "test", environmentName: "production" });
      } finally { [...mocks, traffic, domain].reverse().forEach((mock) => mock.mockRestore()); }
    });
  }
});
