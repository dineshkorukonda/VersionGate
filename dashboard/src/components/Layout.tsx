import { Outlet, useNavigate } from "react-router-dom";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { getAuthStatus, getInstanceSettings, getProjects, getSetupStatus, type Project } from "@/lib/api";
import { setConfiguredPublicHost } from "@/lib/deployment-display";
import { SidebarBreadcrumbs } from "@/components/SidebarBreadcrumbs";
import { GlobalSearchDialog } from "@/components/modals/GlobalSearchDialog";
import { CreateProjectLaunchContext } from "@/create-project-launch";
import { UpdateAvailableBanner } from "@/components/UpdateAvailableBanner";
import { AppSidebar } from "@/components/AppSidebar";

export function Layout() {
  const navigate = useNavigate();

  const [setupGate, setSetupGate] = useState<"loading" | "ready">("loading");
  const [authGate, setAuthGate] = useState<"loading" | "ready" | "error">("loading");
  const [needsRestartBanner, setNeedsRestartBanner] = useState(false);
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
    setAuthGate("loading");
    void getAuthStatus()
      .then((s) => {
        if (cancelled) return;
        if (!s.databaseReady) {
          setAuthGate("ready");
          return;
        }
        if (!s.hasUsers) {
          navigate("/login", { replace: true, state: { register: true } });
          return;
        }
        if (!s.authenticated) {
          navigate("/login", { replace: true });
          return;
        }
        if (s.user?.email) setHeaderUserEmail(s.user.email);
        setAuthGate("ready");
      })
      .catch(() => {
        if (!cancelled) setAuthGate("error");
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
        if (!cancelled) {
          toast.error("Could not refresh sidebar project list");
        }
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

  return (
    <TooltipProvider>
      <CreateProjectLaunchContext.Provider value={() => navigate("/projects/new")}>
        <SidebarProvider>
          <AppSidebar
            projects={projects}
            userEmail={headerUserEmail}
            onOpenSearch={() => setSearchOpen(true)}
            onNewProject={() => navigate("/projects/new")}
          />

          <SidebarInset className="flex min-h-svh flex-col bg-black overflow-x-hidden min-w-0">
            <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b border-neutral-800 bg-black/95 px-3 backdrop-blur-md sm:gap-3 sm:px-4">
              <SidebarTrigger className="shrink-0 focus-visible:ring-2 focus-visible:ring-neutral-600" />
              <SidebarBreadcrumbs projects={projects} />
            </header>

            <UpdateAvailableBanner />
            {needsRestartBanner ? (
              <div
                className="flex items-center justify-center gap-3 border-b border-amber-500/30 bg-amber-500/5 px-4 py-2 text-sm"
                role="status"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-sans text-[11px] font-medium text-amber-400">
                  <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Restart Pending
                </span>
                <span className="text-amber-400 font-sans text-xs">
                  Configuration change detected — engine will apply automatically on next job cycle.
                </span>
              </div>
            ) : null}
            <div className="flex flex-1 flex-col bg-black px-4 py-6 md:px-8 md:py-8 min-w-0 overflow-x-hidden">
              {setupGate === "loading" || authGate === "loading" ? (
                <div className="flex flex-1 items-center justify-center" role="status" aria-live="polite">
                  <span className="text-sm text-neutral-400 font-sans">Loading workspace...</span>
                </div>
              ) : authGate === "error" ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center" role="alert">
                  <p className="text-sm text-neutral-300 font-sans">
                    Unable to verify your session. The API may be temporarily unavailable.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthGate("loading");
                      void getAuthStatus()
                        .then((s) => {
                          if (!s.authenticated) {
                            navigate("/login", { replace: true });
                            return;
                          }
                          if (s.user?.email) setHeaderUserEmail(s.user.email);
                          setAuthGate("ready");
                        })
                        .catch(() => setAuthGate("error"));
                    }}
                    className="rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <Outlet />
              )}
            </div>

            <GlobalSearchDialog
              open={searchOpen}
              onOpenChange={setSearchOpen}
              onLaunchCreate={() => navigate("/projects/new")}
            />
          </SidebarInset>
        </SidebarProvider>
      </CreateProjectLaunchContext.Provider>
      <Toaster position="top-center" richColors theme="dark" />
    </TooltipProvider>
  );
}
