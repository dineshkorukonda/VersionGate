import { describe, expect, spyOn, test } from "bun:test";
import { RollbackService } from "../../src/services/rollback.service";
import { ProjectRepository } from "../../src/repositories/project.repository";
import { EnvironmentRepository } from "../../src/repositories/environment.repository";
import { DeploymentRepository } from "../../src/repositories/deployment.repository";
import { TrafficService } from "../../src/services/traffic.service";
import { ValidationService } from "../../src/services/validation.service";
import * as docker from "../../src/utils/docker";
import * as domains from "../../src/services/project-domain.service";
import * as pm2 from "../../src/utils/pm2";
import * as queue from "../../src/services/job-queue.service";
import { runRollbackJob } from "../../src/worker/handlers/rollback.handler";

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

describe("queued PM2 rollback", () => {
  for (const [warm, healthy] of [[true, true], [false, true], [false, false]]) {
    test(`handles warm=${warm}, healthy=${healthy} through the shared runtime service`, async () => {
      const environment = { id: "env", projectId: "project", name: "staging", env: { STAGE: "staging" }, appPort: 3000 };
      const project = { id: "project", name: "test", deploymentType: "pm2", env: { GLOBAL: "global" }, healthPath: "/health" };
      const mocks = [
        spyOn(queue, "assertJobLease").mockResolvedValue(),
        spyOn(ProjectRepository.prototype, "findById").mockResolvedValue(project as any),
        spyOn(EnvironmentRepository.prototype, "findById").mockResolvedValue(environment as any),
        spyOn(EnvironmentRepository.prototype, "acquireDeployLock").mockResolvedValue(true),
        spyOn(EnvironmentRepository.prototype, "assertDeployLock").mockResolvedValue(),
        spyOn(EnvironmentRepository.prototype, "releaseDeployLock").mockResolvedValue(),
        spyOn(DeploymentRepository.prototype, "findActiveForEnvironment").mockResolvedValue({ id: "current", version: 2, containerName: "current" } as any),
        spyOn(DeploymentRepository.prototype, "findPreviousForEnvironment").mockResolvedValue({ id: "previous", version: 1, containerName: "previous", port: 10000 } as any),
        spyOn(DeploymentRepository.prototype, "updateStatus").mockResolvedValue({} as any),
        spyOn(ValidationService.prototype, "validate").mockResolvedValue({ success: healthy, error: "unhealthy" } as any),
        spyOn(pm2, "isPm2Running").mockResolvedValue(warm),
      ];
      const restart = spyOn(pm2, "restartPm2App").mockResolvedValue();
      const stop = spyOn(pm2, "stopPm2App").mockResolvedValue();
      const dockerStart = spyOn(docker, "runContainer").mockRejectedValue(new Error("Docker must not be used"));
      const complete = spyOn(queue, "completeJob").mockResolvedValue({} as any);
      const fail = spyOn(queue, "failJob").mockResolvedValue({} as any);
      try {
        await runRollbackJob({ id: "job", projectId: "project", environment, project } as any, async () => {});
        expect(dockerStart).not.toHaveBeenCalled();
        expect(restart).toHaveBeenCalledTimes(warm ? 0 : 1);
        if (!warm) expect(restart).toHaveBeenCalledWith("previous", 10000, { GLOBAL: "global", STAGE: "staging" });
        expect(stop).toHaveBeenCalledWith(healthy ? "current" : "previous");
        expect(complete).toHaveBeenCalledTimes(healthy ? 1 : 0);
        expect(fail).toHaveBeenCalledTimes(healthy ? 0 : 1);
      } finally { [...mocks, restart, stop, dockerStart, complete, fail].reverse().forEach((mock) => mock.mockRestore()); }
    });
  }
});
