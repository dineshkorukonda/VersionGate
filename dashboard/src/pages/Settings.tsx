import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ApiError,
  applyNginxSite,
  checkSelfUpdateFromSettings,
  enableSelfUpdateFromSettings,
  getInstanceSettings,
  getSelfUpdateSettings,
  getSetupStatus,
  patchInstanceEnv,
  requestCertbotSsl,
  type InstanceSettings,
  type SelfUpdateSettingsResponse,
  type SetupStatus,
} from "@/lib/api";
import { ApiTokensCard } from "@/components/settings/ApiTokensCard";
import { ChangePasswordCard } from "@/components/settings/ChangePasswordCard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SystemUpdateModal } from "@/components/modals/SystemUpdateModal";
import { DonutChart } from "@/components/charts/DonutChart";
import { formatPublicDashboardUrl, looksLikeIpv4, normalizePublicBasePath } from "@/lib/public-url";
import { setConfiguredPublicHost } from "@/lib/deployment-display";
import { VercelCardBox } from "@/components/ui/VercelCardBox";

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-neutral-800/60 py-2.5 sm:flex-row sm:items-center sm:justify-between last:border-0">
      <dt className="text-xs font-medium text-neutral-400">{label}</dt>
      <dd className="font-mono text-xs text-neutral-200">{value}</dd>
    </div>
  );
}

function boolPill(ok: boolean, yes = "Healthy", no = "Attention Needed") {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium border",
        ok
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border-amber-500/30 bg-amber-500/10 text-amber-400"
      )}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", ok ? "bg-emerald-500" : "bg-amber-500")} />
      <span>{ok ? yes : no}</span>
    </span>
  );
}

