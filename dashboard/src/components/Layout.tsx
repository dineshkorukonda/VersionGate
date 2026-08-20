import { NavLink, Outlet, useNavigate } from "react-router-dom";
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
import { UpdateAvailableBanner } from "@/components/UpdateAvailableBanner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const nav = [
  { to: "/", label: "Overview", end: true, tag: "01" },
  { to: "/projects", label: "Projects", end: true, tag: "02" },
  { to: "/activity", label: "Activity", end: false, tag: "03" },
  { to: "/dashboard/integrations", label: "Integrations", end: false, tag: "04" },
  { to: "/system", label: "System health", end: false, tag: "05" },
  { to: "/settings", label: "Settings", end: false, tag: "06" },
] as const;

const navBtn =
  "peer/menu-button flex w-full items-center gap-3 overflow-hidden px-3 py-2 text-xs font-medium text-neutral-400 transition-colors hover:text-white hover:bg-neutral-900 rounded-lg [&>span:last-child]:truncate";

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
          <Sidebar collapsible="icon" className="border-r border-neutral-800 bg-[#0a0a0a]">
            <SidebarHeader className="gap-3 border-b border-neutral-800 px-3 py-4">
              <div className="flex items-center gap-2">
                <span className="inline-block size-3 rounded-full bg-white" />
                <span className="text-sm font-semibold tracking-tight text-white">VersionGate</span>
              </div>
            </SidebarHeader>
            <SidebarContent className="gap-0 px-2 py-3">
              <SidebarGroup className="p-0">
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5">
                    {nav.map((item) => {
                      return (
                        <SidebarMenuItem key={item.to}>
                          <NavLink
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                              cn(
                                navBtn,
                                isActive &&
                                  "bg-neutral-900 text-white font-medium"
                              )
                            }
                          >
                            <span className="font-mono text-xs opacity-70 shrink-0">{item.tag}</span>
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
                                isActive && "bg-neutral-900 text-white font-medium"
                              )
                            }
                          >
                            <span className="font-mono text-xs opacity-70 shrink-0">&gt;</span>
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
                className="w-full gap-2 bg-white font-sans text-xs text-black hover:bg-neutral-200"
                onClick={() => setCreateProjectOpen(true)}
              >
                <span>+</span>
                <span className="group-data-[collapsible=icon]:hidden">New project</span>
              </Button>
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="flex min-h-svh flex-col bg-black">
            {/* Top Clean Platform Header Bar */}
            <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-neutral-800 bg-black/90 backdrop-blur-md px-4 md:px-6">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="md:hidden" />
                <div className="flex items-center gap-2 font-sans text-xs">
                  <span className="flex size-6 items-center justify-center rounded-md bg-white font-mono text-xs font-bold text-black">V</span>
                  <span className="font-semibold text-white tracking-tight text-sm font-sans">VersionGate</span>
                </div>
              </div>

              <div className="hidden max-w-sm flex-1 px-4 md:block">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="flex w-full items-center justify-between rounded-lg border border-neutral-800 bg-[#0a0a0a] px-3 py-1.5 font-sans text-xs text-neutral-400 transition-colors hover:border-neutral-700 hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-neutral-500">Search projects, logs, settings...</span>
                  </span>
                  <kbd className="rounded border border-neutral-800 bg-black px-1.5 py-0.5 font-mono text-[10px] text-neutral-400">⌘K</kbd>
                </button>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-sans font-medium text-emerald-400 sm:flex">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Systems Operational
                </div>

                <Button type="button" size="sm" className="gap-1.5 bg-white font-sans text-xs font-semibold text-black hover:bg-neutral-200" onClick={() => setCreateProjectOpen(true)}>
                  <span>+</span>
                  Deploy Project
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon-sm" }),
                      "rounded-full p-0 ring-offset-background focus-visible:ring-2"
                    )}
                    aria-label="Account menu"
                  >
                    <Avatar size="sm" className="size-8 border border-neutral-800">
                      <AvatarFallback className="bg-neutral-900 text-xs font-semibold text-white">{avatarLetter}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-[#0a0a0a] border-neutral-800 text-white">
                    {headerUserEmail ? (
                      <>
                        <div className="px-2 py-1.5">
                          <p className="truncate text-xs text-neutral-400">Signed in as</p>
                          <p className="truncate text-sm font-medium text-white">{headerUserEmail}</p>
                        </div>
                        <DropdownMenuSeparator className="bg-neutral-800" />
                      </>
                    ) : null}
                    <DropdownMenuItem className="hover:bg-neutral-900 cursor-pointer" onClick={() => void signOut()}>Sign out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            <UpdateAvailableBanner />
            {needsRestartBanner ? (
              <div
                className="flex items-center justify-center gap-3 border-b border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-sm"
                role="status"
              >
                <span className="inline-block size-2 rounded-full bg-amber-500" />
                <span className="text-amber-400 font-sans text-xs">
                  Configuration change detected — engine will apply automatically on next job cycle.
                </span>
              </div>
            ) : null}
            <div className="flex flex-1 flex-col gap-6 bg-black px-4 py-6 md:px-8 md:py-8">
              {setupGate === "loading" ? (
                <div className="flex flex-1 items-center justify-center">
                  <span className="text-sm text-neutral-400 font-sans">Loading workspace...</span>
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
