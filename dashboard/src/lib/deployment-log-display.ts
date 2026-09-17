import type { Deployment } from "@/lib/api";

export function deploymentDurationMs(start: string, end: string): number {
  return Math.max(0, new Date(end).getTime() - new Date(start).getTime());
}

export function formatDeploymentDuration(start: string, end: string): string {
  const sec = Math.floor(deploymentDurationMs(start, end) / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  return `${min}m ${sec % 60}s`;
}

export function formatDeploymentDate(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function deploymentStatusDotClass(status: string): string {
  if (status === "ACTIVE") return "bg-emerald-500";
  if (status === "DEPLOYING") return "bg-sky-400 animate-pulse";
  if (status === "FAILED") return "bg-red-500";
  if (status === "ROLLED_BACK") return "bg-amber-500";
  return "bg-neutral-500";
}

export function deploymentStatusLabel(status: string): string {
  if (status === "ACTIVE") return "Ready";
  if (status === "DEPLOYING") return "Building";
  if (status === "FAILED") return "Error";
  if (status === "ROLLED_BACK") return "Rolled back";
  return status;
}

export function isProductionEnvironment(envName?: string | null): boolean {
  return (envName ?? "").toLowerCase() === "production";
}

export function deploymentRowLabel(d: Deployment): string {
  return d.commitMessage?.trim() || `Deployment v${d.version}`;
}

export function deploymentShortHash(d: Deployment): string {
  return d.commitSha?.slice(0, 7) ?? d.id.slice(0, 7);
}

export function deploymentBranchLabel(d: Deployment): string {
  return d.commitBranch || d.environmentBranch || "main";
}

export function sortDeploymentsNewestFirst(deployments: Deployment[]): Deployment[] {
  return [...deployments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