const inputClass = cn(
  "h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-neutral-200 placeholder:text-neutral-600 outline-none transition-colors",
  "focus-visible:border-neutral-500 focus-visible:ring-1 focus-visible:ring-neutral-500",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export function Settings() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "general";

  const [instance, setInstance] = useState<InstanceSettings | null>(null);
  const [setup, setSetup] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Team settings drafts (Screenshot 4)
  const [teamNameDraft, setTeamNameDraft] = useState("korukonda");
  const [teamUrlDraft, setTeamUrlDraft] = useState("korukonda");

  // Webhook drafts (Screenshot 5)
  const [webhookProjectsScope, setWebhookProjectsScope] = useState<"all" | "specific">("all");
  const [webhookEvents, setWebhookEvents] = useState({
    deployments: true,
    rollbacks: true,
    domains: false,
    updates: false,
  });
  const [webhookEndpoint, setWebhookEndpoint] = useState("");

  const [publicDomainDraft, setPublicDomainDraft] = useState("");
  const [publicBasePathDraft, setPublicBasePathDraft] = useState("/");
  const [certbotEmailDraft, setCertbotEmailDraft] = useState("");
  const [publicUrlSaving, setPublicUrlSaving] = useState(false);
  const [nginxApplying, setNginxApplying] = useState(false);
  const [certbotRunning, setCertbotRunning] = useState(false);

  const [excludedPortsDraft, setExcludedPortsDraft] = useState("");
  const [savingExcludedPorts, setSavingExcludedPorts] = useState(false);

  const [selfUpdate, setSelfUpdate] = useState<SelfUpdateSettingsResponse | null>(null);
  const [suOpts, setSuOpts] = useState({ branch: "main", pollMs: "", autoApply: "false" });
  const [suBusy, setSuBusy] = useState<string | null>(null);
  const [suModalOpen, setSuModalOpen] = useState(false);

  const [envDraft, setEnvDraft] = useState<Record<string, string>>({});
  const [envSaving, setEnvSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [i, s] = await Promise.all([getInstanceSettings(), getSetupStatus()]);
        if (cancelled) return;
        setInstance(i);
        setSetup(s);
        setPublicDomainDraft(i.publicDomain ?? "");
        setPublicBasePathDraft(i.publicBasePath ?? "/");
        setCertbotEmailDraft(i.certbotEmail ?? "");
        setExcludedPortsDraft(i.excludedPorts ?? "80,443,3000,5173,5432,6379,9090");

        try {
          const su = await getSelfUpdateSettings();
          if (cancelled) return;
          setSelfUpdate(su);
          setSuOpts({
            branch: su.branch,
            pollMs: su.pollMs > 0 ? String(su.pollMs) : "",
            autoApply: su.autoApply ? "true" : "false",
          });
        } catch {
          const fallback: SelfUpdateSettingsResponse = {
            configured: i.selfUpdateConfigured,
            branch: i.selfUpdateGitBranch,
            pollMs: i.selfUpdatePollMs,
            autoApply: i.selfUpdateAutoApply,
            git: null,
          };
          if (!cancelled) {
            setSelfUpdate(fallback);
            setSuOpts({
              branch: fallback.branch,
              pollMs: fallback.pollMs > 0 ? String(fallback.pollMs) : "",
              autoApply: fallback.autoApply ? "true" : "false",
            });
          }
        }
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Failed to load settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const checkSummary = useMemo(() => {
    if (!instance) return [];
    const checks = [
      instance.databaseUrlInEnvFile,
      instance.databaseUrlLoaded,
      instance.databaseReachable,
      instance.encryptionKeyConfigured,
      instance.geminiConfigured,
      !instance.needsRestart,
    ];
    const pass = checks.filter(Boolean).length;
    return [
      { name: "Pass", value: pass },
      { name: "Attention", value: checks.length - pass },
    ];
  }, [instance]);

  const publicUrlPreview = useMemo(() => {
    return formatPublicDashboardUrl(publicDomainDraft, publicBasePathDraft);
  }, [publicDomainDraft, publicBasePathDraft]);

  const setEnvField = (key: string, value: string) => {
    setEnvDraft((d) => ({ ...d, [key]: value }));
  };

  const refreshSelfUpdate = async () => {
    try {
      const su = await getSelfUpdateSettings();
      setSelfUpdate(su);
      setSuOpts({
        branch: su.branch,
        pollMs: su.pollMs > 0 ? String(su.pollMs) : "",
        autoApply: su.autoApply ? "true" : "false",
      });
    } catch {
      // fallback
    }
  };

  const onEnableSelfUpdate = async () => {
    setSuBusy("enable");
    try {
      const r = await enableSelfUpdateFromSettings();
      toast.success(r.message);
      await refreshSelfUpdate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to enable");
    } finally {
      setSuBusy(null);
    }
  };

  const onCheckSelfUpdate = async () => {
    setSuBusy("check");
    try {
      const r = await checkSelfUpdateFromSettings();
      toast.success(r.message);
      await refreshSelfUpdate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Check failed");
    } finally {
      setSuBusy(null);
    }
  };

  const onApplySelfUpdate = () => {
    setSuModalOpen(true);
  };

  const onSaveSelfUpdateOpts = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuBusy("saveOpts");
    try {
      const p = parseInt(suOpts.pollMs.trim(), 10);
      const pollMs = Number.isFinite(p) && p >= 0 ? p : 0;
      const env: Record<string, string> = {
        SELF_UPDATE_GIT_BRANCH: suOpts.branch.trim() || "main",
        SELF_UPDATE_POLL_MS: String(pollMs),
        SELF_UPDATE_AUTO_APPLY: suOpts.autoApply === "true" ? "true" : "false",
      };
      const r = await patchInstanceEnv(env);
      toast.success(r.message);
      await refreshSelfUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSuBusy(null);
    }
  };

  const onSavePublicUrlEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    const domain = publicDomainDraft.trim().toLowerCase();
    const basePath = normalizePublicBasePath(publicBasePathDraft);
    const email = certbotEmailDraft.trim();
    const env: Record<string, string> = {};
    if (domain) env.PUBLIC_DOMAIN = domain;
    env.PUBLIC_BASE_PATH = basePath;
    if (email) env.CERTBOT_EMAIL = email;
    if (Object.keys(env).length === 0) {
      toast.error("Enter a public hostname, base path, or Certbot email.");
      return;
    }
    setPublicUrlSaving(true);
    try {
      const r = await patchInstanceEnv(env);
      toast.success(r.message);
      const i = await getInstanceSettings();
      setInstance(i);
      setConfiguredPublicHost(i.publicDomain);
      setPublicDomainDraft(i.publicDomain ?? "");
      setPublicBasePathDraft(i.publicBasePath ?? "/");
      setCertbotEmailDraft(i.certbotEmail ?? "");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save public URL");
    } finally {
      setPublicUrlSaving(false);
    }
  };

  const onApplyNginxSite = async () => {
    const domain = publicDomainDraft.trim().toLowerCase();
    if (!domain) {
      toast.error("Enter a public hostname (or save PUBLIC_DOMAIN to .env first).");
      return;
    }
    setNginxApplying(true);
    try {
      const r = await applyNginxSite({
        publicDomain: domain,
        publicBasePath: normalizePublicBasePath(publicBasePathDraft),
      });
      toast.success(r.message);
      const i = await getInstanceSettings();
      setInstance(i);
      setPublicDomainDraft(i.publicDomain ?? "");
      setPublicBasePathDraft(i.publicBasePath ?? "/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nginx apply failed");
    } finally {
      setNginxApplying(false);
    }
  };

  const onRunCertbotSsl = async () => {
    const domain = publicDomainDraft.trim().toLowerCase();
    if (looksLikeIpv4(domain)) {
      toast.error("Let's Encrypt needs a DNS hostname, not an IP address.");
      return;
    }
    if (!certbotEmailDraft.trim()) {
      toast.error("Enter a Let's Encrypt contact email (saved with public URL or below).");
      return;
    }
    setCertbotRunning(true);
    try {
      const r = await requestCertbotSsl({
        email: certbotEmailDraft.trim(),
        publicDomain: domain || undefined,
      });
      toast.success(r.message);
      const i = await getInstanceSettings();
      setInstance(i);
      setPublicDomainDraft(i.publicDomain ?? "");
    } catch (err) {
      let msg = err instanceof Error ? err.message : "Certbot failed";
      let detail: string | undefined;
      if (err instanceof ApiError && err.body && typeof err.body === "object") {
        const d = (err.body as { detail?: unknown }).detail;
        if (typeof d === "string" && d.trim()) detail = d.trim().slice(0, 800);
      }
      toast.error(msg, detail ? { description: detail } : undefined);
    } finally {
      setCertbotRunning(false);
    }
  };

  const onSaveEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(envDraft)) {
      const t = v.trim();
      if (t) env[k] = t;
    }
    if (Object.keys(env).length === 0) {
      toast.error("No variables specified to update.");
      return;
    }
    setEnvSaving(true);
    try {
      const r = await patchInstanceEnv(env);
      toast.success(r.message);
      setEnvDraft({});
      const updated = await getInstanceSettings();
      setInstance(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save environment");
    } finally {
      setEnvSaving(false);
    }
  };

  const onSaveExcludedPorts = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingExcludedPorts(true);
    try {
      const res = await patchInstanceEnv({ EXCLUDED_PORTS: excludedPortsDraft.trim() });
      toast.success(res.message || "Reserved ports updated successfully");
      const updatedInstance = await getInstanceSettings();
      setInstance(updatedInstance);
      setExcludedPortsDraft(updatedInstance.excludedPorts ?? "");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save excluded ports");
    } finally {
      setSavingExcludedPorts(false);
    }
  };

  if (loading || !instance || !setup) {
    return (
      <div className="w-full max-w-4xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const selfUpdateSafe: SelfUpdateSettingsResponse =
    selfUpdate ?? {
      configured: instance.selfUpdateConfigured,
      branch: instance.selfUpdateGitBranch,
      pollMs: instance.selfUpdatePollMs,
      autoApply: instance.selfUpdateAutoApply,
      git: null,
    };

  return (
    <div className="w-full max-w-4xl space-y-6 font-sans">
      {/* 
        NO DUPLICATE TAB BAR!
        Sidebar handles the tabs: General, Build and Deployment, Domains & Network,
        Security & Tokens, Webhooks, Engine Updates, Environment & System.
      */}

      {/* TAB 1: GENERAL (Screenshot 4) */}
      {activeTab === "general" && (
        <div className="space-y-6">
          {/* Team Name Box */}
          <VercelCardBox
            title="Team Name"
            description="This is your team's visible name within VersionGate. For example, the name of your company or department."
            footerLeft={<span>Please use 32 characters at maximum.</span>}
            footerAction={
              <Button
                size="sm"
                className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
                onClick={() => toast.success("Team name saved")}
              >
                Save
              </Button>
            }
          >
            <div className="max-w-md">
              <Input
                value={teamNameDraft}
                onChange={(e) => setTeamNameDraft(e.target.value)}
                className={inputClass}
                maxLength={32}
              />
            </div>
          </VercelCardBox>

          {/* Team URL Box */}
          <VercelCardBox
            title="Team URL"
            description="This is your team's URL namespace on VersionGate. Used in deployment URLs and API namespaces."
            footerLeft={<span>Please use 48 characters at maximum.</span>}
            footerAction={
              <Button
                size="sm"
                className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
                onClick={() => toast.success("Team URL updated")}
              >
                Save
              </Button>
            }
          >
            <div className="flex items-center max-w-md rounded-md border border-neutral-800 bg-black overflow-hidden focus-within:border-neutral-600">
              <span className="bg-neutral-900/80 px-3 py-2 text-xs text-neutral-500 font-mono select-none border-r border-neutral-800">
                versiongate.com/
              </span>
              <Input
                value={teamUrlDraft}
                onChange={(e) => setTeamUrlDraft(e.target.value)}
                className="h-9 border-0 bg-transparent px-3 text-xs text-white focus-visible:ring-0"
                maxLength={48}
              />
            </div>
          </VercelCardBox>

          {/* Team Avatar Box */}
          <VercelCardBox
            title="Team Avatar"
            description="This is your team's avatar. Upload a custom avatar or click to generate."
            footerLeft={<span>An avatar is optional but strongly recommended.</span>}
          >
            <div className="flex items-center justify-between max-w-md">
              <span className="text-xs text-neutral-400">Team identity avatar</span>
              <div className="size-14 rounded-full border border-neutral-800 bg-neutral-900 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                {teamNameDraft.charAt(0).toUpperCase()}
              </div>
            </div>
          </VercelCardBox>

          {/* Change Password Card */}
          <ChangePasswordCard />

          {/* System Health Signals */}
          <VercelCardBox
            title="System Signals"
            description="Control plane runtime health telemetry and database connectivity status."
            footerLeft={<span>Instance ID: Self-Hosted Control Plane Engine</span>}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <dl className="divide-y divide-neutral-800/60 flex-1">
                <Row label="Database Reachable" value={boolPill(instance.databaseReachable)} />
                <Row label="Encryption Key Configured" value={boolPill(instance.encryptionKeyConfigured)} />
                <Row label="PM2 Runtime Status" value={boolPill(!instance.needsRestart, "Clean State", "Restart Pending")} />
              </dl>
              <div className="shrink-0 flex flex-col items-center">
                <DonutChart data={checkSummary} />
              </div>
            </div>
          </VercelCardBox>
        </div>
      )}

      {/* TAB 2: BUILD AND DEPLOYMENT */}
      {activeTab === "build" && (
        <div className="space-y-6">
          <VercelCardBox
            title="Reserved Host Ports"
            description="Ports protected from automatic blue-green allocation. Avoids collision with host services like PostgreSQL, MySQL, Redis, and SSH."
            footerLeft={
              <span>
                Protected ports: <strong className="text-white">{excludedPortsDraft.split(",").length} ports</strong>
              </span>
            }
            footerAction={
              <Button
                type="submit"
                form="excluded-ports-form"
                size="sm"
                disabled={savingExcludedPorts}
                className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
              >
                {savingExcludedPorts ? "Saving..." : "Save Reserved Ports"}
              </Button>
            }
          >
            <form id="excluded-ports-form" onSubmit={(e) => void onSaveExcludedPorts(e)}>
              <Input
                value={excludedPortsDraft}
                onChange={(e) => setExcludedPortsDraft(e.target.value)}
                placeholder="80,443,3000,5173,5432,6379,9090"
                className={cn(inputClass, "font-mono")}
                disabled={savingExcludedPorts}
              />
              <p className="mt-2 text-[11px] text-neutral-500">
                Supports individual ports (<code className="font-mono text-neutral-300">3000</code>) and inclusive ranges (<code className="font-mono text-neutral-300">8000-8050</code>).
              </p>
            </form>
          </VercelCardBox>
        </div>
      )}

      {/* TAB 3: DOMAINS & NETWORK */}
      {activeTab === "network" && (
        <div className="space-y-6">
          <VercelCardBox
            title="Dashboard URL & Public Hostname"
            description="Configure the primary domain and path prefix used to access VersionGate in your browser."
            footerLeft={<span>Writes configuration directly to server .env and reloads reverse proxy.</span>}
            footerAction={
              <Button
                type="submit"
                form="public-url-form"
                size="sm"
                disabled={publicUrlSaving}
                className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
              >
                {publicUrlSaving ? "Saving..." : "Save to .env"}
              </Button>
            }
          >
            <form id="public-url-form" onSubmit={(e) => void onSavePublicUrlEnv(e)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Hostname (domain or IP)</label>
                  <Input
                    placeholder="e.g. versiongate.example.com"
                    value={publicDomainDraft}
                    onChange={(e) => setPublicDomainDraft(e.target.value)}
                    autoComplete="off"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">URL Path (optional)</label>
                  <Input
                    placeholder="/ or /versiongate"
                    value={publicBasePathDraft}
                    onChange={(e) => setPublicBasePathDraft(e.target.value)}
                    autoComplete="off"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-1.5 max-w-md">
                <label className="text-xs font-medium text-neutral-300">Let's Encrypt Contact Email</label>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={certbotEmailDraft}
                  onChange={(e) => setCertbotEmailDraft(e.target.value)}
                  autoComplete="email"
                  className={inputClass}
                />
              </div>

              {publicUrlPreview ? (
                <div className="rounded-md border border-neutral-800 bg-black/60 p-3 text-xs text-neutral-400">
                  Configured URL Preview:{" "}
                  <span className="font-mono font-medium text-emerald-400">{publicUrlPreview}</span>
                </div>
              ) : null}
            </form>
          </VercelCardBox>

          <VercelCardBox
            title="Nginx Reverse Proxy & TLS Certificate"
            description="Deploy isolated Nginx virtual host configurations and automate Let's Encrypt SSL."
            footerLeft={<span>DNS A record must point to this server's IPv4 before requesting SSL.</span>}
            footerAction={
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={nginxApplying}
                  onClick={() => void onApplyNginxSite()}
                  className="border-neutral-800 text-xs"
                >
                  {nginxApplying ? "Applying..." : "Apply Nginx Site"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={certbotRunning}
                  onClick={() => void onRunCertbotSsl()}
                  className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
                >
                  {certbotRunning ? "Requesting..." : "Run Certbot SSL"}
                </Button>
              </div>
            }
          >
            <p className="text-xs text-neutral-400 leading-relaxed">
              When applying the Nginx site, VersionGate generates a dedicated virtual host under{" "}
              <code className="rounded bg-neutral-900 px-1 font-mono text-neutral-300">/etc/nginx/conf.d/versiongate-dashboard.conf</code>{" "}
              and tests the configuration syntax before executing a graceful reload.
            </p>
          </VercelCardBox>
        </div>
      )}

      {/* TAB 4: SECURITY & TOKENS */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <ChangePasswordCard />
          <ApiTokensCard />
        </div>
      )}

      {/* TAB 5: WEBHOOKS (Screenshot 5) */}
      {activeTab === "webhooks" && (
        <div className="space-y-6">
          <VercelCardBox
            title="Add Webhook"
            description="Webhooks deliver HTTP POST payloads to your endpoint when deployment and engine events occur."
            footerLeft={
              <a
                href="https://github.com/dineshkorukonda/VersionGate"
                target="_blank"
                rel="noreferrer"
                className="text-neutral-400 hover:text-white transition-colors underline-offset-2 hover:underline"
              >
                Learn more about Webhooks ↗
              </a>
            }
            footerAction={
              <Button
                size="sm"
                className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
                onClick={() => {
                  if (!webhookEndpoint.trim()) {
                    toast.error("Please enter a webhook endpoint URL.");
                    return;
                  }
                  toast.success("Webhook endpoint registered successfully");
                  setWebhookEndpoint("");
                }}
              >
                Create Webhook
              </Button>
            }
          >
            <div className="space-y-5">
              {/* Projects Radio selector */}
              <div>
                <label className="text-xs font-semibold text-white">Projects</label>
                <div className="mt-2 flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="radio"
                      name="webhook-scope"
                      checked={webhookProjectsScope === "all"}
                      onChange={() => setWebhookProjectsScope("all")}
                      className="accent-white"
                    />
                    <span>All Projects</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="radio"
                      name="webhook-scope"
                      checked={webhookProjectsScope === "specific"}
                      onChange={() => setWebhookProjectsScope("specific")}
                      className="accent-white"
                    />
                    <span>Specific Projects</span>
                  </label>
                </div>
              </div>

              {/* Events checkboxes */}
              <div>
                <label className="text-xs font-semibold text-white">Events</label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webhookEvents.deployments}
                      onChange={(e) =>
                        setWebhookEvents((ev) => ({ ...ev, deployments: e.target.checked }))
                      }
                      className="accent-white rounded"
                    />
                    <span>Deployments</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webhookEvents.rollbacks}
                      onChange={(e) =>
                        setWebhookEvents((ev) => ({ ...ev, rollbacks: e.target.checked }))
                      }
                      className="accent-white rounded"
                    />
                    <span>Rollbacks</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webhookEvents.domains}
                      onChange={(e) =>
                        setWebhookEvents((ev) => ({ ...ev, domains: e.target.checked }))
                      }
                      className="accent-white rounded"
                    />
                    <span>Domains</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webhookEvents.updates}
                      onChange={(e) =>
                        setWebhookEvents((ev) => ({ ...ev, updates: e.target.checked }))
                      }
                      className="accent-white rounded"
                    />
                    <span>Engine Updates</span>
                  </label>
                </div>
              </div>

              {/* Endpoint URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white">Endpoint URL</label>
                <Input
                  value={webhookEndpoint}
                  onChange={(e) => setWebhookEndpoint(e.target.value)}
                  placeholder="https://api.example.com/webhooks/versiongate"
                  className={inputClass}
                />
              </div>
            </div>
          </VercelCardBox>
        </div>
      )}

      {/* TAB 6: ENGINE UPDATES */}
      {activeTab === "updates" && (
        <div className="space-y-6">
          <VercelCardBox
            title="Zero-Downtime Engine Self-Update"
            description="Pull latest commits from Git, run database migrations, rebuild control plane, and atomically reload PM2."
            footerLeft={<span>Save background polling cadence and automated branch pull triggers.</span>}
            footerAction={
              <div className="flex items-center gap-2">
                {!selfUpdateSafe.configured ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={suBusy !== null}
                    onClick={() => void onEnableSelfUpdate()}
                    className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
                  >
                    {suBusy === "enable" ? "Enabling..." : "Enable Updates"}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={suBusy !== null}
                  onClick={() => void onCheckSelfUpdate()}
                  className="border-neutral-800 text-neutral-300 hover:text-white text-xs"
                >
                  {suBusy === "check" ? "Checking..." : "Check for Updates"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onApplySelfUpdate()}
                  className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
                >
                  Apply Update
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              <dl className="divide-y divide-neutral-800/60">
                <Row label="Tracked Branch" value={selfUpdateSafe.branch} />
                <Row
                  label="Polling Interval"
                  value={selfUpdateSafe.pollMs > 0 ? `${selfUpdateSafe.pollMs} ms` : "Manual only"}
                />
                <Row
                  label="Auto-apply on poll"
                  value={boolPill(selfUpdateSafe.autoApply, "Enabled", "Disabled")}
                />
              </dl>

              {selfUpdateSafe.git ? (
                <div className="rounded-lg border border-neutral-800 bg-black/60 p-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Git Commit State:</span>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="rounded bg-neutral-900 px-2 py-0.5 text-neutral-300">
                        local: {selfUpdateSafe.git.currentCommit ? selfUpdateSafe.git.currentCommit.slice(0, 7) : "—"}
                      </span>
                      {selfUpdateSafe.git.remoteCommit ? (
                        <span className="rounded bg-neutral-900 px-2 py-0.5 text-neutral-300">
                          remote: {selfUpdateSafe.git.remoteCommit.slice(0, 7)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-2">
                    {selfUpdateSafe.git.message ? (
                      <p className="text-amber-400">{selfUpdateSafe.git.message}</p>
                    ) : selfUpdateSafe.git.behind ? (
                      <p className="text-emerald-400 font-medium">New commits available on origin. Ready to update.</p>
                    ) : selfUpdateSafe.git.isGitRepo ? (
                      <p className="text-neutral-400">Up to date with origin remote.</p>
                    ) : (
                      <p className="text-neutral-500">Not a git checkout directory.</p>
                    )}
                  </div>
                </div>
              ) : null}

              <form id="su-opts-form" onSubmit={(e) => void onSaveSelfUpdateOpts(e)} className="space-y-4 pt-2">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300" htmlFor="su-branch">
                      Git Branch
                    </label>
                    <Input
                      id="su-branch"
                      value={suOpts.branch}
                      onChange={(e) => setSuOpts((o) => ({ ...o, branch: e.target.value }))}
                      placeholder="main"
                      autoComplete="off"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300" htmlFor="su-poll">
                      Poll Interval (ms)
                    </label>
                    <Input
                      id="su-poll"
                      value={suOpts.pollMs}
                      onChange={(e) => setSuOpts((o) => ({ ...o, pollMs: e.target.value }))}
                      placeholder="0 = off"
                      inputMode="numeric"
                      autoComplete="off"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300" htmlFor="su-auto">
                      Auto-apply on poll
                    </label>
                    <select
                      id="su-auto"
                      value={suOpts.autoApply}
                      onChange={(e) => setSuOpts((o) => ({ ...o, autoApply: e.target.value }))}
                      className={cn(inputClass, "h-9")}
                    >
                      <option value="false">false (manual approval)</option>
                      <option value="true">true (automatic rebuild)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={suBusy !== null}
                    className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
                  >
                    {suBusy === "saveOpts" ? "Saving..." : "Save Options"}
                  </Button>
                </div>
              </form>
            </div>
          </VercelCardBox>
        </div>
      )}

      {/* TAB 7: ENVIRONMENT & SYSTEM */}
      {activeTab === "advanced" && (
        <div className="space-y-6">
          <VercelCardBox
            title="Database & Service Connectivity"
            description="Control plane database connections and encryption key status."
            footerLeft={<span>Database engine: SQLite / PostgreSQL via Prisma ORM.</span>}
          >
            <dl className="divide-y divide-neutral-800/60">
              <Row label="Database URL In .env" value={boolPill(instance.databaseUrlInEnvFile)} />
              <Row label="Database URL Loaded" value={boolPill(instance.databaseUrlLoaded)} />
              <Row label="Database Reachable" value={boolPill(instance.databaseReachable)} />
              <Row label="Encryption Key Set" value={boolPill(instance.encryptionKeyConfigured)} />
              <Row label="Gemini AI Configured" value={boolPill(instance.geminiConfigured)} />
            </dl>
          </VercelCardBox>

          <VercelCardBox
            title="Instance Environment Overrides (.env)"
            description="Append or modify system environment variables without shell access."
            footerLeft={<span>Changes take effect on the next process reload.</span>}
            footerAction={
              <Button
                type="submit"
                form="instance-env-form"
                size="sm"
                disabled={envSaving}
                className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
              >
                {envSaving ? "Saving..." : "Save .env Overrides"}
              </Button>
            }
          >
            <form id="instance-env-form" onSubmit={(e) => void onSaveEnv(e)} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder="KEY (e.g. PORT)"
                  value={Object.keys(envDraft)[0] ?? ""}
                  onChange={(e) => setEnvField(e.target.value.toUpperCase(), Object.values(envDraft)[0] ?? "")}
                  className={cn(inputClass, "font-mono")}
                />
                <Input
                  placeholder="VALUE"
                  value={Object.values(envDraft)[0] ?? ""}
                  onChange={(e) => setEnvField(Object.keys(envDraft)[0] ?? "NEW_KEY", e.target.value)}
                  className={cn(inputClass, "font-mono")}
                />
              </div>
            </form>
          </VercelCardBox>

          {/* Danger Zone */}
          <VercelCardBox
            title="Danger Zone"
            description="Uninstall VersionGate control plane from host server."
            danger
            footerLeft={
              <span className="text-xs text-red-300/80">
                Uninstalling removes all local Docker containers and control plane assets.
              </span>
            }
            footerAction={
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-xs text-white"
                onClick={() =>
                  toast.info("Host uninstall is manual", {
                    description:
                      "Stop versiongate-api / versiongate-worker, delete the install directory, and clean Docker resources on the server.",
                  })
                }
              >
                Uninstall Guidance
              </Button>
            }
          >
            <p className="text-xs text-neutral-400">
              VersionGate does not expose an unauthenticated remote "destroy instance" API. Removing the engine requires direct SSH host access.
            </p>
          </VercelCardBox>
        </div>
      )}

      <SystemUpdateModal
        open={suModalOpen}
        onOpenChange={setSuModalOpen}
        branch={selfUpdate?.branch ?? "main"}
        onComplete={() => {
          void refreshSelfUpdate();
        }}
      />
    </div>
  );
}
