export type ProjectTab = "overview" | "deployments" | "domains" | "cron" | "logs" | "settings";

export function projectTabFromPath(pathname: string, projectId: string): ProjectTab {
  const base = `/projects/${projectId}`;
  if (!pathname.startsWith(base)) return "overview";
  if (pathname.includes("/deploy/")) return "deployments";
  const suffix = pathname.slice(base.length);
  if (!suffix || suffix === "/") return "overview";
  if (suffix.startsWith("/deployments")) return "deployments";
  if (suffix.startsWith("/domains")) return "domains";
  if (suffix.startsWith("/cron")) return "cron";
  if (suffix.startsWith("/logs")) return "logs";
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
    case "domains":
      return `${base}/domains`;
    case "cron":
      return `${base}/cron`;
    case "logs":
      return `${base}/logs`;
    case "settings":
      return `${base}/settings`;
    default:
      return base;
  }
}
