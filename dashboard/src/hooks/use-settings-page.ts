import { useEffect, useMemo, useState } from "react";
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
import { formatPublicDashboardUrl, looksLikeIpv4, normalizePublicBasePath } from "@/lib/public-url";
import { setConfiguredPublicHost } from "@/lib/deployment-display";
import { toast } from "sonner";

export function useSettingsPage() {
  const [instance, setInstance] = useState<InstanceSettings | null>(null);
  const [setup, setSetup] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
      setLoadError(null);
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
        if (!cancelled) {
          const message = e instanceof Error ? e.message : "Failed to load settings";
          setLoadError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const publicUrlPreview = useMemo(() => {
    return formatPublicDashboardUrl(publicDomainDraft, publicBasePathDraft);
  }, [publicDomainDraft, publicBasePathDraft]);

  const selfUpdateSafe: SelfUpdateSettingsResponse | null = useMemo(() => {
    if (!instance) return null;
    return (
      selfUpdate ?? {
        configured: instance.selfUpdateConfigured,
        branch: instance.selfUpdateGitBranch,
        pollMs: instance.selfUpdatePollMs,
        autoApply: instance.selfUpdateAutoApply,
        git: null,
      }
    );
  }, [instance, selfUpdate]);

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

  const reload = () => {
    setLoading(true);
    setLoadError(null);
    void (async () => {
      try {
        const [i, s] = await Promise.all([getInstanceSettings(), getSetupStatus()]);
        setInstance(i);
        setSetup(s);
        setPublicDomainDraft(i.publicDomain ?? "");
        setPublicBasePathDraft(i.publicBasePath ?? "/");
        setCertbotEmailDraft(i.certbotEmail ?? "");
        setExcludedPortsDraft(i.excludedPorts ?? "80,443,3000,5173,5432,6379,9090");
        setLoadError(null);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load settings";
        setLoadError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    })();
  };

  return {
    instance,
    setup,
    loading,
    loadError,
    reload,
    publicDomainDraft,
    setPublicDomainDraft,
    publicBasePathDraft,
    setPublicBasePathDraft,
    certbotEmailDraft,
    setCertbotEmailDraft,
    publicUrlPreview,
    publicUrlSaving,
    nginxApplying,
    certbotRunning,
    excludedPortsDraft,
    setExcludedPortsDraft,
    savingExcludedPorts,
    selfUpdateSafe,
    suOpts,
    setSuOpts,
    suBusy,
    suModalOpen,
    setSuModalOpen,
    envDraft,
    envSaving,
    setEnvField,
    onEnableSelfUpdate,
    onCheckSelfUpdate,
    onSaveSelfUpdateOpts,
    onSavePublicUrlEnv,
    onApplyNginxSite,
    onRunCertbotSsl,
    onSaveEnv,
    onSaveExcludedPorts,
    refreshSelfUpdate,
  };
}
