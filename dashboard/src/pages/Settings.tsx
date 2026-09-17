import { type ReactNode, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ApiError,
  applyNginxSite,
  changePassword,
  checkSelfUpdateFromSettings,
  createApiToken,
  enableSelfUpdateFromSettings,
  getApiTokens,
  getInstanceSettings,
  getSelfUpdateSettings,
  getSetupStatus,
  patchInstanceEnv,
  requestCertbotSsl,
  revokeApiToken,
  type ApiTokenItem,
  type InstanceSettings,
  type SelfUpdateSettingsResponse,
  type SetupStatus,
} from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SystemUpdateModal } from "@/components/modals/SystemUpdateModal";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { DonutChart } from "@/components/charts/DonutChart";
import { formatPublicDashboardUrl, looksLikeIpv4, normalizePublicBasePath } from "@/lib/public-url";
import { setConfiguredPublicHost } from "@/lib/deployment-display";

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

const textareaClass = cn(
  "min-h-[80px] w-full rounded-md border border-neutral-800 bg-black px-3 py-2 text-xs font-mono text-neutral-200 placeholder:text-neutral-600 outline-none transition-colors",
  "focus-visible:border-neutral-500 focus-visible:ring-1 focus-visible:ring-neutral-500",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

const inputClass = cn(
  "h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-neutral-200 placeholder:text-neutral-600 outline-none transition-colors",
  "focus-visible:border-neutral-500 focus-visible:ring-1 focus-visible:ring-neutral-500",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 10) {
      toast.error("New password must be at least 10 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setUpdating(true);
    try {
      const res = await changePassword({ currentPassword, newPassword });
      toast.success(res.message || "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white">Administrator Password</h3>
          <p className="mt-1 text-xs text-neutral-400">
            Update your dashboard authentication password. Passwords must be at least 10 characters.
          </p>
        </div>

        <form id="change-password-form" onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300" htmlFor="current-pass">
              Current Password
            </label>
            <Input
              id="current-pass"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300" htmlFor="new-pass">
              New Password
            </label>
            <Input
              id="new-pass"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 10 characters"
              required
              minLength={10}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300" htmlFor="confirm-pass">
              Confirm New Password
            </label>
            <Input
              id="confirm-pass"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
              minLength={10}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
        </form>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
        <span>Use a secure password with a mix of characters to safeguard control plane access.</span>
        <Button
          type="submit"
          form="change-password-form"
          size="sm"
          disabled={updating || !newPassword}
          className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs shrink-0"
        >
          {updating ? "Updating..." : "Save Password"}
        </Button>
      </div>
    </div>
  );
}

function ApiTokensCard() {
  const [tokens, setTokens] = useState<ApiTokenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newRawToken, setNewRawToken] = useState<string | null>(null);

  const loadTokens = async () => {
    try {
      const res = await getApiTokens();
      setTokens(res.tokens);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTokens();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await createApiToken(name.trim());
      setNewRawToken(res.token.token);
      setName("");
      toast.success("API Token generated successfully");
      await loadTokens();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create token");
    } finally {
      setCreating(false);
    }
  };

  const [revokeTarget, setRevokeTarget] = useState<ApiTokenItem | null>(null);
  const [revoking, setRevoking] = useState(false);

  const executeRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await revokeApiToken(revokeTarget.id);
      toast.success("API token revoked");
      setRevokeTarget(null);
      await loadTokens();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke token");
    } finally {
      setRevoking(false);
    }
  };

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white">API Access Tokens</h3>
          <p className="mt-1 text-xs text-neutral-400">
            Generate Bearer tokens for CI/CD pipelines, GitHub Actions, and external automation (`Authorization: Bearer vg_live_...`).
          </p>
        </div>

        {newRawToken ? (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-300">
            <p className="text-xs font-semibold text-emerald-400">New Token Generated</p>
            <p className="mt-1 text-xs text-emerald-200/90">
              Copy this token now. For security, it will not be displayed again.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="flex-1 rounded border border-emerald-500/30 bg-black/60 px-3 py-1.5 font-mono text-xs text-emerald-300 select-all">
                {newRawToken}
              </code>
              <Button size="sm" variant="secondary" className="text-xs h-8" onClick={() => handleCopy(newRawToken)}>
                Copy
              </Button>
              <Button size="sm" variant="ghost" className="text-xs h-8 text-neutral-300 hover:text-white" onClick={() => setNewRawToken(null)}>
                Done
              </Button>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row items-center gap-2 max-w-lg">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Token name (e.g. GitHub Actions CI)"
            className={inputClass}
          />
          <Button
            type="submit"
            size="sm"
            disabled={creating || !name.trim()}
            className="w-full sm:w-auto bg-white text-black font-semibold hover:bg-neutral-200 text-xs shrink-0 h-9"
          >
            {creating ? "Generating..." : "Generate"}
          </Button>
        </form>

        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : tokens.length === 0 ? (
          <div className="rounded-lg border border-neutral-800/80 bg-black/40 p-4 text-center text-xs text-neutral-500">
            No API tokens generated yet.
          </div>
        ) : (
          <div className="rounded-lg border border-neutral-800 divide-y divide-neutral-800/80 overflow-hidden bg-black/40">
            {tokens.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 text-xs">
                <div className="space-y-0.5">
                  <p className="font-medium text-white">{t.name}</p>
                  <p className="font-mono text-[11px] text-neutral-500">{t.tokenPrefix}••••••••</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-neutral-500">
                    {t.lastUsedAt ? `Used ${new Date(t.lastUsedAt).toLocaleDateString()}` : "Never used"}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-red-900/40 text-red-400 hover:bg-red-950/20"
                    onClick={() => setRevokeTarget(t)}
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <ConfirmDialog
          open={Boolean(revokeTarget)}
          onOpenChange={(open) => {
            if (!open) setRevokeTarget(null);
          }}
          title={`Revoke API token "${revokeTarget?.name}"?`}
          description={`This will permanently revoke ${revokeTarget?.tokenPrefix}... Any external CI/CD pipelines or scripts using this token will fail immediately with 401 Unauthorized.`}
          confirmLabel="Revoke Token"
          variant="destructive"
          busy={revoking}
          onConfirm={executeRevoke}
        />
      </div>

      <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
        Tokens grant administrative deployment rights on this VersionGate instance.
      </div>
    </div>
  );
}

export function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [instance, setInstance] = useState<InstanceSettings | null>(null);
  const [setup, setSetup] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [envDraft, setEnvDraft] = useState<Record<string, string>>({});
  const [envSaving, setEnvSaving] = useState(false);
  const [selfUpdate, setSelfUpdate] = useState<SelfUpdateSettingsResponse | null>(null);
  const [suOpts, setSuOpts] = useState({ branch: "", pollMs: "", autoApply: "false" });
  const [suBusy, setSuBusy] = useState<"enable" | "check" | "apply" | "saveOpts" | null>(null);
  const [publicDomainDraft, setPublicDomainDraft] = useState("");
  const [publicBasePathDraft, setPublicBasePathDraft] = useState("/");
  const [certbotEmailDraft, setCertbotEmailDraft] = useState("");
  const [excludedPortsDraft, setExcludedPortsDraft] = useState("");
  const [savingExcludedPorts, setSavingExcludedPorts] = useState(false);
  const [publicUrlSaving, setPublicUrlSaving] = useState(false);
  const [nginxApplying, setNginxApplying] = useState(false);
  const [certbotRunning, setCertbotRunning] = useState(false);
  const [suModalOpen, setSuModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const [i, s] = await Promise.all([getInstanceSettings(), getSetupStatus()]);
        if (cancelled) return;
        setInstance(i);
        setSetup(s);
        setConfiguredPublicHost(i.publicDomain);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const scrollToHash = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (id === "dashboard-url") {
        setActiveTab("network");
      } else if (id === "application-updates") {
        setActiveTab("updates");
      }
      if (id) {
        window.requestAnimationFrame(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    };
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
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
      const i = await getInstanceSettings();
      setInstance(i);
      const fallback: SelfUpdateSettingsResponse = {
        configured: i.selfUpdateConfigured,
        branch: i.selfUpdateGitBranch,
        pollMs: i.selfUpdatePollMs,
        autoApply: i.selfUpdateAutoApply,
        git: null,
      };
      setSelfUpdate(fallback);
      setSuOpts({
        branch: fallback.branch,
        pollMs: fallback.pollMs > 0 ? String(fallback.pollMs) : "",
        autoApply: fallback.autoApply ? "true" : "false",
      });
      setPublicDomainDraft(i.publicDomain ?? "");
      setPublicBasePathDraft(i.publicBasePath ?? "/");
      setCertbotEmailDraft(i.certbotEmail ?? "");
      return;
    }
    const i = await getInstanceSettings();
    setInstance(i);
    setPublicDomainDraft(i.publicDomain ?? "");
    setPublicBasePathDraft(i.publicBasePath ?? "/");
    setCertbotEmailDraft(i.certbotEmail ?? "");
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
      const g = await checkSelfUpdateFromSettings();
      setSelfUpdate((prev) => (prev ? { ...prev, git: g } : prev));
      if (g.message) toast.warning(g.message);
      else if (g.behind) toast.info("A newer revision is available on the remote.");
      else toast.success("Already up to date.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Check failed");
    } finally {
      setSuBusy(null);
    }
  };

  const onApplySelfUpdate = async () => {
    setSuModalOpen(true);
  };

  const onSaveSelfUpdateOpts = async (e: React.FormEvent) => {
    e.preventDefault();
    const env: Record<string, string> = {};
    const b = suOpts.branch.trim();
    const p = suOpts.pollMs.trim();
    if (b) env.SELF_UPDATE_GIT_BRANCH = b;
    if (p !== "") env.SELF_UPDATE_POLL_MS = p;
    env.SELF_UPDATE_AUTO_APPLY = suOpts.autoApply;
    if (Object.keys(env).length === 0) {
      toast.error("Set at least one option.");
      return;
    }
    setSuBusy("saveOpts");
    try {
      const r = await patchInstanceEnv(env);
      toast.success(r.message);
      await refreshSelfUpdate();
      if (suOpts.autoApply === "true") {
        const ms = p === "" ? 0 : Number.parseInt(p, 10);
        if (!Number.isFinite(ms) || ms <= 0) {
          toast.info("Polling is off", {
            description:
              "SELF_UPDATE_AUTO_APPLY only runs after a poll finds commits behind. Set SELF_UPDATE_POLL_MS (e.g. 300000) to enable automatic checks.",
          });
        }
      }
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
      toast.error("Enter at least one value to write.");
      return;
    }
    setEnvSaving(true);
    try {
      const r = await patchInstanceEnv(env);
      toast.success(r.message);
      setEnvDraft({});
      const [i, s] = await Promise.all([getInstanceSettings(), getSetupStatus()]);
      setInstance(i);
      setSetup(s);
      setPublicDomainDraft(i.publicDomain ?? "");
      setPublicBasePathDraft(i.publicBasePath ?? "/");
      setCertbotEmailDraft(i.certbotEmail ?? "");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update .env");
    } finally {
      setEnvSaving(false);
    }
  };

  const excludedPortsCount = useMemo(() => {
    if (!excludedPortsDraft.trim()) return 0;
    let count = 0;
    const tokens = excludedPortsDraft.split(/[,;\s]+/).map((t) => t.trim()).filter(Boolean);
    for (const token of tokens) {
      if (token.includes("-")) {
        const [start, end] = token.split("-").map((n) => parseInt(n, 10));
        if (Number.isFinite(start) && Number.isFinite(end)) {
          count += Math.max(0, Math.abs(end - start) + 1);
        }
      } else if (/^\d+$/.test(token)) {
        count += 1;
      }
    }
    return count;
  }, [excludedPortsDraft]);

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
      <PageHeader
        title="Settings"
        description="Manage control plane configurations, networking, security credentials, and updates."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="flex h-auto w-full justify-start gap-6 rounded-none border-b border-neutral-800 bg-transparent p-0">
          <TabsTrigger
            value="general"
            className="rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-2 text-sm font-medium text-neutral-400 transition-colors data-[state=active]:border-white data-[state=active]:text-white hover:text-neutral-200"
          >
            General
          </TabsTrigger>
          <TabsTrigger
            value="network"
            className="rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-2 text-sm font-medium text-neutral-400 transition-colors data-[state=active]:border-white data-[state=active]:text-white hover:text-neutral-200"
          >
            Domains & Network
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-2 text-sm font-medium text-neutral-400 transition-colors data-[state=active]:border-white data-[state=active]:text-white hover:text-neutral-200"
          >
            Security & Tokens
          </TabsTrigger>
          <TabsTrigger
            value="updates"
            className="rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-2 text-sm font-medium text-neutral-400 transition-colors data-[state=active]:border-white data-[state=active]:text-white hover:text-neutral-200"
          >
            Updates
          </TabsTrigger>
          <TabsTrigger
            value="advanced"
            className="rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-2 text-sm font-medium text-neutral-400 transition-colors data-[state=active]:border-white data-[state=active]:text-white hover:text-neutral-200"
          >
            Environment & System
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: GENERAL */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a] lg:col-span-2">
              <div className="p-6">
                <h3 className="text-base font-semibold text-white">Instance Details</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  Engine runtime build, networking parameters, and control plane paths.
                </p>

                <dl className="mt-6 divide-y divide-neutral-800/60">
                  <Row label="Engine Version" value={`v${instance.engineVersion}`} />
                  <Row label="Node Environment" value={instance.nodeEnv} />
                  <Row label="API Listen Port" value={String(instance.apiPort)} />
                  <Row label="Docker Network" value={instance.dockerNetwork} />
                  <Row label="Projects Root" value={instance.projectsRootPath} />
                  <Row label="Nginx Config Path" value={instance.nginxConfigPath} />
                  <Row label="Public Hostname" value={instance.publicDomain || "—"} />
                  <Row label="Public Base Path" value={instance.publicBasePath || "/"} />
                  <Row
                    label="Schema Sync Mode"
                    value={
                      (instance.drizzleSchemaSync ?? instance.prismaSchemaSync) === "migrate"
                        ? "drizzle-kit push (migrate mode)"
                        : "drizzle-kit push"
                    }
                  />
                  <Row
                    label="Worker Mode"
                    value={instance.inProcessWorker ? "In-process Worker (API thread)" : "External Worker (Separate process)"}
                  />
                </dl>
              </div>

              <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
                Instance ID: {instance.projectsRootPath ? "Production Local" : "Self-Hosted Control Plane"}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
              <div className="p-6">
                <h3 className="text-base font-semibold text-white">System Signals</h3>
                <p className="mt-1 text-xs text-neutral-400">Control plane runtime health.</p>

                <div className="mt-6 flex flex-col items-center justify-center">
                  <DonutChart data={checkSummary} />
                </div>
              </div>
              <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
                Live health telemetry
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: DOMAINS & NETWORK */}
        <TabsContent value="network" className="space-y-6">
          <div id="dashboard-url" className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a] scroll-mt-24">
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white">Dashboard URL & Public Hostname</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  Configure the primary domain and path prefix used to access VersionGate in your browser.
                </p>
              </div>

              <form id="public-url-form" onSubmit={(e) => void onSavePublicUrlEnv(e)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300">
                      Hostname (domain or IP)
                    </label>
                    <Input
                      placeholder="e.g. versiongate.example.com"
                      value={publicDomainDraft}
                      onChange={(e) => setPublicDomainDraft(e.target.value)}
                      autoComplete="off"
                      className={inputClass}
                    />
                    <p className="text-[11px] text-neutral-500">
                      DNS A record must point to this server's IPv4 before requesting SSL.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300">
                      URL Path (optional)
                    </label>
                    <Input
                      placeholder="/ or /versiongate"
                      value={publicBasePathDraft}
                      onChange={(e) => setPublicBasePathDraft(e.target.value)}
                      autoComplete="off"
                      className={inputClass}
                    />
                    <p className="text-[11px] text-neutral-500">
                      Path prefix when running behind a shared reverse proxy subpath.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 max-w-md">
                  <label className="text-xs font-medium text-neutral-300">
                    Let's Encrypt Contact Email
                  </label>
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
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
              <span>Writes configuration directly to server .env and manages Nginx.</span>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="submit"
                  form="public-url-form"
                  size="sm"
                  disabled={publicUrlSaving}
                  className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
                >
                  {publicUrlSaving ? "Saving..." : "Save to .env"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={nginxApplying}
                  onClick={() => void onApplyNginxSite()}
                  className="border-neutral-800 text-neutral-300 hover:text-white text-xs"
                >
                  {nginxApplying ? "Applying..." : "Reload Nginx"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    certbotRunning ||
                    looksLikeIpv4(publicDomainDraft) ||
                    !publicDomainDraft.trim() ||
                    !certbotEmailDraft.trim()
                  }
                  onClick={() => void onRunCertbotSsl()}
                  className="border-neutral-800 text-neutral-300 hover:text-white text-xs"
                >
                  {certbotRunning ? "Obtaining..." : "Obtain SSL (Certbot)"}
                </Button>
              </div>
            </div>
          </div>

          {/* Reserved Host Ports Card */}
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white">Reserved Host Ports</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  Prevent VersionGate from assigning ports already used by other host processes, system databases, or Docker containers.
                </p>
              </div>

              <form id="excluded-ports-form" onSubmit={(e) => void onSaveExcludedPorts(e)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    Excluded Ports & Ranges (comma-separated)
                  </label>
                  <Input
                    placeholder="e.g. 80, 443, 3000, 5173, 5432, 6379, 8000-8080, 9090"
                    value={excludedPortsDraft}
                    onChange={(e) => setExcludedPortsDraft(e.target.value)}
                    className={cn(inputClass, "font-mono")}
                    disabled={savingExcludedPorts}
                  />
                  <p className="text-[11px] text-neutral-500">
                    Supports individual ports (<code className="font-mono text-neutral-300">3000</code>) and inclusive ranges (<code className="font-mono text-neutral-300">8000-8050</code>).
                  </p>
                </div>
              </form>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
              <span>Active Protection: <strong className="text-white">{excludedPortsCount} ports</strong> excluded from allocation.</span>
              <Button
                type="submit"
                form="excluded-ports-form"
                size="sm"
                disabled={savingExcludedPorts || excludedPortsDraft === (instance.excludedPorts ?? "80,443,3000,5173,5432,6379,9090")}
                className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
              >
                {savingExcludedPorts ? "Saving..." : "Save Reserved Ports"}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: SECURITY */}
        <TabsContent value="security" className="space-y-6">
          <ChangePasswordCard />
          <ApiTokensCard />
        </TabsContent>

        {/* TAB 4: UPDATES */}
        <TabsContent value="updates" className="space-y-6">
          <div id="application-updates" className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a] scroll-mt-24">
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-white">Application Updates</h3>
                  <p className="mt-1 text-xs text-neutral-400">
                    Pull latest commits from Git, run migrations, rebuild control plane, and reload PM2 automatically.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border",
                      selfUpdateSafe.configured
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-neutral-700 bg-neutral-900 text-neutral-400"
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full shrink-0", selfUpdateSafe.configured ? "bg-emerald-500" : "bg-neutral-500")} />
                    {selfUpdateSafe.configured ? "Self-update Active" : "Disabled"}
                  </span>
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
                </div>
              </div>

              {selfUpdateSafe.configured ? (
                <>
                  <dl className="divide-y divide-neutral-800/60">
                    <Row label="Tracked Branch" value={selfUpdateSafe.branch} />
                    <Row label="Polling Interval" value={selfUpdateSafe.pollMs > 0 ? `${selfUpdateSafe.pollMs} ms` : "Manual only"} />
                    <Row label="Auto-apply on poll" value={boolPill(selfUpdateSafe.autoApply, "Enabled", "Disabled")} />
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

                  <div className="flex flex-wrap items-center gap-2 pt-2">
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
                      disabled={
                        suBusy !== null || !selfUpdateSafe.git?.isGitRepo || !selfUpdateSafe.git.behind || Boolean(selfUpdateSafe.git.message)
                      }
                      onClick={() => void onApplySelfUpdate()}
                      className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
                    >
                      {suBusy === "apply" ? "Updating..." : "Update & Reload PM2"}
                    </Button>
                  </div>

                  <form id="su-opts-form" onSubmit={(e) => void onSaveSelfUpdateOpts(e)} className="mt-4 space-y-4 pt-4 border-t border-neutral-800">
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
                  </form>
                </>
              ) : null}
            </div>

            {selfUpdateSafe.configured ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
                <span>Save background polling cadence and automated branch pull triggers.</span>
                <Button
                  type="submit"
                  form="su-opts-form"
                  size="sm"
                  disabled={suBusy !== null}
                  className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
                >
                  {suBusy === "saveOpts" ? "Saving..." : "Save Options"}
                </Button>
              </div>
            ) : null}
          </div>
        </TabsContent>

        {/* TAB 5: ADVANCED & ENVIRONMENT */}
        <TabsContent value="advanced" className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white">Database & Service Connectivity</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  Real-time connectivity verification between the VersionGate control plane, database, and encryption keys.
                </p>
              </div>

              <dl className="divide-y divide-neutral-800/60">
                <Row label="Setup Wizard Complete" value={boolPill(setup.configured)} />
                <Row label="Database Engine Reachable" value={boolPill(setup.dbConnected)} />
                <Row label="Pending Restart" value={boolPill(!setup.needsRestart, "Clean State", "Restart Pending")} />
                <Row label="DATABASE_URL loaded in process" value={boolPill(instance.databaseUrlLoaded)} />
                <Row label="Database responds to queries" value={boolPill(instance.databaseReachable)} />
                <Row label="ENCRYPTION_KEY Configured" value={boolPill(instance.encryptionKeyConfigured)} />
                <Row label="GEMINI_API_KEY Configured" value={boolPill(instance.geminiConfigured, "Configured", "Optional / Unset")} />
              </dl>
            </div>
            <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
              Connection health checked on request
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white">Server Environment Configuration (.env)</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  Update server-level environment variables. Existing lines are replaced by key; new keys are appended.
                </p>
              </div>

              <form id="server-env-form" onSubmit={(e) => void onSaveEnv(e)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300" htmlFor="env-database-url">
                    DATABASE_URL
                  </label>
                  <textarea
                    id="env-database-url"
                    value={envDraft.DATABASE_URL ?? ""}
                    onChange={(e) => setEnvField("DATABASE_URL", e.target.value)}
                    className={textareaClass}
                    placeholder="postgresql://..."
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300" htmlFor="env-direct-database-url">
                    DIRECT_DATABASE_URL <span className="text-neutral-500">(optional, Neon unpooled)</span>
                  </label>
                  <textarea
                    id="env-direct-database-url"
                    value={envDraft.DIRECT_DATABASE_URL ?? ""}
                    onChange={(e) => setEnvField("DIRECT_DATABASE_URL", e.target.value)}
                    className={textareaClass}
                    placeholder="postgresql://...-direct... or non-pooler host"
                    autoComplete="off"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300" htmlFor="env-enc">
                      ENCRYPTION_KEY
                    </label>
                    <Input
                      id="env-enc"
                      type="password"
                      value={envDraft.ENCRYPTION_KEY ?? ""}
                      onChange={(e) => setEnvField("ENCRYPTION_KEY", e.target.value)}
                      placeholder="64-character hex key"
                      autoComplete="new-password"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300" htmlFor="env-gemini">
                      GEMINI_API_KEY
                    </label>
                    <Input
                      id="env-gemini"
                      type="password"
                      value={envDraft.GEMINI_API_KEY ?? ""}
                      onChange={(e) => setEnvField("GEMINI_API_KEY", e.target.value)}
                      placeholder="Optional"
                      autoComplete="new-password"
                      className={inputClass}
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
              <span>Applies to the server environment file. A service reload might be required.</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={envSaving || Object.keys(envDraft).length === 0}
                  onClick={() => setEnvDraft({})}
                  className="border-neutral-800 text-neutral-400 hover:text-white text-xs"
                >
                  Discard
                </Button>
                <Button
                  type="submit"
                  form="server-env-form"
                  size="sm"
                  disabled={envSaving || Object.keys(envDraft).length === 0}
                  className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
                >
                  {envSaving ? "Saving..." : "Save Configuration"}
                </Button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="overflow-hidden rounded-xl border border-red-900/40 bg-black">
            <div className="p-6 space-y-2">
              <h3 className="text-base font-semibold text-red-400">Danger Zone</h3>
              <p className="text-xs text-neutral-400">
                VersionGate does not expose an unauthenticated remote "destroy instance" API. Removing the engine requires direct SSH host access.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-red-950/60 bg-red-950/10 px-6 py-3">
              <span className="text-xs text-red-300/80">Uninstalling removes all local Docker containers and control plane assets.</span>
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
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
