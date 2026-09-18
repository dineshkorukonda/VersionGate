export type ProjectTab =
  | "overview"
  | "deployments"
  | "logs"
  | "observability"
  | "env"
  | "domains"
  | "databases"
  | "cron"
  | "settings";

export type ProjectSettingsSubtab =
  | "general"
  | "build"
  | "env"
  | "domains"
  | "cron"
  | "git"
  | "security";

export function projectTabFromPath(pathname: string, projectId: string): ProjectTab {
  const base = `/projects/${projectId}`;
  if (!pathname.startsWith(base)) return "overview";
  if (pathname.includes("/deploy/")) return "deployments";
  const suffix = pathname.slice(base.length);
  if (!suffix || suffix === "/") return "overview";
  if (suffix.startsWith("/deployments")) return "deployments";
  if (suffix.startsWith("/logs")) return "logs";
  if (suffix.startsWith("/observability")) return "observability";
  if (suffix.startsWith("/env")) return "env";
  if (suffix.startsWith("/domains")) return "domains";
  if (suffix.startsWith("/databases")) return "databases";
  if (suffix.startsWith("/cron")) return "cron";
  if (suffix.startsWith("/settings")) return "settings";
  return "overview";
}

export function projectTabPath(projectId: string, tab: ProjectTab): string {
  const base = `/projects/${projectId}`;
  switch (tab) {
    case "overview":
      return base;
    case "deployments":
      return `${base}/deployments`;
    case "logs":
      return `${base}/logs`;
    case "observability":
      return `${base}/observability`;
    case "env":
      return `${base}/env`;
    case "domains":
      return `${base}/domains`;
    case "databases":
      return `${base}/databases`;
    case "cron":
      return `${base}/cron`;
    case "settings":
      return `${base}/settings`;
    default:
      return base;
  }
}
