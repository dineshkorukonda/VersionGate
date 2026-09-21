import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getProject, getSystemStatusOverview, type Project } from "@/lib/api";
import { projectTabFromPath } from "@/lib/project-routes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavIconChevronsUpDown } from "@/components/nav-icons";
import { cn } from "@/lib/utils";

interface SidebarBreadcrumbsProps {
  projects?: Project[];
}

export function SidebarBreadcrumbs({ projects = [] }: SidebarBreadcrumbsProps) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [projectName, setProjectName] = useState<string | null>(null);
  const [overallStatus, setOverallStatus] = useState<"operational" | "degraded" | "down" | "unknown">("unknown");

  const projectMatch = pathname.match(/^\/projects\/([^/]+)/);
  const currentProjectId = projectMatch && projectMatch[1] !== "new" ? projectMatch[1] : null;

  useEffect(() => {
    if (!currentProjectId) {
      queueMicrotask(() => setProjectName(null));
      return;
    }
    const found = projects.find((p) => p.id === currentProjectId);
    if (found) {
      setProjectName(found.name);
      return;
    }
    let cancelled = false;
    void getProject(currentProjectId)
      .then((r) => {
        if (!cancelled) setProjectName(r.project.name);
      })
      .catch(() => {
        if (!cancelled) setProjectName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [currentProjectId, projects]);

  useEffect(() => {
    let cancelled = false;
    const loadStatus = () => {
      void getSystemStatusOverview()
        .then((report) => {
          if (!cancelled) setOverallStatus(report.overallStatus);
        })
        .catch(() => {
          if (!cancelled) setOverallStatus("unknown");
        });
    };
    loadStatus();
    const id = window.setInterval(loadStatus, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const statusMeta = useMemo(() => {
    switch (overallStatus) {
      case "operational":
        return {
          label: "System operational",
          dotClass: "bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]",
        };
      case "degraded":
        return {
          label: "System degraded",
          dotClass: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]",
        };
      case "down":
        return {
          label: "System down",
          dotClass: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]",
        };
      default:
        return {
          label: "System status unknown",
          dotClass: "bg-neutral-500",
        };
    }
  }, [overallStatus]);

  const pageTitle = useMemo(() => {
    if (currentProjectId) {
      const tab = projectTabFromPath(pathname, currentProjectId);
      switch (tab) {
        case "overview":
          return "Overview";
        case "deployments":
          return "Deployments";
        case "logs":
          return "Logs";
        case "observability":
          return "Observability";
        case "env":
          return "Environment Variables";
        case "domains":
          return "Domains";
        case "databases":
          return "Storage";
        case "cron":
          return "Cron Jobs";
        case "settings":
          return "Project Settings";
        default:
          return "Overview";
      }
    }

    if (pathname.startsWith("/settings")) {
      const sp = new URLSearchParams(search);
      const tab = sp.get("tab") || "general";
      switch (tab) {
        case "general":
          return "Team Settings";
        case "build":
          return "Build & Deployment";
        case "network":
          return "Domains & Network";
        case "security":
          return "Security & Tokens";
        case "webhooks":
          return "Webhooks";
        case "updates":
          return "Engine Updates";
        case "advanced":
          return "Environment & System";
        default:
          return "Team Settings";
      }
    }

    if (pathname === "/" || pathname === "/projects") return "Projects";
    if (pathname.startsWith("/deployments")) return "Deployments";
    if (pathname.startsWith("/activity")) return "Activity Logs";
    if (pathname.startsWith("/databases")) return "Databases";
    if (pathname.startsWith("/status")) return "System Status";
    if (pathname.startsWith("/system")) return "System Metrics";
    if (pathname.startsWith("/integrations")) return "Integrations";

    return "VersionGate";
  }, [currentProjectId, pathname, search]);

  return (
    <div className="grid flex-1 min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
      <div className="flex min-w-0 items-center justify-start">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={currentProjectId ? "Switch project" : "Switch workspace"}
            className="flex max-w-full items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-neutral-200 hover:bg-neutral-800/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600"
          >
            {currentProjectId ? (
              <>
                <span className="flex size-4 shrink-0 items-center justify-center rounded bg-blue-600/80 text-[10px] font-bold text-white uppercase shadow-sm">
                  {projectName ? projectName.charAt(0) : "P"}
                </span>
                <span className="truncate font-semibold text-white max-w-[100px] sm:max-w-[160px]" title={projectName || "Project"}>
                  {projectName || "Project"}
                </span>
              </>
            ) : (
              <>
                <span className="flex size-4 shrink-0 items-center justify-center rounded bg-neutral-800 text-[10px] font-bold text-white shadow-sm">
                  VG
                </span>
                <span className="truncate font-semibold text-white">VersionGate</span>
              </>
            )}
            <NavIconChevronsUpDown className="size-3 shrink-0 text-neutral-500" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 border-neutral-800 bg-[#0a0a0a] text-white">
            <DropdownMenuItem
              onClick={() => navigate("/")}
              className="cursor-pointer text-xs text-neutral-300 hover:text-white"
            >
              All Projects
            </DropdownMenuItem>
            {projects.length > 0 && <DropdownMenuSeparator className="bg-neutral-800" />}
            {projects.map((p) => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="flex cursor-pointer items-center gap-2 text-xs text-neutral-300 hover:text-white"
              >
                <span className="flex size-3.5 shrink-0 items-center justify-center rounded bg-neutral-800 text-[9px] font-semibold text-neutral-300">
                  {p.name.charAt(0).toUpperCase()}
                </span>
                <span className="truncate">{p.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="min-w-0 px-1 text-center">
        <span className="block truncate text-xs font-semibold tracking-wide text-neutral-300">
          {pageTitle}
        </span>
      </div>

      <div className="flex min-w-0 items-center justify-end">
        <button
          type="button"
          onClick={() => navigate("/status")}
          aria-label={statusMeta.label}
          title={statusMeta.label}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/90 px-2.5 py-1 font-mono text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600 sm:px-3"
        >
          <span className={cn("size-1.5 shrink-0 rounded-full", statusMeta.dotClass)} />
          <span>Status</span>
        </button>
      </div>
    </div>
  );
}
