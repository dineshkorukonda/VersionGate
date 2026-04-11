import { type FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authLogin, authRegister, getAuthStatus } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateRegister = Boolean((location.state as { register?: boolean } | null)?.register);

  const [loading, setLoading] = useState(true);
  const [registerMode, setRegisterMode] = useState(stateRegister);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        setRegisterMode(!s.hasUsers);
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
      if (registerMode) {
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
      <div className="flex min-h-svh items-center justify-center bg-background text-muted-foreground">
        Loading…
        <Toaster position="top-center" richColors theme="dark" />
      </div>
    );
  }

  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.35_0.12_195/0.25),transparent)]" />
      <div className="relative mx-auto flex min-h-svh max-w-lg flex-col justify-center px-4 py-12">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">VersionGate</p>
          <h1 className="text-3xl font-semibold tracking-tight">{registerMode ? "Create admin" : "Sign in"}</h1>
          <p className="text-sm text-muted-foreground">
            {registerMode
              ? "Choose the email and password for the first administrator. This account owns the control plane."
              : "Sign in to manage projects and deployments."}
          </p>
        </div>

        <Card className="border-border/50 bg-card/80 shadow-xl ring-1 ring-border/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{registerMode ? "Admin registration" : "Credentials"}</CardTitle>
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
                <label htmlFor="vg-login-password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="vg-login-password"
                  type="password"
                  autoComplete={registerMode ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={10}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Please wait…" : registerMode ? "Create account" : "Sign in"}
              </Button>
              {!registerMode ? (
                <p className="text-center text-xs text-muted-foreground">
                  <Link to="/setup" className="text-primary underline-offset-2 hover:underline">
                    Setup wizard
                  </Link>
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
      <Toaster position="top-center" richColors theme="dark" />
    </div>
  );
}
