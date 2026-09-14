import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ApiError,
  getGithubInstallation,
  getGithubIntegrationStatus,
  linkGithubInstallation,
  deleteGithubInstallation,
  testGithubConnection,
  type GithubInstallationSummary,
  type GithubDiagnosticsResponse,
} from "@/lib/api";
import { Separator } from "@/components/ui/separator";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";

const MANAGE_APP_HREF = "https://github.com/apps/VersionGate-App/installations";
const INSTALL_HREF = "/api/auth/github/install";
/** Central relay — GitHub App "Callback URL" (fixed for all self-hosted instances). */
const GITHUB_APP_RELAY_CALLBACK = "https://versiongate.tech/api/github/callback";

export function Integrations() {
  const [searchParams, setSearchParams] = useSearchParams();

  /** Until first `/api/github/installation` response — avoid flashing Connect vs Connected. */
  const [gateReady, setGateReady] = useState(false);
  const [primaryInstallation, setPrimaryInstallation] = useState<GithubInstallationSummary | null>(null);
  const [installationsList, setInstallationsList] = useState<GithubInstallationSummary[]>([]);
  const [gateError, setGateError] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [manualId, setManualId] = useState("");
  const [linking, setLinking] = useState(false);
  const [checking, setChecking] = useState(false);

  const [diagnostics, setDiagnostics] = useState<GithubDiagnosticsResponse | null>(null);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);

  const runDiagnostics = async (installationId?: string) => {
    setRunningDiagnostics(true);
    setDiagnosticsError(null);
    try {
      const res = await testGithubConnection(installationId ?? primaryInstallation?.installationId);
      setDiagnostics(res);
      if (res.healthy) {
        toast.success("[ OK ] All GitHub integration checkpoints passed.");
      } else {
        toast.error("[ ATTENTION ] One or more integration checkpoints reported issues.");
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to run diagnostics probe.";
      setDiagnosticsError(msg);
      toast.error(msg);
    } finally {
      setRunningDiagnostics(false);
    }
  };

  const fetchStatus = async () => {
    setChecking(true);
    try {
      const r = await getGithubInstallation();
      setPrimaryInstallation(r.installation);
      setInstallationsList(r.installations);
      setGateError(null);
    } catch (e) {
      setGateError(e instanceof ApiError ? e.message : "Failed to load GitHub installation.");
      setPrimaryInstallation(null);
      setInstallationsList([]);
    } finally {
      setGateReady(true);
      setChecking(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setGateReady(false);
      setGateError(null);
      try {
        const r = await getGithubInstallation();
        if (cancelled) return;
        setPrimaryInstallation(r.installation);
        setInstallationsList(r.installations);
      } catch (e) {
        if (!cancelled) {
          setGateError(e instanceof ApiError ? e.message : "Failed to load GitHub installation.");
          setPrimaryInstallation(null);
          setInstallationsList([]);
        }
      } finally {
        if (!cancelled) setGateReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Optional avatar when GitHub App credentials exist on the server (does not affect connected/disconnected). */
  useEffect(() => {
    if (!primaryInstallation) {
      setAvatarUrl(null);
      return;
    }
    let cancelled = false;
    void getGithubIntegrationStatus()
      .then((s) => {
        if (cancelled) return;
        setAvatarUrl(s.installation?.avatarUrl ?? null);
      })
      .catch(() => {
        if (!cancelled) setAvatarUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [primaryInstallation?.installationId]);

  const githubQuery = useMemo(() => {
    const g = searchParams.get("github");
    return g ? g.trim().toLowerCase() : null;
  }, [searchParams]);

  const webhookUrlHint = "https://versiongate.tech/api/webhooks/github";

  useEffect(() => {
    if (!githubQuery) return;
    const messages: Record<string, { type: "success" | "error"; text: string }> = {
      connected: { type: "success", text: "GitHub App connected successfully." },
      auth_required: {
        type: "error",
        text: "Could not link the installation — sign in to VersionGate and try again.",
      },
      config: { type: "error", text: "GitHub App is not configured on this server." },
      missing_installation: { type: "error", text: "Missing installation from GitHub redirect." },
      bad_installation: { type: "error", text: "Could not read installation details from GitHub." },
      bad_state: {
        type: "error",
        text: "Install state does not match this instance — check PUBLIC_URL and GITHUB_STATE_SECRET match the relay.",
      },
    };
    const m = messages[githubQuery];
    if (m) {
      if (m.type === "success") toast.success(m.text);
      else toast.error(m.text);
    }
    setSearchParams({}, { replace: true });
  }, [githubQuery, setSearchParams]);

  const handleManualLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = manualId.trim();
    if (!cleanId || !/^\d+$/.test(cleanId)) {
      toast.error("Enter a valid numeric GitHub Installation ID (e.g. 67554316)");
      return;
    }
    setLinking(true);
    try {
      const res = await linkGithubInstallation(cleanId);
      toast.success(`GitHub Installation #${res.installationId} linked successfully!`);
      setManualId("");
      await fetchStatus();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to link installation ID.");
    } finally {
      setLinking(false);
    }
  };

  const [disconnectTarget, setDisconnectTarget] = useState<string | "ALL" | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const executeDisconnect = async () => {
    if (!disconnectTarget) return;
    setDisconnecting(true);
    const targetId = disconnectTarget === "ALL" ? undefined : disconnectTarget;
    const label = targetId ? `installation #${targetId}` : "all connected GitHub installations";
    try {
      await deleteGithubInstallation(targetId);
      toast.success(`[ OK ] Disconnected ${label}`);
      setDisconnectTarget(null);
      await fetchStatus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect installation");
    } finally {
      setDisconnecting(false);
    }
  };

  const connected = primaryInstallation !== null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title="Integrations"
        description="Connect external services for project setup and automation"
        mono
      />

      <Alert className="border-border bg-muted">
        <AlertTitle className="font-mono text-xs uppercase tracking-wider">Primary Integration Mode — Central Cloud Relay</AlertTitle>
        <AlertDescription className="space-y-2 text-muted-foreground [&_p]:text-sm">
          <p>
            VersionGate uses zero-config <strong className="text-foreground">Central Cloud Relay Mode</strong> via{" "}
            <code className="font-mono text-xs text-foreground">versiongate.tech</code>. You do <strong className="text-foreground">not</strong> need to create a custom GitHub App.
          </p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Relay Webhook URL (fixed)</p>
          <code className="block max-w-full overflow-x-auto break-all border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground">
            {webhookUrlHint}
          </code>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Relay Callback URL (fixed)</p>
          <code className="block max-w-full overflow-x-auto break-all border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground">
            {GITHUB_APP_RELAY_CALLBACK}
          </code>
        </AlertDescription>
      </Alert>

      {/* Main GitHub Integration Card (Central Relay Mode) */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">
                  GitHub Integration
                </CardTitle>
                <Badge variant="outline" className="font-sans text-[10px] uppercase tracking-wider">
                  Primary // Relay
                </Badge>
              </div>
              <CardDescription>
                Install the official VersionGate GitHub App to connect your repositories and enable automated git push deploys.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!gateReady ? (
            <div className="space-y-4" aria-busy="true" aria-label="Loading GitHub integration">
              <div className="flex items-center gap-4">
                <Skeleton className="size-14 shrink-0 rounded-full" />
                <div className="grid min-w-0 flex-1 gap-2">
                  <Skeleton className="h-5 w-48 max-w-full" />
                  <Skeleton className="h-4 w-72 max-w-full" />
                  <Skeleton className="h-4 w-40 max-w-full" />
                </div>
              </div>
              <Skeleton className="h-9 w-full max-w-xs rounded-lg" />
            </div>
          ) : gateError ? (
            <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {gateError}
            </div>
          ) : connected && primaryInstallation ? (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <Avatar size="lg" className="size-14 border border-border">
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                    <AvatarFallback className="bg-muted text-lg font-semibold">
                      {primaryInstallation.githubAccountLogin.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-mono text-base font-semibold text-foreground">
                        {primaryInstallation.githubAccountLogin}
                      </p>
                      <Badge className="font-normal">Connected</Badge>
                      <Badge variant="outline" className="font-normal capitalize">
                        {primaryInstallation.githubAccountType}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Installation ID <span className="font-mono">{primaryInstallation.installationId}</span>
                    </p>
                    {installationsList.length > 1 ? (
                      <p className="text-xs text-muted-foreground">
                        + {installationsList.length - 1} other installation
                        {installationsList.length > 2 ? "s" : ""} linked to your account
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <a
                    href={MANAGE_APP_HREF}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex gap-1.5 font-sans text-xs")}
                  >
                    Manage on GitHub
                  </a>
                  <a href={INSTALL_HREF} className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "font-sans text-xs")}>
                    Add another org
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-neutral-400 hover:text-rose-400 text-xs font-sans"
                    onClick={() => setDisconnectTarget("ALL")}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
              {installationsList.length > 1 ? (
                <>
                  <Separator />
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground font-mono">
                      All installations
                    </p>
                    <ul className="grid gap-2 text-sm">
                      {installationsList.map((i) => (
                        <li
                          key={i.installationId}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">{i.githubAccountLogin}</span>
                            <span className="text-xs capitalize text-muted-foreground font-mono">{i.githubAccountType}</span>
                            <span className="font-mono text-xs text-muted-foreground">({i.installationId})</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-neutral-400 hover:text-rose-400"
                            onClick={() => setDisconnectTarget(i.installationId)}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Connect your GitHub account or organization so VersionGate can read repositories you grant access to.
                </p>
                <div className="flex flex-wrap gap-2">
                  <a href={INSTALL_HREF} className={cn(buttonVariants(), "font-mono text-xs")}>
                    Connect GitHub
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={checking}
                    onClick={() => void fetchStatus()}
                    className="inline-flex gap-1.5 font-mono text-xs"
                  >
                    Re-check
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Separator />
          <div className="space-y-3 pt-1">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                Already authorized on GitHub? / Manual Sync
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                If GitHub stays on the settings page (<code className="font-mono text-[11px] text-foreground">github.com/settings/installations/123456</code>) after granting permissions, copy the numeric Installation ID from your address bar and sync it below:
              </p>
            </div>
            <form onSubmit={handleManualLink} className="flex flex-wrap items-center gap-2">
              <Input
                type="text"
                placeholder="e.g. 67554316"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="max-w-xs font-mono text-xs"
              />
              <Button type="submit" size="sm" variant="secondary" disabled={linking || !manualId.trim()}>
                {linking ? "Syncing..." : "Sync Installation ID"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* GitHub Connection Diagnostics & Checkpoints */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  Integration Diagnostics // Connection Checkpoints
                </CardTitle>
                <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                  {runningDiagnostics
                    ? "[ PROBING... ]"
                    : diagnostics
                    ? diagnostics.healthy
                      ? "[ HEALTHY ]"
                      : "[ ATTENTION ]"
                    : "[ READY ]"}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Real-time end-to-end status probe checking local database records, relay reachability, and GitHub API repository access.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant={diagnostics?.healthy === false ? "default" : "outline"}
                disabled={runningDiagnostics}
                onClick={() => void runDiagnostics()}
                className="font-mono text-xs"
              >
                {runningDiagnostics ? "Running Probe..." : "Run Diagnostics"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {diagnosticsError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-mono text-destructive">
              [ FAIL ] {diagnosticsError}
            </div>
          ) : null}

          {diagnostics ? (
            <div className="space-y-4">
              <div className="grid gap-2 font-mono text-xs">
                {diagnostics.checkpoints.map((cp, idx) => {
                  const stepNum = `0${idx + 1} //`;
                  const isOk = cp.status === "ok";
                  const isFail = cp.status === "fail";
                  const isWarn = cp.status === "warn";

                  const badgeClass = isOk
                    ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                    : isFail
                    ? "border-rose-500/30 text-rose-500 bg-rose-500/10"
                    : isWarn
                    ? "border-amber-500/30 text-amber-500 bg-amber-500/10"
                    : "border-border text-muted-foreground bg-muted/30";

                  const badgeText = isOk
                    ? "[ OK ]"
                    : isFail
                    ? "[ FAIL ]"
                    : isWarn
                    ? "[ WARN ]"
                    : "[ SKIP ]";

                  return (
                    <div
                      key={cp.id}
                      className="flex flex-col gap-2 rounded-md border border-border/80 bg-muted/20 p-3 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <span className="text-muted-foreground font-semibold shrink-0">{stepNum}</span>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-foreground">{cp.title}</span>
                            {cp.latencyMs !== undefined ? (
                              <span className="text-[10px] text-muted-foreground">({cp.latencyMs}ms)</span>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground break-words font-sans">{cp.message}</p>
                        </div>
                      </div>
                      <div className="shrink-0 self-start sm:self-center">
                        <span
                          className={cn(
                            "inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-bold tracking-wider font-mono",
                            badgeClass
                          )}
                        >
                          {badgeText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {diagnostics.recommendations.length > 0 ? (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-2">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-amber-500">
                    Remediation & Troubleshooting Advice
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground list-disc pl-4 font-sans">
                    {diagnostics.recommendations.map((rec, i) => (
                      <li key={i} className="leading-relaxed">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-[11px] font-mono text-muted-foreground">
                <span>
                  Mode: <strong className="text-foreground">{diagnostics.mode === "direct" ? "Direct GitHub App" : "Central Cloud Relay"}</strong>
                </span>
                <span>
                  Last Probe: <strong className="text-foreground">{new Date(diagnostics.timestamp).toLocaleTimeString()}</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-center">
              <p className="text-xs text-muted-foreground font-sans">
                Run diagnostics to verify local database mapping, relay reachability, and GitHub API repository access.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Developer Settings Card — Custom Self-Hosted GitHub App Manifest (Advanced Mode) */}
      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <span className="font-mono text-xs opacity-70">DEV</span>
                  Developer Settings // Custom GitHub App Manifest
                </CardTitle>
                <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider">
                  Advanced Mode
                </Badge>
              </div>
              <CardDescription className="text-xs">
                For isolated or enterprise environments: Create your own self-hosted GitHub App using 1-Click Manifest registration instead of the central cloud relay.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 font-mono text-xs">
          <div className="rounded-md border border-border bg-muted/40 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground uppercase tracking-wider text-[11px]">Integration Mode</span>
              <Badge variant="outline" className="font-mono text-xs">
                {connected ? "Central Relay Active" : "Relay Standard Mode"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground uppercase tracking-wider text-[11px]">GITHUB_APP_ID</span>
              <span className="text-foreground font-mono">
                {import.meta.env.VITE_GITHUB_APP_ID ? String(import.meta.env.VITE_GITHUB_APP_ID) : "Using Relay"}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground font-sans">
            To switch from Central Relay Mode to your own dedicated GitHub App, set <code className="font-mono text-[11px]">GITHUB_APP_ID</code> and <code className="font-mono text-[11px]">GITHUB_APP_PRIVATE_KEY</code> in your server <code className="font-mono text-[11px]">.env</code> file.
          </p>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        After connecting, use{" "}
        <Link className="text-primary underline-offset-2 hover:underline" to="/projects">
          New project
        </Link>{" "}
        to pick a repository and branch.
      </p>

      <ConfirmDialog
        open={Boolean(disconnectTarget)}
        onOpenChange={(open) => {
          if (!open) setDisconnectTarget(null);
        }}
        title="Disconnect GitHub Installation?"
        description={
          disconnectTarget === "ALL"
            ? "This will disconnect all linked GitHub organizations and accounts from VersionGate. Auto-deployment webhooks and repository pickers will no longer have access."
            : `This will disconnect installation #${disconnectTarget} from VersionGate. Automatic deployment webhooks for repositories under this account will stop receiving events.`
        }
        confirmLabel="Disconnect"
        variant="destructive"
        busy={disconnecting}
        onConfirm={executeDisconnect}
      />
    </div>
  );
}
