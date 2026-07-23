import type { Deployment, Project } from "@/lib/api";

export type DeploymentColor = "BLUE" | "GREEN";

/** Hostname from Settings / setup (`PUBLIC_DOMAIN`), used for Open / Live links. */
let configuredPublicHost: string | null = null;

export function isLoopbackHostname(host: string): boolean {
  const h = host.trim().toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "0.0.0.0";
}

/** Call when instance settings load so app links use the public IP/domain, not an SSH-tunnel host. */
export function setConfiguredPublicHost(host: string | null | undefined): void {
  const h = (host ?? "").trim();
  configuredPublicHost = h && !isLoopbackHostname(h) ? h : null;
}

export function getConfiguredPublicHost(): string | null {
  return configuredPublicHost;
}

export function isDeploymentColor(c: string): c is DeploymentColor {
  return c === "BLUE" || c === "GREEN";
}

/** Most recent deployment row for a color (by `createdAt`). */
export function latestDeploymentForColor(
  deployments: Deployment[],
  color: DeploymentColor
): Deployment | undefined {
  const rows = deployments.filter((d) => d.color === color);
  if (rows.length === 0) return undefined;
  return rows.reduce((a, b) => (new Date(b.createdAt) > new Date(a.createdAt) ? b : a));
}

/** Full URL to hit the app health check on a host slot (browser / curl). */
export function healthCheckUrl(project: Project, hostPort: number): string {
  const base = publicServiceUrl(hostPort).replace(/\/$/, "");
  const path = project.healthPath.startsWith("/") ? project.healthPath : `/${project.healthPath}`;
  return `${base}${path}`;
}

/** Published host port for blue/green (maps to Docker publish). */
export function hostPortForSlot(project: Project, color: string): number {
  if (color === "GREEN") return project.basePort + 1;
  return project.basePort;
}

export function slotLabel(color: string): string {
  if (color === "GREEN") return "Green";
  if (color === "BLUE") return "Blue";
  return color;
}

/**
 * Prefer PUBLIC_DOMAIN (non-loopback), then an explicit hostname, then the browser host
 * when it is not loopback (so SSH tunnels at 127.0.0.1 do not poison Open links).
 */
export function resolvePublicHostname(hostname?: string): string {
  const explicit = hostname?.trim();
  if (explicit && !isLoopbackHostname(explicit)) return explicit;
  if (configuredPublicHost) return configuredPublicHost;
  const fromWindow = typeof window !== "undefined" ? window.location.hostname : "";
  if (fromWindow && !isLoopbackHostname(fromWindow)) return fromWindow;
  if (explicit) return explicit;
  return fromWindow || "localhost";
}

export function publicServiceUrl(port: number, hostname?: string): string {
  const host = resolvePublicHostname(hostname);
  const windowProto =
    typeof window !== "undefined" && window.location.protocol === "https:" ? "https" : "http";
  // IPv4 public hosts are almost always plain HTTP on the published Docker port.
  const proto = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ? "http" : windowProto;
  if (port === 80 && proto === "http") return `${proto}://${host}`;
  if (port === 443 && proto === "https") return `${proto}://${host}`;
  return `${proto}://${host}:${port}`;
}

/** production = project.basePort; staging +200; development +400 (see project.repository). */
export function guessEnvironmentLabel(project: Project, deployment: Deployment): string {
  const p = deployment.port;
  const base = project.basePort;
  if (p === base || p === base + 1) return "production";
  if (p === base + 200 || p === base + 201) return "staging";
  if (p === base + 400 || p === base + 401) return "development";
  return "—";
}

/** Prefer production when several envs are ACTIVE (lowest published port). */
function preferProductionSlot(rows: Deployment[]): Deployment | undefined {
  if (rows.length === 0) return undefined;
  return rows.reduce((a, b) => (a.port <= b.port ? a : b));
}

export function getDeployingDeployment(
  projectId: string,
  deployments: Deployment[]
): Deployment | undefined {
  const rows = deployments.filter((d) => d.projectId === projectId && d.status === "DEPLOYING");
  return preferProductionSlot(rows);
}

export function getActiveDeployment(
  projectId: string,
  deployments: Deployment[]
): Deployment | undefined {
  const rows = deployments.filter((d) => d.projectId === projectId && d.status === "ACTIVE");
  return preferProductionSlot(rows);
}

/** Prefer in-flight deploy row for slot/port; else live active (production preferred). */
export function getDisplayDeployment(
  projectId: string,
  deployments: Deployment[]
): Deployment | undefined {
  return (
    getDeployingDeployment(projectId, deployments) ??
    getActiveDeployment(projectId, deployments) ??
    undefined
  );
}
