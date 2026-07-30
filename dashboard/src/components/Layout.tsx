import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  Cable,
  CircleHelp,
  FolderKanban,
  HeartPulse,
  LayoutGrid,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
    SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { authLogout, getAuthStatus, getInstanceSettings, getProjects, getSetupStatus, type Project } from "@/lib/api";
import { setConfiguredPublicHost } from "@/lib/deployment-display";
import { cn } from "@/lib/utils";
import { GlobalSearchDialog } from "@/components/modals/GlobalSearchDialog";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import { CreateProjectLaunchContext } from "@/create-project-launch";
import { SidebarBreadcrumbs } from "@/components/SidebarBreadcrumbs";
import { UpdateAvailableBanner } from "@/components/UpdateAvailableBanner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DOCS_HREF = "https://github.com/dinexh/VersionGate/blob/main/docs/SETUP.md";
const API_HREF = "https://github.com/dinexh/VersionGate/blob/main/docs/SETUP.md";
const SUPPORT_HREF = "https://github.com/dinexh/VersionGate/issues";

const nav = [
  { to: "/", label: "Overview", end: true, icon: LayoutGrid },
  { to: "/projects", label: "Projects", end: true, icon: FolderKanban },
  { to: "/activity", label: "Activity", end: false, icon: Activity },
  { to: "/dashboard/integrations", label: "Integrations", end: false, icon: Cable },
  { to: "/system", label: "System health", end: false, icon: HeartPulse },
  { to: "/settings", label: "Settings", end: false, icon: Settings },
] as const;

const navBtn =
  "peer/menu-button flex w-full items-center gap-3 overflow-hidden px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:text-white border-l-4 border-transparent [&>span:last-child]:truncate";

