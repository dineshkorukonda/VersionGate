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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DOCS_HREF = "https://github.com/dinexh/VersionGate/blob/main/docs/SETUP.md";

const nav = [
  { to: "/", label: "Overview", end: true, icon: LayoutGrid },
  { to: "/projects", label: "Projects", end: true, icon: FolderKanban },
  { to: "/activity", label: "Activity", end: false, icon: Activity },
  { to: "/dashboard/integrations", label: "Integrations", end: false, icon: Cable },
  { to: "/system", label: "System health", end: false, icon: HeartPulse },
  { to: "/settings", label: "Settings", end: false, icon: Settings },
] as const;

const navBtn =
  "peer/menu-button flex w-full items-center gap-3 overflow-hidden px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative text-muted-foreground hover:text-foreground hover:bg-[#121212] rounded-lg [&>span:last-child]:truncate";

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

  const avatarLetter = headerUserEmail?.trim()?.[0]?.toUpperCase() ?? "VG";

  const signOut = () => {
    void authLogout()
      .then(() => navigate("/login", { replace: true }))
      .catch(() => navigate("/login", { replace: true }));
  };

  return (
    <TooltipProvider>
      <CreateProjectLaunchContext.Provider value={() => setCreateProjectOpen(true)}>
        <SidebarProvider>
          <Sidebar collapsible="icon" className="border-r border-[#1f1f1f] bg-[#050505] w-[260px]">
            <SidebarHeader className="h-16 flex items-center px-4 border-b border-[#1f1f1f]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 text-black font-extrabold text-sm">
                  VG
                </div>
                <span className="font-semibold text-lg text-white whitespace-nowrap group-data-[collapsible=icon]:hidden">
                  VersionGate
                </span>
              </div>
            </SidebarHeader>

            <SidebarContent className="gap-1 px-3 py-4">
              <SidebarGroup className="p-0">
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1">
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
                                isActive && "bg-[#161616] text-white font-semibold"
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <span
                                  className={cn(
                                    "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[#0070f3] transition-all duration-300",
                                    isActive ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <Icon className="size-4 shrink-0 transition-transform group-hover:scale-110" aria-hidden />
                                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                              </>
                            )}
                          </NavLink>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {projects.length > 0 && (
                <SidebarGroup className="mt-4 p-0">
                  <div className="px-3 pb-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground group-data-[collapsible=icon]:hidden">
                    Projects ({projects.length})
                  </div>
                  <SidebarGroupContent>
                    <SidebarMenu className="gap-0.5">
                      {projects.map((p) => (
                        <SidebarMenuItem key={p.id}>
                          <NavLink
                            to={`/projects/${p.id}`}
                            className={({ isActive }) =>
                              cn(
                                navBtn,
                                isActive && "bg-[#161616] text-white font-semibold"
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <span
                                  className={cn(
                                    "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[#0070f3] transition-all duration-300",
                                    isActive ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <FolderKanban className="size-4 shrink-0 transition-transform group-hover:scale-110 opacity-70" aria-hidden />
                                <span className="truncate group-data-[collapsible=icon]:hidden">{p.name}</span>
                              </>
                            )}
                          </NavLink>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}
            </SidebarContent>

            <SidebarFooter className="p-3 border-t border-[#1f1f1f]">
              <Button
                type="button"
                className="w-full gap-2 bg-white text-black hover:bg-zinc-200 font-medium"
                onClick={() => setCreateProjectOpen(true)}
              >
                <Plus className="size-4" />
                <span className="group-data-[collapsible=icon]:hidden">New project</span>
              </Button>
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="flex min-h-svh flex-col bg-[#000000]">
            <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[#1f1f1f] bg-black/80 backdrop-blur-md px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                <div className="flex items-center gap-3">
                  <SidebarBreadcrumbs />
                  <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full border border-[#1f1f1f] bg-[#0a0a0a] text-xs text-muted-foreground">
                    <span className="status-dot-live" />
                    <span>Cluster operational</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative hidden sm:flex items-center w-56">
                  <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
                  <Input
                    readOnly
                    aria-label="Search projects"
                    title="Open search (⌘K or Ctrl+K)"
                    placeholder="Search projects… (⌘K)"
                    onClick={() => setSearchOpen(true)}
                    className="h-9 w-full cursor-pointer rounded-lg border-[#1f1f1f] bg-[#121212] pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-[#0070f3]"
                  />
                </div>

                <Button
                  type="button"
                  size="sm"
                  className="hidden sm:inline-flex gap-1.5 bg-[#0070f3] text-white hover:bg-[#0070f3]/90 text-xs font-medium h-9 px-3 rounded-lg"
                  onClick={() => setCreateProjectOpen(true)}
                >
                  <Plus className="size-3.5" />
                  New Project
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon-sm" }),
                      "relative size-9 rounded-lg text-muted-foreground hover:bg-[#121212] hover:text-white"
                    )}
                    aria-label="Notifications"
                  >
                    <Bell className="size-4" />
                    <span className="absolute top-2 right-2 size-2 rounded-full bg-[#0070f3] animate-pulse" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 border-[#1f1f1f] bg-[#0a0a0a]">
                    <div className="px-3 py-6 text-center text-xs text-muted-foreground">No pending notifications</div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-9 rounded-lg text-muted-foreground hover:bg-[#121212] hover:text-white"
                  aria-label="Documentation"
                  onClick={() => window.open(DOCS_HREF, "_blank", "noopener,noreferrer")}
                >
                  <CircleHelp className="size-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="size-9 rounded-lg overflow-hidden ring-1 ring-border/50 hover:ring-[#0070f3]/60 transition-all cursor-pointer"
                    aria-label="Account menu"
                  >
                    <div className="size-full bg-gradient-to-br from-[#0070f3]/80 to-[#22c55e] flex items-center justify-center text-xs font-bold text-white uppercase">
                      {avatarLetter}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 border-[#1f1f1f] bg-[#0a0a0a]">
                    {headerUserEmail ? (
                      <>
                        <div className="px-3 py-2">
                          <p className="truncate text-xs text-muted-foreground">Signed in as</p>
                          <p className="truncate text-sm font-medium text-white">{headerUserEmail}</p>
                        </div>
                        <DropdownMenuSeparator className="bg-[#1f1f1f]" />
                      </>
                    ) : null}
                    <DropdownMenuItem onClick={() => void signOut()} className="text-red-400 hover:text-red-300 cursor-pointer">
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            <UpdateAvailableBanner />
            {needsRestartBanner ? (
              <div
                className="flex items-center justify-center gap-3 border-b border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-400"
                role="status"
              >
                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                <span>
                  Configuration change detected — the engine will apply it automatically on the next job cycle.
                </span>
              </div>
            ) : null}

            <div className="flex flex-1 flex-col gap-6 bg-[#000000] p-6 md:p-8">
              {setupGate === "loading" ? (
                <div className="flex flex-1 items-center justify-center">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest animate-pulse">
                    Initializing cluster state...
                  </span>
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
                  .catch(() => {});
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
