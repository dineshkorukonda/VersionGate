import { useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authLogout, type Project } from "@/lib/api";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  NavIconArrowLeft,
  NavIconChevron,
  NavIconChevronsUpDown,
  NavIconClock,
  NavIconDatabase,
  NavIconFolder,
  NavIconGlobe,
  NavIconGrid,
  NavIconKey,
  NavIconLogs,
  NavIconPlug,
  NavIconPulse,
  NavIconRocket,
  NavIconSearch,
  NavIconSettings,
  NavIconStatus,
} from "@/components/nav-icons";

const workspaceNav = [
  { to: "/", label: "Overview", end: true, icon: NavIconGrid },
  { to: "/projects", label: "Projects", end: true, icon: NavIconFolder },
  { to: "/status", label: "Status", end: false, icon: NavIconStatus },
  { to: "/deployments", label: "Deployments", end: false, icon: NavIconRocket },
  { to: "/activity", label: "Activity", end: false, icon: NavIconLogs },
  { to: "/databases", label: "Databases", end: false, icon: NavIconDatabase },
  { to: "/cron", label: "Cron Jobs", end: false, icon: NavIconClock },
  { to: "/integrations", label: "Integrations", end: false, icon: NavIconPlug },
  { to: "/system", label: "Observability", end: false, icon: NavIconPulse },
  { to: "/settings", label: "Settings", end: false, icon: NavIconSettings },
] as const;

interface AppSidebarProps {
  projects: Project[];
  userEmail: string | null;
  onOpenSearch: () => void;
  onNewProject: () => void;
}

