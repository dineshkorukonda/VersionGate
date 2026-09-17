import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { authLogout, getProject, type Project } from "@/lib/api";
import { useEffect, useState } from "react";
import {
  NavIconChevron,
  NavIconClock,
  NavIconDatabase,
  NavIconFolder,
  NavIconGrid,
  NavIconLogs,
  NavIconPlug,
  NavIconPulse,
  NavIconRocket,
  NavIconSearch,
  NavIconSettings,
} from "@/components/nav-icons";

const workspaceNav = [
  { to: "/", label: "Overview", end: true, icon: NavIconGrid },
  { to: "/projects", label: "Projects", end: true, icon: NavIconFolder },
  { to: "/deployments", label: "Deployments", end: false, icon: NavIconRocket },
  { to: "/activity", label: "Logs", end: false, icon: NavIconLogs },
  { to: "/databases", label: "Databases", end: false, icon: NavIconDatabase },
  { to: "/cron", label: "Cron Jobs", end: false, icon: NavIconClock },
  { to: "/dashboard/integrations", label: "Integrations", end: false, icon: NavIconPlug },
  { to: "/system", label: "Observability", end: false, icon: NavIconPulse },
  { to: "/settings", label: "Settings", end: false, icon: NavIconSettings },
] as const;

const projectNav = [
  { tab: "overview", label: "Overview", path: "" },
  { tab: "deployments", label: "Deployments", path: "/deployments" },
  { tab: "domains", label: "Domains", path: "/domains" },
  { tab: "cron", label: "Cron Jobs", path: "/cron" },
  { tab: "logs", label: "Runtime Logs", path: "/logs" },
  { tab: "settings", label: "Settings", path: "/settings" },
] as const;

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
    isActive
      ? "bg-neutral-800 text-white"
      : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
  );

interface AppSidebarProps {
  projects: Project[];
  userEmail: string | null;
  onOpenSearch: () => void;
  onNewProject: () => void;
}

export function AppSidebar({ projects, userEmail, onOpenSearch, onNewProject }: AppSidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const inProject = Boolean(projectId && pathname.startsWith(`/projects/${projectId}`));
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!projectId) {
      setActiveProject(null);
      return;
    }
    let cancelled = false;
    void getProject(projectId)
      .then((r) => {
        if (!cancelled) setActiveProject(r.project ?? null);
      })
      .catch(() => {
        if (!cancelled) setActiveProject(null);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

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

  const avatarLetter = userEmail?.trim()?.[0]?.toUpperCase() ?? "?";

  const signOut = () => {
    void authLogout()
      .then(() => navigate("/login", { replace: true }))
      .catch(() => navigate("/login", { replace: true }));
  };

  const activeProjectTab = (() => {
    if (!inProject || !projectId) return "overview";
    if (pathname.includes("/deploy/")) return "deployments";
    const suffix = pathname.replace(`/projects/${projectId}`, "");
    if (suffix === "" || suffix === "/") return "overview";
    const match = projectNav.find((n) => n.path && suffix.startsWith(n.path));
    return match?.tab ?? "overview";
  })();

  return (
    <Sidebar collapsible="icon" className="border-r border-neutral-800 bg-[#0a0a0a]">
      <SidebarHeader className="gap-3 border-b border-neutral-800 px-3 py-3">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-neutral-900"
        >
          <span className="truncate text-sm font-semibold text-white">VersionGate</span>
          <span className="shrink-0 rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">
            Engine
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenSearch}
          className="flex w-full items-center justify-between gap-2 rounded-md border border-neutral-800 bg-black px-2.5 py-1.5 text-xs text-neutral-500 transition-colors hover:border-neutral-700 hover:text-neutral-300"
        >
          <span className="flex items-center gap-2">
            <NavIconSearch />
            <span>Find</span>
          </span>
          <kbd className="rounded border border-neutral-800 bg-neutral-900 px-1 font-mono text-[10px] text-neutral-500">
            F
          </kbd>
        </button>
      </SidebarHeader>

      <SidebarContent className="gap-1 px-2 py-2">
        {inProject && projectId ? (
          <>
            <SidebarGroup className="p-0">
              <button
                type="button"
                onClick={() => navigate("/projects")}
                className="mb-1 flex w-full items-center gap-1 px-2 py-1 text-[11px] text-neutral-500 hover:text-neutral-300"
              >
                <NavIconChevron className="rotate-180" />
                All Projects
              </button>
              <SidebarGroupLabel className="px-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                {activeProject?.name ?? "Project"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {projectNav.map((item) => {
                    const to =
                      item.path === ""
                        ? `/projects/${projectId}`
                        : `/projects/${projectId}${item.path}`;
                    const isActive = activeProjectTab === item.tab;
                    return (
                      <SidebarMenuItem key={item.tab}>
                        <NavLink to={to} end={item.path === ""} className={() => navLinkClass({ isActive })}>
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {workspaceNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.to}>
                      <NavLink to={item.to} end={item.end} className={navLinkClass}>
                        <Icon />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {!inProject && projects.length > 0 ? (
          <SidebarGroup className="mt-3 p-0">
            <SidebarGroupLabel className="px-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              Recent
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {projects.slice(0, 8).map((p) => (
                  <SidebarMenuItem key={p.id}>
                    <NavLink to={`/projects/${p.id}`} className={navLinkClass}>
                      <span className="size-4 shrink-0 rounded bg-neutral-800 text-center text-[9px] leading-4 text-neutral-400">
                        {p.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="truncate">{p.name}</span>
                    </NavLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t border-neutral-800 p-3">
        <Button
          type="button"
          className="w-full bg-white text-xs font-semibold text-black hover:bg-neutral-200"
          onClick={onNewProject}
        >
          Add New
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "flex h-auto w-full items-center justify-start gap-2 rounded-md px-2 py-2 hover:bg-neutral-900"
            )}
          >
            <Avatar size="sm" className="size-7 border border-neutral-800">
              <AvatarFallback className="bg-neutral-800 text-[10px] text-white">{avatarLetter}</AvatarFallback>
            </Avatar>
            <span className="truncate text-xs text-neutral-300 group-data-[collapsible=icon]:hidden">
              {userEmail ?? "Account"}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 border-neutral-800 bg-[#0a0a0a] text-white">
            {userEmail ? (
              <>
                <div className="px-2 py-1.5">
                  <p className="text-[10px] text-neutral-500">Signed in as</p>
                  <p className="truncate text-sm">{userEmail}</p>
                </div>
                <DropdownMenuSeparator className="bg-neutral-800" />
              </>
            ) : null}
            <DropdownMenuItem className="cursor-pointer hover:bg-neutral-900" onClick={() => navigate("/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-neutral-900" onClick={() => void signOut()}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
