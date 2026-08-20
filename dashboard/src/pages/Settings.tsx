import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { DonutChart } from "@/components/charts/DonutChart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatPublicDashboardUrl, looksLikeIpv4, normalizePublicBasePath } from "@/lib/public-url";
import { setConfiguredPublicHost } from "@/lib/deployment-display";

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,200px)_1fr] sm:items-baseline sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm text-foreground">{value}</dd>
    </div>
  );
}

function boolBadge(ok: boolean, yes = "Yes", no = "No") {
  return (
    <Badge variant={ok ? "default" : "secondary"} className="font-mono text-xs">
      {ok ? yes : no}
    </Badge>
  );
}

const textareaClass = cn(
  "min-h-[72px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground shadow-none outline-none",
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
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
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Change Administrator Password</CardTitle>
        <CardDescription>
          Update your dashboard account password. Password must be at least 10 characters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="current-pass">
              Current Password
            </label>
            <Input
              id="current-pass"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="new-pass">
              New Password (min 10 characters)
            </label>
            <Input
              id="new-pass"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength={10}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="confirm-pass">
              Confirm New Password
            </label>
            <Input
              id="confirm-pass"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              minLength={10}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" disabled={updating || !newPassword}>
            {updating ? "Updating…" : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
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
      toast.success("API Token generated");
      await loadTokens();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create token");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string, tokenName: string) => {
    if (!confirm(`Revoke API token "${tokenName}"?`)) return;
    try {
      await revokeApiToken(id);
      toast.success("API token revoked");
      await loadTokens();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke token");
    }
  };

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>API Access Tokens</CardTitle>
        <CardDescription>
          Generate Bearer tokens for CI/CD pipelines, GitHub Actions, and external scripts (`Authorization: Bearer vg_live_...`).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {newRawToken ? (
          <Alert className="border-emerald-500/50 bg-emerald-500/10 text-emerald-300">
            <AlertTitle className="font-semibold text-emerald-400">New API Token Generated!</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p className="text-xs text-emerald-200">
                Copy this token now. For security, it will <strong>never be shown again</strong>.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-black/40 px-2.5 py-1.5 font-mono text-xs text-emerald-300 select-all border border-emerald-500/30">
                  {newRawToken}
                </code>
                <Button size="sm" variant="secondary" onClick={() => handleCopy(newRawToken)}>
                  Copy
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setNewRawToken(null)}>
                  Done
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleCreate} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Token name (e.g. GitHub Actions CI)"
            className="flex-1"
          />
          <Button type="submit" disabled={creating || !name.trim()}>
            {creating ? "Generating…" : "Generate Token"}
          </Button>
        </form>

        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : tokens.length === 0 ? (
          <p className="text-xs text-muted-foreground">No API tokens generated yet.</p>
        ) : (
          <div className="rounded-md border border-border divide-y divide-border">
            {tokens.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 text-xs">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{t.name}</p>
                  <p className="font-mono text-muted-foreground">{t.tokenPrefix}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground">
                    {t.lastUsedAt ? `Used ${new Date(t.lastUsedAt).toLocaleDateString()}` : "Never used"}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-destructive hover:bg-destructive/10 border-destructive/40"
                    onClick={() => void handleRevoke(t.id, t.name)}
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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

  if (loading || !instance || !setup) {
    return (
      <div className="w-full max-w-4xl space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 " />
        <Skeleton className="h-64 " />
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
    <div className="w-full max-w-4xl space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your instance configuration, network, security, and update settings."
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 h-10 w-full justify-start rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger value="general" className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">General</TabsTrigger>
          <TabsTrigger value="network" className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">Network</TabsTrigger>
          <TabsTrigger value="security" className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">Security</TabsTrigger>
          <TabsTrigger value="updates" className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">Updates</TabsTrigger>
          <TabsTrigger value="advanced" className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-border bg-card lg:col-span-2">
              <CardHeader>
                <CardTitle>Instance summary</CardTitle>
                <CardDescription>Engine build, runtime mode, and paths used by the control plane.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <dl className="space-y-3">
                  <Row label="Engine version" value={instance.engineVersion} />
                  <Row label="Node environment" value={instance.nodeEnv} />
                  <Row label="API listen port" value={String(instance.apiPort)} />
                  <Row label="Docker network" value={instance.dockerNetwork} />
                  <Row label="Projects root" value={instance.projectsRootPath} />
                  <Row label="Nginx config path" value={instance.nginxConfigPath} />
                  <Row label="Public hostname" value={instance.publicDomain || "—"} />
                  <Row label="Public base path" value={instance.publicBasePath || "/"} />
                  <Row
                    label="Drizzle schema sync"
                    value={
                      (instance.drizzleSchemaSync ?? instance.prismaSchemaSync) === "migrate"
                        ? "migrate (legacy label; runs drizzle-kit push)"
                        : "push (drizzle-kit push)"
                    }
                  />
                  <Row
                    label="In-process worker"
                    value={instance.inProcessWorker ? "enabled in API process" : "disabled (external worker)"}
                  />
                </dl>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/60 ring-1 ring-border/30">
              <CardHeader>
                <CardTitle className="text-base">Health checks</CardTitle>
                <CardDescription>Six binary signals from the API.</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutChart data={checkSummary} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <Card id="dashboard-url" className="border-border/50 bg-card/60 ring-1 ring-border/30 scroll-mt-24">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Dashboard URL &amp; hostname
              </CardTitle>
              <CardDescription>
                Change the <strong className="font-medium text-foreground">domain / hostname</strong> and optional{" "}
                <strong className="font-medium text-foreground">URL path</strong> where users open VersionGate. Configure HTTPS and Nginx reverse proxy below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTitle>DNS</AlertTitle>
                <AlertDescription>
                  Add an <strong>A</strong> record for your hostname to this server&apos;s public IPv4. Propagation must finish before Let&apos;s Encrypt can validate.
                </AlertDescription>
              </Alert>

              <form onSubmit={(e) => void onSavePublicUrlEnv(e)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Hostname (domain)</p>
                    <Input
                      placeholder="versiongate.example.com"
                      value={publicDomainDraft}
                      onChange={(e) => setPublicDomainDraft(e.target.value)}
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                      DNS name or IP shown in the browser. TLS needs a hostname, not only an IP.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">URL path (optional)</p>
                    <Input
                      placeholder="/ or /versiongate"
                      value={publicBasePathDraft}
                      onChange={(e) => setPublicBasePathDraft(e.target.value)}
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                      Path after the hostname if VersionGate is not at the site root.
                    </p>
                  </div>
                </div>
                <div className="space-y-2 sm:max-w-md">
                  <p className="text-sm font-medium text-foreground">Let&apos;s Encrypt contact email</p>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={certbotEmailDraft}
                    onChange={(e) => setCertbotEmailDraft(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                {publicUrlPreview ? (
                  <p className="text-sm text-muted-foreground">
                    Preview:&nbsp;
                    <span className="font-mono text-foreground">{publicUrlPreview}</span>
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" size="sm" disabled={publicUrlSaving}>
                    {publicUrlSaving ? "Saving…" : "Save to .env"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled={nginxApplying} onClick={() => void onApplyNginxSite()}>
                    {nginxApplying ? "Applying…" : "Write nginx config & reload"}
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
                  >
                    {certbotRunning ? "Certbot…" : "Obtain SSL (certbot --nginx)"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <ChangePasswordCard />
          <ApiTokensCard />
        </TabsContent>

        <TabsContent value="updates" className="space-y-6">
          <Card id="application-updates" className="border-border/50 bg-card/60 ring-1 ring-border/30 scroll-mt-24">
            <CardHeader>
              <CardTitle>Application updates</CardTitle>
              <CardDescription>
                Pull new VersionGate commits from git, install dependencies, run migrations, rebuild the dashboard, and reload PM2.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={selfUpdateSafe.configured ? "default" : "secondary"} className="font-mono text-xs">
                  {selfUpdateSafe.configured ? "Self-update enabled" : "Not enabled"}
                </Badge>
                {!selfUpdateSafe.configured ? (
                  <Button type="button" size="sm" disabled={suBusy !== null} onClick={() => void onEnableSelfUpdate()}>
                    {suBusy === "enable" ? "Enabling…" : "Enable in-dashboard updates"}
                  </Button>
                ) : null}
              </div>

              {selfUpdateSafe.configured ? (
                <>
                  <dl className="space-y-3">
                    <Row label="Tracked branch" value={selfUpdateSafe.branch} />
                    <Row label="Poll interval (ms)" value={selfUpdateSafe.pollMs > 0 ? String(selfUpdateSafe.pollMs) : "off"} />
                    <Row label="Auto-apply on poll" value={boolBadge(selfUpdateSafe.autoApply, "Yes", "No")} />
                  </dl>
                  {selfUpdateSafe.git ? (
                    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                      <p className="font-mono text-xs text-muted-foreground">
                        Local{" "}
                        <span className="text-foreground">
                          {selfUpdateSafe.git.currentCommit ? selfUpdateSafe.git.currentCommit.slice(0, 7) : "—"}
                        </span>
                        {selfUpdateSafe.git.remoteCommit ? (
                          <>
                            {" "}
                            · remote <span className="text-foreground">{selfUpdateSafe.git.remoteCommit.slice(0, 7)}</span>
                          </>
                        ) : null}
                      </p>
                      {selfUpdateSafe.git.message ? (
                        <p className="mt-1 text-amber-800">{selfUpdateSafe.git.message}</p>
                      ) : selfUpdateSafe.git.behind ? (
                        <p className="mt-1 text-foreground">Remote is ahead — you can update.</p>
                      ) : selfUpdateSafe.git.isGitRepo ? (
                        <p className="mt-1 text-muted-foreground">Up to date with origin.</p>
                      ) : (
                        <p className="mt-1 text-muted-foreground">Not a git checkout — use your image or package pipeline.</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Run “Check for updates” to compare with origin.</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={suBusy !== null} onClick={() => void onCheckSelfUpdate()}>
                      {suBusy === "check" ? "Checking…" : "Check for updates"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        suBusy !== null || !selfUpdateSafe.git?.isGitRepo || !selfUpdateSafe.git.behind || Boolean(selfUpdateSafe.git.message)
                      }
                      onClick={() => void onApplySelfUpdate()}
                    >
                      {suBusy === "apply" ? "Updating…" : "Update and restart PM2"}
                    </Button>
                  </div>

                  <Separator className="bg-border/50" />

                  <form onSubmit={(e) => void onSaveSelfUpdateOpts(e)} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground" htmlFor="su-branch">
                          SELF_UPDATE_GIT_BRANCH
                        </label>
                        <Input
                          id="su-branch"
                          value={suOpts.branch}
                          onChange={(e) => setSuOpts((o) => ({ ...o, branch: e.target.value }))}
                          placeholder="main"
                          autoComplete="off"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground" htmlFor="su-poll">
                          SELF_UPDATE_POLL_MS
                        </label>
                        <Input
                          id="su-poll"
                          value={suOpts.pollMs}
                          onChange={(e) => setSuOpts((o) => ({ ...o, pollMs: e.target.value }))}
                          placeholder="0 = off"
                          inputMode="numeric"
                          autoComplete="off"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground" htmlFor="su-auto">
                          SELF_UPDATE_AUTO_APPLY
                        </label>
                        <select
                          id="su-auto"
                          value={suOpts.autoApply}
                          onChange={(e) => setSuOpts((o) => ({ ...o, autoApply: e.target.value }))}
                          className="h-8 w-full rounded-lg border border-input bg-muted/40 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <option value="false">false</option>
                          <option value="true">true</option>
                        </select>
                      </div>
                    </div>
                    <Button type="submit" size="sm" variant="secondary" disabled={suBusy !== null}>
                      {suBusy === "saveOpts" ? "Saving…" : "Save self-update options"}
                    </Button>
                  </form>
                </>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card className="border-border/50 bg-card/60 ring-1 ring-border/30">
            <CardHeader>
              <CardTitle>Environment and database</CardTitle>
              <CardDescription>Connection state is checked live. Values such as DATABASE_URL are stored in the server .env file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Setup wizard status</h3>
                <dl className="space-y-3">
                  <Row label="Configured" value={boolBadge(setup.configured)} />
                  <Row label="Database reachable" value={boolBadge(setup.dbConnected)} />
                  <Row label="Process needs restart" value={boolBadge(setup.needsRestart, "Yes — restart API", "No")} />
                </dl>
              </div>

              <Separator className="bg-border/50" />

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Runtime checks</h3>
                <dl className="space-y-3">
                  <Row label="DATABASE_URL in .env file" value={boolBadge(instance.databaseUrlInEnvFile)} />
                  <Row label="DATABASE_URL loaded in process" value={boolBadge(instance.databaseUrlLoaded)} />
                  <Row label="Database responds" value={boolBadge(instance.databaseReachable)} />
                  <Row label="ENCRYPTION_KEY set" value={boolBadge(instance.encryptionKeyConfigured)} />
                  <Row label="GEMINI_API_KEY set" value={boolBadge(instance.geminiConfigured)} />
                </dl>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/60 ring-1 ring-border/30">
            <CardHeader>
              <CardTitle>Update server environment (.env)</CardTitle>
              <CardDescription>
                Merges only the fields you fill in. Existing lines are replaced by key; new keys are appended.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => void onSaveEnv(e)} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="env-database-url">
                    DATABASE_URL
                  </label>
                  <textarea
                    id="env-database-url"
                    value={envDraft.DATABASE_URL ?? ""}
                    onChange={(e) => setEnvField("DATABASE_URL", e.target.value)}
                    className={textareaClass}
                    placeholder="postgresql://…"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="env-direct-database-url">
                    DIRECT_DATABASE_URL <span className="font-normal text-muted-foreground/80">(optional, Neon unpooled)</span>
                  </label>
                  <textarea
                    id="env-direct-database-url"
                    value={envDraft.DIRECT_DATABASE_URL ?? ""}
                    onChange={(e) => setEnvField("DIRECT_DATABASE_URL", e.target.value)}
                    className={textareaClass}
                    placeholder="postgresql://…-direct… or non-pooler host"
                    autoComplete="off"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="env-enc">
                      ENCRYPTION_KEY
                    </label>
                    <Input
                      id="env-enc"
                      type="password"
                      value={envDraft.ENCRYPTION_KEY ?? ""}
                      onChange={(e) => setEnvField("ENCRYPTION_KEY", e.target.value)}
                      placeholder="64-char hex"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="env-gemini">
                      GEMINI_API_KEY
                    </label>
                    <Input
                      id="env-gemini"
                      type="password"
                      value={envDraft.GEMINI_API_KEY ?? ""}
                      onChange={(e) => setEnvField("GEMINI_API_KEY", e.target.value)}
                      placeholder="Optional"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button type="submit" disabled={envSaving}>
                    {envSaving ? "Saving…" : "Save configuration"}
                  </Button>
                  <Button type="button" variant="secondary" disabled={envSaving} onClick={() => setEnvDraft({})}>
                    Discard changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-destructive/40 bg-destructive/5 ">
            <CardHeader>
              <CardTitle className="text-destructive">Danger zone</CardTitle>
              <CardDescription>
                VersionGate does not expose a remote &quot;destroy instance&quot; API. Removing the engine requires SSH access.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() =>
                  toast.info("Host uninstall is manual", {
                    description:
                      "Stop versiongate-api / versiongate-worker, delete the install directory, and clean Docker resources on the server.",
                  })
                }
              >
                Uninstall guidance
              </Button>
            </CardContent>
          </Card>
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