export function AppSidebar({ projects, userEmail, onOpenSearch, onNewProject }: AppSidebarProps) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const projectMatch = pathname.match(/^\/projects\/([^/]+)/);
  const currentProjectId = projectMatch && projectMatch[1] !== "new" ? projectMatch[1] : null;

  const isWorkspaceSettings = pathname.startsWith("/settings");

  // Determine active workspace settings tab
  const currentWorkspaceTab = useMemo(() => {
    const sp = new URLSearchParams(search);
    return sp.get("tab") || "general";
  }, [search]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        onOpenSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenSearch]);

  const username = userEmail ? userEmail.split("@")[0] : "Account";
  const avatarLetter = userEmail?.trim()?.[0]?.toUpperCase() ?? "A";

  const signOut = () => {
    void authLogout()
      .then(() => navigate("/login", { replace: true }))
      .catch(() => navigate("/login", { replace: true }));
  };

  const navLinkClass = (isActive: boolean) =>
    cn(
      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
      isActive
        ? "bg-neutral-800 text-white font-semibold"
        : "text-neutral-400 hover:bg-neutral-900/90 hover:text-neutral-200"
    );

  // Project navigation items
  const projectNav = useMemo(() => {
    if (!currentProjectId) return [];
    return [
      {
        to: `/projects/${currentProjectId}`,
        label: "Overview",
        icon: NavIconGrid,
        isActive: pathname === `/projects/${currentProjectId}`,
      },
      {
        to: `/projects/${currentProjectId}/deployments`,
        label: "Deployments",
        icon: NavIconRocket,
        isActive:
          pathname.startsWith(`/projects/${currentProjectId}/deployments`) ||
          pathname.includes(`/projects/${currentProjectId}/deploy/`),
      },
      {
        to: `/projects/${currentProjectId}/logs`,
        label: "Logs",
        icon: NavIconLogs,
        isActive: pathname.startsWith(`/projects/${currentProjectId}/logs`),
      },
      {
        to: `/projects/${currentProjectId}/observability`,
        label: "Observability",
        icon: NavIconPulse,
        isActive: pathname.startsWith(`/projects/${currentProjectId}/observability`),
      },
      {
        to: `/projects/${currentProjectId}/env`,
        label: "Environment Variables",
        icon: NavIconKey,
        isActive: pathname.startsWith(`/projects/${currentProjectId}/env`),
      },
      {
        to: `/projects/${currentProjectId}/domains`,
        label: "Domains",
        icon: NavIconGlobe,
        isActive: pathname.startsWith(`/projects/${currentProjectId}/domains`),
      },
      {
        to: `/projects/${currentProjectId}/databases`,
        label: "Storage",
        icon: NavIconDatabase,
        isActive: pathname.startsWith(`/projects/${currentProjectId}/databases`),
      },
      {
        to: `/projects/${currentProjectId}/cron`,
        label: "Cron Jobs",
        icon: NavIconClock,
        isActive: pathname.startsWith(`/projects/${currentProjectId}/cron`),
      },
      {
        to: `/projects/${currentProjectId}/settings`,
        label: "Settings",
        icon: NavIconSettings,
        isActive: pathname.startsWith(`/projects/${currentProjectId}/settings`),
      },
    ];
  }, [currentProjectId, pathname]);

  // Workspace settings sub-navigation items
  const workspaceSettingsNav = [
    { id: "general", label: "General" },
    { id: "build", label: "Build and Deployment" },
    { id: "network", label: "Domains & Network" },
    { id: "security", label: "Security & Tokens" },
    { id: "webhooks", label: "Webhooks" },
    { id: "updates", label: "Engine Updates" },
    { id: "advanced", label: "Environment & System" },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-neutral-800 bg-surface">
      {/* SIDEBAR HEADER */}
      <SidebarHeader className="gap-3 border-b border-neutral-800 px-3 py-3">
        {/* Context Switcher dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-neutral-900 focus:outline-none">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex size-5 shrink-0 items-center justify-center rounded bg-neutral-800 text-[11px] font-semibold text-white">
                {avatarLetter}
              </span>
              <span className="truncate text-xs font-semibold text-white">
                {username}
              </span>
            </div>
            <NavIconChevronsUpDown className="size-3 text-neutral-500 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 border-neutral-800 bg-[#0a0a0a] text-white">
            <DropdownMenuItem
              className="cursor-pointer text-xs text-neutral-300 hover:bg-neutral-900"
              onClick={() => navigate("/")}
            >
              Overview (All Projects)
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-neutral-800" />
            {projects.map((p) => (
              <DropdownMenuItem
                key={p.id}
                className="flex items-center justify-between cursor-pointer text-xs text-neutral-300 hover:bg-neutral-900"
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <span className="truncate">{p.name}</span>
                {currentProjectId === p.id && (
                  <span className="size-1.5 rounded-full bg-blue-500 shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-neutral-800" />
            <DropdownMenuItem
              className="cursor-pointer text-xs text-neutral-300 hover:bg-neutral-900"
              onClick={onNewProject}
            >
              + Create Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search input with 'F' keyboard shortcut */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex w-full items-center justify-between gap-2 rounded-md border border-neutral-800 bg-black px-2.5 py-1.5 text-xs text-neutral-500 transition-colors hover:border-neutral-700 hover:text-neutral-300"
        >
          <span className="flex items-center gap-2">
            <NavIconSearch />
            <span>Find</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-neutral-800 bg-neutral-900 px-1 font-mono text-[10px] text-neutral-500">
              F
            </kbd>
            <kbd className="rounded border border-neutral-800 bg-neutral-900 px-1 font-mono text-[10px] text-neutral-500">
              Ctrl+K
            </kbd>
          </span>
        </button>
      </SidebarHeader>

      {/* SIDEBAR CONTENT */}
      <SidebarContent className="gap-1 px-2 py-2">
        {isWorkspaceSettings ? (
          /* WORKSPACE SETTINGS MODE */
          <SidebarGroup className="p-0">
            {/* Back button to Workspace Overview */}
            <div className="px-1 pb-2">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
              >
                <NavIconArrowLeft className="size-3.5" />
                <span>Settings</span>
              </button>
            </div>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {workspaceSettingsNav.map((s) => {
                  const isActive = currentWorkspaceTab === s.id;
                  return (
                    <SidebarMenuItem key={s.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/settings?tab=${s.id}`)}
                        className={navLinkClass(isActive)}
                      >
                        <span className="truncate">{s.label}</span>
                      </button>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : currentProjectId ? (
          /* PROJECT NAVIGATION MODE */
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {projectNav.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <Link to={item.to} className={navLinkClass(item.isActive)}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          /* GLOBAL WORKSPACE NAVIGATION */
          <>
            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {workspaceNav.map((item) => {
                    const isActive = item.end
                      ? pathname === item.to
                      : pathname.startsWith(item.to);
                    return (
                      <SidebarMenuItem key={item.to}>
                        <Link to={item.to} className={navLinkClass(isActive)}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-4 p-0">
              <SidebarGroupLabel className="px-2.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Projects
              </SidebarGroupLabel>
              <SidebarGroupContent className="pt-1">
                <SidebarMenu className="gap-0.5">
                  {projects.slice(0, 10).map((project) => {
                    const isActive = pathname.startsWith(`/projects/${project.id}`);
                    return (
                      <SidebarMenuItem key={project.id}>
                        <Link
                          to={`/projects/${project.id}`}
                          className={navLinkClass(isActive)}
                        >
                          <span className="flex size-4 shrink-0 items-center justify-center rounded bg-neutral-800 text-[10px] font-medium text-neutral-300">
                            {project.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="truncate" title={project.name}>{project.name}</span>
                        </Link>
                      </SidebarMenuItem>
                    );
                  })}
                  {projects.length > 10 ? (
                    <SidebarMenuItem>
                      <Link to="/projects" className={navLinkClass(pathname === "/projects")}>
                        View all projects ({projects.length})
                      </Link>
                    </SidebarMenuItem>
                  ) : null}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* SIDEBAR FOOTER */}
      <SidebarFooter className="border-t border-neutral-800 p-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-xs transition-colors hover:bg-neutral-900 focus:outline-none">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-800 font-semibold text-white">
              {avatarLetter}
            </span>
            <div className="flex flex-1 flex-col min-w-0">
              <span className="truncate font-medium text-white">{username}</span>
              <span className="truncate text-[10px] text-neutral-500">
                {userEmail || "local"}
              </span>
            </div>
            <NavIconChevron className="size-3 text-neutral-500 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56 border-neutral-800 bg-[#0a0a0a] text-white">
            <DropdownMenuItem
              className="cursor-pointer text-xs text-neutral-300 hover:bg-neutral-900"
              onClick={() => navigate("/settings")}
            >
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-neutral-800" />
            <DropdownMenuItem
              className="cursor-pointer text-xs text-red-400 hover:bg-neutral-900 hover:text-red-300"
              onClick={signOut}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
