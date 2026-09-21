import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getProject, type Project } from "@/lib/api";
import { projectTabFromPath } from "@/lib/project-routes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavIconChevronsUpDown } from "@/components/nav-icons";

interface SidebarBreadcrumbsProps {
  projects?: Project[];
}

export function SidebarBreadcrumbs({ projects = [] }: SidebarBreadcrumbsProps) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [projectName, setProjectName] = useState<string | null>(null);

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

  // Determine current page title
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
    <div className="flex h-12 w-full items-center justify-between px-4">
      {/* LEFT: Project Switcher Dropdown (Vercel Style: <Avatar> <Name> ⇅) */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-neutral-200 hover:bg-neutral-800/80 transition-colors focus:outline-none">
            {currentProjectId ? (
              <>
                <span className="flex size-4 items-center justify-center rounded bg-blue-600/80 text-[10px] font-bold text-white uppercase shadow-sm">
                  {projectName ? projectName.charAt(0) : "P"}
                </span>
                <span className="font-semibold text-white truncate max-w-[140px] sm:max-w-[200px]">
                  {projectName || "Project"}
                </span>
              </>
            ) : (
              <>
                <span className="flex size-4 items-center justify-center rounded bg-neutral-800 text-[10px] font-bold text-white shadow-sm">
                  VG
                </span>
                <span className="font-semibold text-white">VersionGate</span>
              </>
            )}
            <NavIconChevronsUpDown className="size-3 text-neutral-500" />
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
                className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300 hover:text-white"
              >
                <span className="flex size-3.5 items-center justify-center rounded bg-neutral-800 text-[9px] font-semibold text-neutral-300">
                  {p.name.charAt(0).toUpperCase()}
                </span>
                <span className="truncate">{p.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* CENTER: Exact Page Title matching screenshot ("Overview", "Deployments", "Project Settings", etc.) */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center">
        <span className="text-xs font-semibold text-neutral-300 tracking-wide">
          {pageTitle}
        </span>
      </div>

      {/* RIGHT: Live Status Action Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate("/status")}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/90 px-3 py-1 font-mono text-xs font-medium text-neutral-300 hover:border-neutral-700 hover:text-white transition-colors"
        >
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          <span>Status</span>
        </button>
      </div>
    </div>
  );
}

