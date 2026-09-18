import { useState, useMemo } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { authLogout, type Project } from "@/lib/api";
import { projectTabFromPath } from "@/lib/project-routes";

interface VercelNavbarProps {
  projects: Project[];
  userEmail: string | null;
  onOpenSearch: () => void;
  onNewProject: () => void;
}

const workspaceTabs = [
  { to: "/", label: "Overview", end: true },
  { to: "/projects", label: "Projects", end: true },
  { to: "/deployments", label: "Deployments", end: false },
  { to: "/databases", label: "Databases", end: false },
  { to: "/cron", label: "Cron Jobs", end: false },
  { to: "/activity", label: "Logs", end: false },
  { to: "/dashboard/integrations", label: "Integrations", end: false },
  { to: "/system", label: "Observability", end: false },
  { to: "/settings", label: "Settings", end: false },
];

export function VercelNavbar({
  projects,
  userEmail,
  onOpenSearch,
  onNewProject,
}: VercelNavbarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [projectSearch, setProjectSearch] = useState("");

  // Determine if we are within a project route
  const projectMatch = pathname.match(/^\/projects\/([^/]+)/);
  const currentProjectId =
    projectMatch && projectMatch[1] !== "new" ? projectMatch[1] : null;
  const currentProject = projects.find((p) => p.id === currentProjectId);

  // Determine active project tab
  const activeProjectTab = currentProjectId
    ? projectTabFromPath(pathname, currentProjectId)
    : "overview";

  const isDeployLog = Boolean(
    pathname.match(/^\/projects\/[^/]+\/deploy\/[^/]+$/)
  );

  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) return projects;
    const q = projectSearch.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.repoUrl.toLowerCase().includes(q)
    );
  }, [projects, projectSearch]);

  const avatarLetter = userEmail?.trim()?.[0]?.toUpperCase() ?? "U";

  const handleSignOut = () => {
    void authLogout()
      .then(() => navigate("/login", { replace: true }))
      .catch(() => navigate("/login", { replace: true }));
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-black/95 backdrop-blur-md">
      {/* Top Bar: Brand, Scope Switcher, Project Switcher, Global Actions */}
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand + Scope Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Vercel Triangle Mark */}
          <Link
            to="/"
            className="flex items-center justify-center text-white transition-opacity hover:opacity-80 shrink-0"
            title="VersionGate Dashboard"
          >
            <svg
              viewBox="0 0 76 65"
              fill="currentColor"
              className="h-5 w-auto text-white"
            >
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
          </Link>

          {/* Breadcrumb Separator */}
          <span className="text-neutral-700 select-none text-base font-light">
            /
          </span>

          {/* Workspace / Team Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className="flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-neutral-900 focus:outline-none cursor-pointer"
            >
              <div className="size-5 rounded-full bg-gradient-to-tr from-neutral-800 to-neutral-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {avatarLetter}
              </div>
              <span className="truncate max-w-[120px] sm:max-w-[160px]">
                Personal
              </span>
              <span className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 text-[9px] font-semibold text-neutral-400">
                Hobby
              </span>
              <svg
                viewBox="0 0 16 16"
                fill="currentColor"
                className="size-3 text-neutral-500 shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-56 border-neutral-800 bg-[#0a0a0a] text-white text-xs"
            >
              <div className="px-3 py-2 border-b border-neutral-800">
                <p className="text-[11px] text-neutral-500">Signed in as</p>
                <p className="font-mono text-neutral-200 truncate mt-0.5">
                  {userEmail || "admin"}
                </p>
              </div>
              <DropdownMenuItem
                onClick={() => navigate("/settings")}
                className="cursor-pointer text-neutral-300 hover:text-white"
              >
                Workspace Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/system")}
                className="cursor-pointer text-neutral-300 hover:text-white"
              >
                System Observability
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-neutral-800" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer text-red-400 hover:text-red-300"
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Project Switcher (When inside a project) */}
          {currentProjectId ? (
            <>
              <span className="text-neutral-700 select-none text-base font-light">
                /
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger
                  type="button"
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-neutral-900 focus:outline-none max-w-[160px] sm:max-w-[220px] cursor-pointer"
                >
                  <div className="size-5 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {currentProject
                      ? currentProject.name.charAt(0).toUpperCase()
                      : "P"}
                  </div>
                  <span className="truncate font-semibold">
                    {currentProject ? currentProject.name : "Project"}
                  </span>
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="size-3 text-neutral-500 shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-64 border-neutral-800 bg-[#0a0a0a] text-white p-1 text-xs"
                >
                  <div className="p-1.5">
                    <input
                      type="text"
                      placeholder="Find project..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs text-white placeholder-neutral-500 focus:border-neutral-600 focus:outline-none"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-0.5 py-1">
                    {filteredProjects.map((p) => (
                      <DropdownMenuItem
                        key={p.id}
                        onClick={() => navigate(`/projects/${p.id}`)}
                        className={cn(
                          "flex items-center justify-between cursor-pointer rounded px-2 py-1.5",
                          p.id === currentProjectId
                            ? "bg-neutral-800/80 text-white font-medium"
                            : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="size-4 rounded bg-neutral-800 text-center text-[9px] leading-4 text-neutral-300 font-bold shrink-0">
                            {p.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="truncate">{p.name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-neutral-500">
                          :{p.appPort}
                        </span>
                      </DropdownMenuItem>
                    ))}
                    {filteredProjects.length === 0 ? (
                      <p className="py-2 text-center text-xs text-neutral-500">
                        No projects found
                      </p>
                    ) : null}
                  </div>
                  <DropdownMenuSeparator className="bg-neutral-800" />
                  <DropdownMenuItem
                    onClick={() => {
                      onNewProject();
                    }}
                    className="cursor-pointer text-neutral-300 hover:text-white gap-2 font-medium"
                  >
                    <span>+</span>
                    <span>Create New Project</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/projects")}
                    className="cursor-pointer text-neutral-400 hover:text-white"
                  >
                    View All Projects →
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : null}
        </div>

        {/* Right: Search, Feedback, Docs, Engine Online Status, Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search Input Pill */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-xs text-neutral-400 transition-colors hover:border-neutral-700 hover:text-white cursor-pointer"
          >
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              className="size-3 text-neutral-500"
            >
              <path
                fillRule="evenodd"
                d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline-block rounded border border-neutral-800 bg-neutral-900 px-1 py-0.2 font-mono text-[10px] text-neutral-500">
              ⌘K
            </kbd>
          </button>

          {/* Feedback */}
          <a
            href="https://github.com/dineshkorukonda/VersionGate/issues"
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex text-xs text-neutral-400 hover:text-white transition-colors px-2 py-1"
          >
            Feedback
          </a>

          {/* Docs */}
          <a
            href="https://github.com/dineshkorukonda/VersionGate#readme"
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex text-xs text-neutral-400 hover:text-white transition-colors px-2 py-1"
          >
            Docs
          </a>

          {/* Engine Status Dot */}
          <Link
            to="/system"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-950 px-2.5 py-0.5 text-[11px] text-neutral-400 hover:border-neutral-700 transition-colors"
            title="Engine Observability"
          >
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Online</span>
          </Link>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className="size-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-white hover:border-neutral-500 transition-colors focus:outline-none cursor-pointer"
            >
              {avatarLetter}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 border-neutral-800 bg-[#0a0a0a] text-white text-xs"
            >
              <div className="px-3 py-2 border-b border-neutral-800">
                <p className="text-[11px] text-neutral-500">VersionGate Admin</p>
                <p className="font-mono text-neutral-200 truncate">
                  {userEmail || "admin"}
                </p>
              </div>
              <DropdownMenuItem
                onClick={() => navigate("/settings")}
                className="cursor-pointer text-neutral-300 hover:text-white"
              >
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/system")}
                className="cursor-pointer text-neutral-300 hover:text-white"
              >
                Observability
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-neutral-800" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer text-red-400 hover:text-red-300"
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Sub-Nav Bar: Contextual Tabs (Workspace vs Project) */}
      <div className="border-t border-neutral-900 bg-black">
        <div className="mx-auto flex max-w-7xl items-center overflow-x-auto px-4 sm:px-6 lg:px-8 scrollbar-none">
          {currentProjectId ? (
            /* Inside Project: Project Tabs */
            <nav className="flex space-x-1 sm:space-x-4">
              <NavLink
                to={`/projects/${currentProjectId}`}
                end
                className={() =>
                  cn(
                    "border-b-2 px-2.5 py-2.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                    activeProjectTab === "overview" && !isDeployLog
                      ? "border-white text-white"
                      : "border-transparent text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                  )
                }
              >
                Overview
              </NavLink>
              <NavLink
                to={`/projects/${currentProjectId}/deployments`}
                className={() =>
                  cn(
                    "border-b-2 px-2.5 py-2.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                    activeProjectTab === "deployments" || isDeployLog
                      ? "border-white text-white"
                      : "border-transparent text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                  )
                }
              >
                Deployments
              </NavLink>
              <NavLink
                to={`/projects/${currentProjectId}/domains`}
                className={() =>
                  cn(
                    "border-b-2 px-2.5 py-2.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                    activeProjectTab === "domains"
                      ? "border-white text-white"
                      : "border-transparent text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                  )
                }
              >
                Domains
              </NavLink>
              <NavLink
                to={`/projects/${currentProjectId}/logs`}
                className={() =>
                  cn(
                    "border-b-2 px-2.5 py-2.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                    activeProjectTab === "logs"
                      ? "border-white text-white"
                      : "border-transparent text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                  )
                }
              >
                Runtime Logs
              </NavLink>
              <NavLink
                to={`/projects/${currentProjectId}/cron`}
                className={() =>
                  cn(
                    "border-b-2 px-2.5 py-2.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                    activeProjectTab === "cron"
                      ? "border-white text-white"
                      : "border-transparent text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                  )
                }
              >
                Cron Jobs
              </NavLink>
              <NavLink
                to={`/projects/${currentProjectId}/settings`}
                className={() =>
                  cn(
                    "border-b-2 px-2.5 py-2.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                    activeProjectTab === "settings"
                      ? "border-white text-white"
                      : "border-transparent text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                  )
                }
              >
                Settings
              </NavLink>
            </nav>
          ) : (
            /* Workspace Scope: Workspace Tabs */
            <nav className="flex space-x-1 sm:space-x-3">
              {workspaceTabs.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    cn(
                      "border-b-2 px-2.5 py-2.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "border-white text-white"
                        : "border-transparent text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                    )
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
