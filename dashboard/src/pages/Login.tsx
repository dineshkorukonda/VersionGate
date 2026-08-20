import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authLogin, authRegister, getAuthStatus } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  /** When true, DB is up but User count is 0 — only registration is allowed. */
  const [bootstrapPending, setBootstrapPending] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getAuthStatus()
      .then((s) => {
        if (cancelled) return;
        if (s.authenticated) {
          navigate("/", { replace: true });
          return;
        }
        if (!s.databaseReady) {
          navigate("/setup", { replace: true });
          return;
        }
        setBootstrapPending(!s.hasUsers);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Could not reach the API");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (bootstrapPending) {
        await authRegister({ email: email.trim().toLowerCase(), password });
        toast.success("Admin account created");
      } else {
        await authLogin({ email: email.trim().toLowerCase(), password });
        toast.success("Signed in");
      }
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background font-mono text-xs uppercase tracking-wider text-muted-foreground">
        Loading…
        <Toaster position="top-center" richColors theme="dark" />
      </div>
    );
  }

  const title = bootstrapPending ? "Create first administrator" : "Sign in";
  const subtitle = bootstrapPending
    ? "Your database is configured but there are no dashboard users yet (for example after a fresh install or restore). Set the first account here, or run bun run create-admin on the server."
    : "Sign in to manage projects and deployments.";

  return (
    <div className="relative min-h-svh overflow-hidden bg-background flex flex-col items-center justify-center">
      
      
      <div className="relative mx-auto flex min-h-svh max-w-lg flex-col justify-center px-4 py-12">
        <div className="mb-8 space-y-2 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">VersionGate</p>
          <h1 className="text-3xl font-bold uppercase tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>{bootstrapPending ? "Bootstrap (one-time)" : "Credentials"}</CardTitle>
            <CardDescription>
              Password must be at least 10 characters. Session lasts 7 days on this device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="vg-login-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="vg-login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="vg-login-password" className="text-sm font-medium">
                    Password
                  </label>
                  {!bootstrapPending ? (
                    <button
                      type="button"
                      onClick={() => setForgotOpen(true)}
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Forgot password?
                    </button>
                  ) : null}
                </div>
                <Input
                  id="vg-login-password"
                  type="password"
                  autoComplete={bootstrapPending ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={10}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Please wait…" : bootstrapPending ? "Create account" : "Sign in"}
              </Button>
              {!bootstrapPending ? (
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <Link to="/setup" className="hover:text-foreground hover:underline">
                    Setup wizard
                  </Link>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="hover:text-foreground hover:underline"
                  >
                    Reset via server
                  </button>
                </div>
              ) : null}
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-center">
          <div className="border border-border bg-card px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Dashboard{" "}
            <span className="text-foreground">{typeof __DASHBOARD_VERSION__ !== "undefined" ? __DASHBOARD_VERSION__ : "dev"}</span>
            <span className="mx-2 text-border">|</span>
            Status: <span className="text-foreground">Operational</span>
          </div>
        </div>

        <div className="mt-4 border border-border bg-muted px-4 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <p className="text-foreground">New installation?</p>
          <p className="mt-1 normal-case">
            Use the setup wizard on the host if PostgreSQL is not configured yet, then return here to sign in.
          </p>
        </div>

        <footer className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          <a className="hover:text-foreground" href="https://github.com/dinexh/VersionGate/blob/main/docs/SETUP.md" target="_blank" rel="noreferrer">
            Documentation
          </a>
          <a className="hover:text-foreground" href="https://github.com/dinexh/VersionGate/issues" target="_blank" rel="noreferrer">
            Security
          </a>
          <a className="hover:text-foreground" href="https://github.com/dinexh/VersionGate" target="_blank" rel="noreferrer">
            API & source
          </a>
        </footer>
      </div>
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Administrator Password</DialogTitle>
            <DialogDescription>
              For security, self-hosted VersionGate administrator credentials can be reset directly from the host CLI without exposing external email dependencies.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2 font-mono text-xs">
            <div className="rounded-md border border-border bg-muted p-3">
              <p className="text-muted-foreground">Run on your host server CLI:</p>
              <pre className="mt-2 text-foreground font-mono text-[11px] select-all bg-background p-2 rounded border border-border overflow-x-auto">
                bun run reset-password admin@example.com 'NewPassword123!'
              </pre>
            </div>
            <div className="space-y-1.5 text-muted-foreground">
              <p>
                <span className="text-foreground font-medium">Alternative (--reset flag):</span> You can also pass the <code className="text-foreground">--reset</code> flag to create-admin:
              </p>
              <pre className="text-[10px] text-foreground bg-background p-2 rounded border border-border overflow-x-auto">
                bun run create-admin admin@example.com 'NewPassword123!' --reset
              </pre>
              <p className="text-[10px]">
                Both commands update existing account credentials directly without requiring database table manipulation.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setForgotOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Toaster position="top-center" richColors theme="dark" />
    </div>
  );
}
