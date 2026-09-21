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
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

function navButtonClass(isActive: boolean) {
  return cn(
    "text-[13px] font-medium",
    isActive
      ? "bg-neutral-800 text-white font-semibold hover:bg-neutral-800 hover:text-white data-active:bg-neutral-800 data-active:text-white"
      : "text-neutral-400 hover:bg-neutral-900/90 hover:text-neutral-200"
  );
}

export function AppSidebar({ projects, userEmail, onOpenSearch, onNewProject }: AppSidebarProps) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { state, isMobile } = useSidebar();

  const projectMatch = pathname.match(/^\/projects\/([^/]+)/);
  const currentProjectId = projectMatch && projectMatch[1] !== "new" ? projectMatch[1] : null;

  const isWorkspaceSettings = pathname.startsWith("/settings");

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
      <SidebarHeader className="gap-3 overflow-hidden border-b border-neutral-800 px-3 py-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:px-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Switch workspace or project"
            className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-neutral-900 focus:outline-none group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
          >
            <div className="flex min-w-0 items-center gap-2 group-data-[collapsible=icon]:gap-0">
              <span className="flex size-5 shrink-0 items-center justify-center rounded bg-neutral-800 text-[11px] font-semibold text-white group-data-[collapsible=icon]:size-8">
                {avatarLetter}
              </span>
              <span className="truncate text-xs font-semibold text-white group-data-[collapsible=icon]:hidden">
                {username}
              </span>
            </div>
            <NavIconChevronsUpDown className="size-3 shrink-0 text-neutral-500 group-data-[collapsible=icon]:hidden" />
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
                className="flex cursor-pointer items-center justify-between text-xs text-neutral-300 hover:bg-neutral-900"
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <span className="truncate">{p.name}</span>
                {currentProjectId === p.id ? (
                  <span className="size-1.5 shrink-0 rounded-full bg-blue-500" />
                ) : null}
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

        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={onOpenSearch}
                aria-label="Find in workspace"
                className="flex w-full items-center justify-between gap-2 rounded-md border border-neutral-800 bg-black px-2.5 py-1.5 text-xs text-neutral-500 transition-colors hover:border-neutral-700 hover:text-neutral-300 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              />
            }
          >
            <span className="flex items-center gap-2 group-data-[collapsible=icon]:gap-0">
              <NavIconSearch />
              <span className="group-data-[collapsible=icon]:hidden">Find</span>
            </span>
            <span className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
              <kbd className="rounded border border-neutral-800 bg-neutral-900 px-1 font-mono text-[10px] text-neutral-500">
                F
              </kbd>
              <kbd className="rounded border border-neutral-800 bg-neutral-900 px-1 font-mono text-[10px] text-neutral-500">
                Ctrl+K
              </kbd>
            </span>
          </TooltipTrigger>
          <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile}>
            Find (F / Ctrl+K)
          </TooltipContent>
        </Tooltip>
      </SidebarHeader>

      <SidebarContent className="gap-1 px-2 py-2 group-data-[collapsible=icon]:px-1">
        {isWorkspaceSettings ? (
          <SidebarGroup className="p-0">
            <div className="px-1 pb-2 group-data-[collapsible=icon]:px-0">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate("/")}
                    tooltip="Settings"
                    className="text-xs font-semibold text-neutral-400 hover:bg-neutral-900/90 hover:text-white"
                  >
                    <NavIconArrowLeft className="size-3.5" />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {workspaceSettingsNav.map((s) => {
                  const isActive = currentWorkspaceTab === s.id;
                  return (
                    <SidebarMenuItem key={s.id}>
                      <SidebarMenuButton
                        onClick={() => navigate(`/settings?tab=${s.id}`)}
                        isActive={isActive}
                        tooltip={s.label}
                        className={navButtonClass(isActive)}
                      >
                        <span className="flex size-4 shrink-0 items-center justify-center rounded bg-neutral-800 text-[10px] font-medium text-neutral-300">
                          {s.label.charAt(0)}
                        </span>
                        <span className="truncate">{s.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : currentProjectId ? (
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {projectNav.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      render={<Link to={item.to} />}
                      isActive={item.isActive}
                      tooltip={item.label}
                      className={navButtonClass(item.isActive)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
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
                        <SidebarMenuButton
                          render={<Link to={item.to} />}
                          isActive={isActive}
                          tooltip={item.label}
                          className={navButtonClass(isActive)}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-4 p-0">
              <SidebarGroupLabel className="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Projects
              </SidebarGroupLabel>
              <SidebarGroupContent className="pt-1">
                <SidebarMenu className="gap-0.5">
                  {projects.slice(0, 10).map((project) => {
                    const isActive = pathname.startsWith(`/projects/${project.id}`);
                    return (
                      <SidebarMenuItem key={project.id}>
                        <SidebarMenuButton
                          render={<Link to={`/projects/${project.id}`} />}
                          isActive={isActive}
                          tooltip={project.name}
                          className={navButtonClass(isActive)}
                        >
                          <span className="flex size-4 shrink-0 items-center justify-center rounded bg-neutral-800 text-[10px] font-medium text-neutral-300">
                            {project.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="truncate" title={project.name}>
                            {project.name}
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                  {projects.length > 10 ? (
                    <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
                      <SidebarMenuButton
                        render={<Link to="/projects" />}
                        isActive={pathname === "/projects"}
                        tooltip={`View all projects (${projects.length})`}
                        className={navButtonClass(pathname === "/projects")}
                      >
                        <NavIconFolder />
                        <span>View all projects ({projects.length})</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ) : null}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="overflow-hidden border-t border-neutral-800 p-2 group-data-[collapsible=icon]:px-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Account menu"
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-xs transition-colors hover:bg-neutral-900 focus:outline-none group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-800 font-semibold text-white group-data-[collapsible=icon]:size-8">
              {avatarLetter}
            </span>
            <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium text-white">{username}</span>
              <span className="truncate text-[10px] text-neutral-500">
                {userEmail || "local"}
              </span>
            </div>
            <NavIconChevron className="size-3 shrink-0 text-neutral-500 group-data-[collapsible=icon]:hidden" />
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
