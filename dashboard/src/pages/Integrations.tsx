import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";

const MANAGE_APP_HREF = "https://github.com/apps/VersionGate-App/installations";
const INSTALL_HREF = "/api/auth/github/install";
const GITHUB_APP_RELAY_CALLBACK = "https://versiongate.tech/api/github/callback";

export function Integrations() {
  const [searchParams, setSearchParams] = useSearchParams();

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
        toast.success("All GitHub integration checkpoints passed.");
      } else {
        toast.error("One or more integration checkpoints reported issues.");
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
        text: "Install state does not match this instance — check PUBLIC_URL and GITHUB_STATE_SECRET.",
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
      toast.success(`Disconnected ${label}`);
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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 pb-16 font-sans">
      {/* Vercel Header Bar */}
      <div className="flex flex-col gap-4 border-b border-neutral-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-neutral-200">Integrations</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Integrations & Git
          </h1>
          <p className="text-xs text-neutral-400">
            Connect external Git providers and cloud relay webhooks for automated deployments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={checking}
            onClick={() => void fetchStatus()}
            className="border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:text-white text-xs h-8"
          >
            {checking ? "Checking..." : "Refresh Status"}
          </Button>
        </div>
      </div>

      {/* Central Cloud Relay Notice Card */}
      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Central Cloud Relay Mode</h3>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900 px-2.5 py-0.5 text-xs text-neutral-300">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Standard Zero-Config
            </span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            VersionGate leverages the central cloud relay at <code className="text-white font-mono">versiongate.tech</code> so you don't have to manually configure a dedicated GitHub App or public TLS webhook listener.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            <div className="rounded-lg border border-neutral-800 bg-black/60 p-3 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                Relay Webhook URL
              </span>
              <p className="font-mono text-xs text-neutral-300 truncate">{webhookUrlHint}</p>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-black/60 p-3 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                Relay Callback URL
              </span>
              <p className="font-mono text-xs text-neutral-300 truncate">{GITHUB_APP_RELAY_CALLBACK}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
          Relay communication is cryptographically verified via mutual HMAC state secrets.
        </div>
      </div>

      {/* Main GitHub Connection Card */}
      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-base font-semibold text-white">GitHub Integration</h3>
            <p className="mt-1 text-xs text-neutral-400">
              Authorize VersionGate to read your repositories and register blue-green build triggers.
            </p>
          </div>

          {!gateReady ? (
            <div className="rounded-lg border border-neutral-800 bg-black/40 p-8 text-center text-xs text-neutral-500">
              Loading GitHub integration status...
            </div>
          ) : gateError ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
              {gateError}
            </div>
          ) : connected && primaryInstallation ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="size-14 border border-neutral-800">
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                    <AvatarFallback className="bg-neutral-900 text-lg font-semibold text-white">
                      {primaryInstallation.githubAccountLogin.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-base">
                        {primaryInstallation.githubAccountLogin}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Connected
                      </span>
                      <span className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 font-mono text-[10px] uppercase text-neutral-400">
                        {primaryInstallation.githubAccountType}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 font-mono">
                      Installation ID: {primaryInstallation.installationId}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={MANAGE_APP_HREF}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 text-xs text-neutral-300 hover:text-white transition-colors"
                  >
                    Manage on GitHub ↗
                  </a>
                  <a
                    href={INSTALL_HREF}
                    className="inline-flex items-center justify-center rounded-md border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 text-xs text-neutral-300 hover:text-white transition-colors"
                  >
                    Add Another Org
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 border-red-900/40 text-red-400 hover:bg-red-950/20 text-xs"
                    onClick={() => setDisconnectTarget("ALL")}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>

              {installationsList.length > 1 && (
                <div className="pt-4 border-t border-neutral-800 space-y-2">
                  <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    All Linked Organizations
                  </span>
                  <div className="space-y-2">
                    {installationsList.map((i) => (
                      <div
                        key={i.installationId}
                        className="flex items-center justify-between rounded-lg border border-neutral-800 bg-black/40 p-3 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{i.githubAccountLogin}</span>
                          <span className="text-neutral-500 font-mono">({i.installationId})</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-neutral-400 hover:text-red-400"
                          onClick={() => setDisconnectTarget(i.installationId)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-neutral-400 max-w-md">
                Connect your GitHub personal account or organization to grant VersionGate access to browse repositories and receive webhook events.
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={INSTALL_HREF}
                  className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-neutral-200 transition-colors"
                >
                  Connect GitHub
                </a>
              </div>
            </div>
          )}

          {/* Manual ID Sync */}
          <div className="pt-6 border-t border-neutral-800 space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-white">Manual Installation ID Sync</h4>
              <p className="mt-0.5 text-xs text-neutral-400">
                If redirected to GitHub settings after installation, copy the numeric ID from the browser URL to sync manually.
              </p>
            </div>
            <form onSubmit={handleManualLink} className="flex flex-wrap items-center gap-2">
              <Input
                type="text"
                placeholder="e.g. 67554316"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="max-w-xs font-mono text-xs bg-black border-neutral-800 text-white"
              />
              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={linking || !manualId.trim()}
                className="border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:text-white text-xs h-9"
              >
                {linking ? "Syncing..." : "Sync ID"}
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
          OAuth and Webhook keys are stored encrypted in the local SQLite database.
        </div>
      </div>

      {/* Integration Diagnostics Card */}
      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Integration Diagnostics</h3>
            <p className="mt-1 text-xs text-neutral-400">
              End-to-end check of database mapping, relay reachability, and GitHub API repository tokens.
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={runningDiagnostics}
            onClick={() => void runDiagnostics()}
            className="border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:text-white text-xs h-8"
          >
            {runningDiagnostics ? "Running Probe..." : "Run Diagnostics"}
          </Button>
        </div>

        <div className="p-6 space-y-4">
          {diagnosticsError ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400 font-mono">
              Diagnostic Error: {diagnosticsError}
            </div>
          ) : null}

          {diagnostics ? (
            <div className="space-y-4">
              <div className="space-y-2">
                {diagnostics.checkpoints.map((cp) => {
                  const isOk = cp.status === "ok";
                  const isFail = cp.status === "fail";
                  const isWarn = cp.status === "warn";

                  return (
                    <div
                      key={cp.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-800 bg-black/40 p-3.5 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{cp.title}</span>
                          {cp.latencyMs !== undefined && (
                            <span className="font-mono text-[11px] text-neutral-500">
                              ({cp.latencyMs}ms)
                            </span>
                          )}
                        </div>
                        <p className="text-neutral-400">{cp.message}</p>
                      </div>

                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border shrink-0",
                          isOk
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : isFail
                              ? "border-red-500/30 bg-red-500/10 text-red-400"
                              : isWarn
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                                : "border-neutral-800 bg-neutral-900 text-neutral-400"
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full shrink-0",
                            isOk ? "bg-emerald-500" : isFail ? "bg-red-500" : "bg-amber-500"
                          )}
                        />
                        {isOk ? "Passed" : isFail ? "Failed" : isWarn ? "Warning" : "Skipped"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {diagnostics.recommendations.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-2 text-xs">
                  <span className="font-semibold text-amber-400">Troubleshooting Advice</span>
                  <ul className="list-disc pl-4 space-y-1 text-neutral-400">
                    {diagnostics.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 text-center py-6">
              Run diagnostics above to verify relay connectivity and repository permissions.
            </p>
          )}
        </div>

        <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
          Last probe result cached for 60 seconds.
        </div>
      </div>

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
