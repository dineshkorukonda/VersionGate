import type { Deployment } from "@/lib/api";
import { getActiveDeployment, getDeployingDeployment } from "@/lib/deployment-display";

/** Derives a single rollout state for a project from its deployment rows. */
export function projectDeploymentStatus(projectId: string, deployments: Deployment[]): string {
  const mine = deployments.filter((d) => d.projectId === projectId);
  if (getDeployingDeployment(projectId, deployments)) return "DEPLOYING";
  if (getActiveDeployment(projectId, deployments)) return "ACTIVE";
  const last = mine.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  if (last?.status === "FAILED") return "FAILED";
  if (last?.status === "ROLLED_BACK") return "ROLLED_BACK";
  return "PENDING";
}
