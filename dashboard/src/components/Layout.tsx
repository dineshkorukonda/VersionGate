import { Outlet, useNavigate } from "react-router-dom";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { getAuthStatus, getInstanceSettings, getProjects, getSetupStatus, type Project } from "@/lib/api";
import { setConfiguredPublicHost } from "@/lib/deployment-display";
import { SidebarBreadcrumbs } from "@/components/SidebarBreadcrumbs";
import { GlobalSearchDialog } from "@/components/modals/GlobalSearchDialog";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import { CreateProjectLaunchContext } from "@/create-project-launch";
import { UpdateAvailableBanner } from "@/components/UpdateAvailableBanner";
import { AppSidebar } from "@/components/AppSidebar";

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

          <SidebarInset className="flex min-h-svh flex-col bg-black">
            <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-3 border-b border-neutral-800 bg-black/95 px-4 backdrop-blur-md">
              <SidebarTrigger />
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
            <div className="flex flex-1 flex-col bg-black px-4 py-6 md:px-8 md:py-8">
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
