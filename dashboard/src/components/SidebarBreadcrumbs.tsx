import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getProject } from "@/lib/api";
import { projectTabFromPath } from "@/lib/project-routes";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

type Crumb = { label: string; to?: string };

const tabLabels: Record<string, string> = {
  overview: "Overview",
  deployments: "Deployments",
  domains: "Domains",
  cron: "Cron Jobs",
  logs: "Runtime Logs",
  settings: "Settings",
};

function crumbsForPath(pathname: string, projectName: string | null): Crumb[] {
  if (pathname === "/" || pathname === "") return [{ label: "Overview" }];
  if (pathname === "/activity") return [{ label: "Logs" }];
  if (pathname === "/deployments") return [{ label: "Deployments" }];
  if (pathname === "/projects") return [{ label: "Projects" }];
  if (pathname === "/projects/new") return [{ label: "Projects", to: "/projects" }, { label: "New Project" }];
  if (pathname === "/databases") return [{ label: "Databases" }];
  if (pathname === "/cron") return [{ label: "Cron Jobs" }];
  if (pathname === "/system") return [{ label: "Observability" }];
  if (pathname === "/settings") return [{ label: "Settings" }];
  if (pathname === "/dashboard/integrations") return [{ label: "Integrations" }];

  const deployM = pathname.match(/^\/projects\/([^/]+)\/deploy\/([^/]+)$/);
  if (deployM) {
    const pid = deployM[1];
    return [
      { label: "Projects", to: "/projects" },
      { label: projectName ?? "Project", to: `/projects/${pid}` },
      { label: "Deploy log" },
    ];
  }

  const projM = pathname.match(/^\/projects\/([^/]+)/);
  if (projM) {
    const pid = projM[1];
    const tab = projectTabFromPath(pathname, pid);
    const crumbs: Crumb[] = [
      { label: "Projects", to: "/projects" },
      { label: projectName ?? `Project ${pid.slice(0, 8)}`, to: `/projects/${pid}` },
    ];
    if (tab !== "overview") {
      crumbs.push({ label: tabLabels[tab] ?? tab });
    }
    return crumbs;
  }

  return [{ label: pathname }];
}

export function SidebarBreadcrumbs() {
  const { pathname } = useLocation();
  const { state: sidebarState } = useSidebar();
  const [projectName, setProjectName] = useState<string | null>(null);

  useEffect(() => {
    const m = pathname.match(/^\/projects\/([^/]+)/);
    if (!m?.[1]) {
      queueMicrotask(() => setProjectName(null));
      return;
    }
    let cancelled = false;
    void getProject(m[1])
      .then((r) => {
        if (!cancelled) setProjectName(r.project.name);
      })
      .catch(() => {
        if (!cancelled) setProjectName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const crumbs = useMemo(() => crumbsForPath(pathname, projectName), [pathname, projectName]);
  const visible = sidebarState === "collapsed" ? crumbs.slice(-1) : crumbs;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex flex-wrap items-center gap-1 text-xs text-neutral-500",
        sidebarState === "collapsed" && "justify-center"
      )}
    >
      {visible.map((c, i) => (
        <span key={`${c.label}-${i}`} className="flex items-center gap-1">
          {i > 0 ? <span className="text-neutral-700">/</span> : null}
          {c.to ? (
            <Link
              to={c.to}
              className="truncate text-neutral-400 underline-offset-2 hover:text-white hover:underline"
            >
              {c.label}
            </Link>
          ) : (
            <span className="truncate font-medium text-neutral-200">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