export function Layout() {
  const navigate = useNavigate();
  
  const [setupGate, setSetupGate] = useState<"loading" | "ready">("loading");
  const [needsRestartBanner, setNeedsRestartBanner] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [headerUserEmail, setHeaderUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getInstanceSettings()
      .then((s) => {
        if (!cancelled) setConfiguredPublicHost(s.publicDomain);
      })
      .catch(() => {
        /* settings may be unavailable before auth */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getSetupStatus()
      .then((s) => {
        if (cancelled) return;
        const incomplete = !s.configured || !s.dbConnected;
        if (incomplete) {
          navigate("/setup", { replace: true });
        } else {
          setNeedsRestartBanner(Boolean(s.needsRestart));
        }
        setSetupGate("ready");
      })
      .catch(() => {
        if (!cancelled) setSetupGate("ready");
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (setupGate !== "ready") return;
    let cancelled = false;
    void getAuthStatus()
      .then((s) => {
        if (cancelled) return;
        if (!s.databaseReady) return;
        if (!s.hasUsers) {
          navigate("/login", { replace: true, state: { register: true } });
          return;
        }
        if (!s.authenticated) {
          navigate("/login", { replace: true });
          return;
        }
        if (s.user?.email) setHeaderUserEmail(s.user.email);
      })
      .catch(() => {
        /* avoid redirect loop on transient API error */
      });
    return () => {
      cancelled = true;
    };
  }, [setupGate, navigate]);


  useEffect(() => {
    let cancelled = false;
    const loadProjects = async () => {
      try {
        const r = await getProjects();
        if (!cancelled) setProjects(r.projects);
      } catch {
        /* sidebar project list is non-critical */
      }
    };
    void loadProjects();
    const id = window.setInterval(() => void loadProjects(), 15000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const avatarLetter = headerUserEmail?.trim()?.[0]?.toUpperCase() ?? "?";

  const signOut = () => {
    void authLogout()
      .then(() => navigate("/login", { replace: true }))
      .catch(() => navigate("/login", { replace: true }));
  };

  return (
    <TooltipProvider>
      <CreateProjectLaunchContext.Provider value={() => setCreateProjectOpen(true)}>
        <SidebarProvider>
          <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
            <SidebarHeader className="gap-3 border-b border-sidebar-border px-3 py-4">
              <div className="flex items-center"><span className="text-base font-semibold text-white">VersionGate</span></div>
            </SidebarHeader>
            <SidebarContent className="gap-0 px-2 py-3">
              <SidebarGroup className="p-0">
                
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5">
                    {nav.map((item) => {
                      const Icon = item.icon;
                      return (
                        <SidebarMenuItem key={item.to}>
                          <NavLink
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                              cn(
                                navBtn,
                                isActive &&
                                  "border-white text-white bg-sidebar-accent/10"
                              )
                            }
                          >
                            <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                            <span>{item.label}</span>
                          </NavLink>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {projects.length > 0 && (
                <SidebarGroup className="mt-4 p-0">
                  
                  <SidebarGroupContent>
                    <SidebarMenu className="gap-0.5">
                      {projects.map((p) => (
                        <SidebarMenuItem key={p.id}>
                          <NavLink
                            to={`/projects/${p.id}`}
                            className={({ isActive }) =>
                              cn(
                                navBtn,
                                isActive && "border-white text-white bg-sidebar-accent/10"
                              )
                            }
                          >
                            <FolderKanban className="size-4 shrink-0 opacity-70" aria-hidden />
                            <span className="truncate">{p.name}</span>
                          </NavLink>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}
            </SidebarContent>

            <SidebarFooter className="p-4">
              
              <Button
                type="button"
                className="w-full gap-2 bg-white text-black hover:bg-zinc-200"
                onClick={() => setCreateProjectOpen(true)}
              >
                <Plus className="size-4" />
                <span className="group-data-[collapsible=icon]:hidden">New project</span>
              </Button>
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="flex min-h-svh flex-col bg-background">
            <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
              <SidebarTrigger className="md:hidden" />
              <div className="hidden min-w-0 flex-col gap-0.5 sm:flex md:max-w-[min(40%,20rem)]">
                
                <SidebarBreadcrumbs />
              </div>

              <div className="mx-auto hidden max-w-md flex-1 px-2 sm:block">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    readOnly
                    aria-label="Search projects"
                    title="Open search (⌘K or Ctrl+K)"
                    placeholder="Search projects…"
                    onClick={() => setSearchOpen(true)}
                    className="h-8 cursor-pointer rounded-md border-border bg-card pl-9 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
                <Button type="button" size="sm" className="hidden gap-1.5 sm:inline-flex" onClick={() => setCreateProjectOpen(true)}>
                  <Plus className="size-3.5" />
                  New project
                </Button>
                <a
                  href={DOCS_HREF}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground lg:inline"
                >
                  Docs
                </a>
                <a
                  href={API_HREF}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground lg:inline"
                >
                  API
                </a>
                <a
                  href={SUPPORT_HREF}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground xl:inline"
                >
                  Support
                </a>
                <Separator orientation="vertical" className="hidden h-6 sm:block" />
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon-sm" }),
                      "text-muted-foreground"
                    )}
                    aria-label="Notifications"
                  >
                    <Bell className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <div className="px-3 py-8 text-center text-sm text-muted-foreground">No notifications</div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  aria-label="Help"
                  onClick={() => window.open(DOCS_HREF, "_blank", "noopener,noreferrer")}
                >
                  <CircleHelp className="size-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon-sm" }),
                      "rounded-full p-0 ring-offset-background focus-visible:ring-2"
                    )}
                    aria-label="Account menu"
                  >
                    <Avatar size="sm" className="size-8 border border-border/80">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{avatarLetter}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {headerUserEmail ? (
                      <>
                        <div className="px-2 py-1.5">
                          <p className="truncate text-xs text-muted-foreground">Signed in as</p>
                          <p className="truncate text-sm font-medium">{headerUserEmail}</p>
                        </div>
                        <DropdownMenuSeparator />
                      </>
                    ) : null}
                    <DropdownMenuItem onClick={() => void signOut()}>Sign out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            <div className="flex border-b border-border bg-card px-3 py-2 sm:hidden">
              <SidebarBreadcrumbs />
            </div>

            <UpdateAvailableBanner />
            {needsRestartBanner ? (
              <div
                className="flex items-center justify-center gap-3 border-b border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-sm"
                role="status"
              >
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-amber-400">
                  Configuration change detected — the engine will apply it automatically on the next job cycle.
                </span>
              </div>
            ) : null}
            <div className="flex flex-1 flex-col gap-4 bg-background px-4 py-4 md:px-6 md:py-6 lg:px-8">
              {setupGate === "loading" ? (
                <div className="flex flex-1 items-center justify-center">
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <Outlet />
              )}
            </div>
            
            <CreateProjectModal
              open={createProjectOpen}
              onOpenChange={setCreateProjectOpen}
              onCreated={() => {
                void getProjects()
                  .then((r) => setProjects(r.projects))
                  .catch(() => {
                    /* sidebar project list is non-critical */
                  });
              }}
            />
            <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
          </SidebarInset>
        </SidebarProvider>
      </CreateProjectLaunchContext.Provider>
      <Toaster position="top-center" richColors theme="dark" />
    </TooltipProvider>
  );
}
