import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  attachProjectDomain,
  issueProjectDomainSsl,
  listProjectDomains,
  removeProjectDomain,
  verifyProjectDomainDns,
  type DomainDnsVerificationResult,
  type ProjectDomain,
  type ProjectDomainSslStatus,
} from "@/lib/api";
import { toast } from "sonner";

interface ProjectCustomDomainCardProps {
  projectId: string;
  liveUrl?: string | null;
  onCopy?: (text: string, label: string) => void;
  onUpdated?: () => void;
}

function sslStatusLabel(status: ProjectDomainSslStatus): string {
  switch (status) {
    case "issued":
      return "TLS Active";
    case "http":
      return "HTTP Only";
    case "failed":
      return "TLS Failed";
    default:
      return "TLS Pending";
  }
}

function sslStatusBadgeClass(status: ProjectDomainSslStatus): string {
  switch (status) {
    case "issued":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "failed":
      return "border-red-500/30 bg-red-500/10 text-red-400";
    case "http":
      return "border-sky-500/30 bg-sky-500/10 text-sky-400";
    default:
      return "border-neutral-800 bg-neutral-900 text-neutral-400";
  }
}

export function ProjectCustomDomainCard({
  projectId,
  liveUrl,
  onCopy,
  onUpdated,
}: ProjectCustomDomainCardProps) {
  const [domains, setDomains] = useState<ProjectDomain[]>([]);
  const [expectedIpv4, setExpectedIpv4] = useState<string | null>(null);
  const [, setResolvedPort] = useState<number | null>(null);
  const [hostnameDraft, setHostnameDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sslRunning, setSslRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listProjectDomains(projectId);
      setDomains(data.domains);
      setExpectedIpv4(data.expectedIpv4);
      setResolvedPort(data.resolvedPort);
      setHostnameDraft(data.domains[0]?.hostname ?? "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load custom domains");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const primary = domains[0];
  const sslIssued = primary?.sslStatus === "issued";

  const previewUrl = useMemo(() => {
    if (!primary) return null;
    const proto = sslIssued ? "https" : "http";
    return `${proto}://${primary.hostname}`;
  }, [primary, sslIssued]);

  const onSave = async () => {
    const host = hostnameDraft.trim().toLowerCase();
    if (!host) {
      toast.error("Enter a hostname");
      return;
    }
    if (primary) {
      toast.error("Remove current domain before attaching a new one");
      return;
    }
    setSaving(true);
    try {
      await attachProjectDomain(projectId, host);
      toast.success("Domain attached — configure DNS A record to complete");
      await load();
      onUpdated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not attach domain");
    } finally {
      setSaving(false);
    }
  };

  const onRemove = async () => {
    if (!primary) return;
    setSaving(true);
    try {
      await removeProjectDomain(projectId, primary.id);
      toast.success("Domain removed");
      setHostnameDraft("");
      await load();
      onUpdated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove domain");
    } finally {
      setSaving(false);
    }
  };

  const onSsl = async () => {
    if (!primary) return;
    setSslRunning(true);
    try {
      await issueProjectDomainSsl(projectId, primary.id);
      toast.success("TLS certificate issued successfully");
      await load();
      onUpdated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Certbot failed");
      await load();
    } finally {
      setSslRunning(false);
    }
  };

  const [verifyingDns, setVerifyingDns] = useState(false);
  const [dnsResult, setDnsResult] = useState<DomainDnsVerificationResult | null>(null);

  const onVerifyDns = async () => {
    if (!primary) return;
    setVerifyingDns(true);
    try {
      const res = await verifyProjectDomainDns(projectId, primary.id);
      setDnsResult(res);
      await load();
      if (res.status === "MATCH") {
        toast.success(res.message);
      } else if (res.status === "MISMATCH") {
        toast.warning(res.message);
      } else {
        toast.info(res.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "DNS verification failed");
    } finally {
      setVerifyingDns(false);
    }
  };

  const copyValue = (text: string, label: string) => {
    if (onCopy) {
      onCopy(text, label);
      return;
    }
    void navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Could not copy")
    );
  };

  return (
    <div id="custom-domain" className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Production Domains</h3>
            <p className="mt-1 text-xs text-neutral-400">
              Serve your project on your own custom domain (e.g. <span className="font-mono text-neutral-300">api.example.com</span>).
              VersionGate handles isolated Nginx configs and automatic Let's Encrypt TLS certificates.
            </p>
          </div>
          {primary ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900 px-2.5 py-0.5 text-xs font-medium text-neutral-300">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              1 domain configured
            </span>
          ) : null}
        </div>

        {primary ? (
          <div className="space-y-6">
            {/* Domain Item Card */}
            <div className="rounded-lg border border-neutral-800 bg-black/50 p-5 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold font-mono text-white">{primary.hostname}</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium border",
                        primary.dnsOk
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", primary.dnsOk ? "bg-emerald-500" : "bg-amber-500")} />
                      {primary.dnsOk ? "Valid Configuration" : "Invalid Configuration"}
                    </span>
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border", sslStatusBadgeClass(primary.sslStatus))}>
                      {sslStatusLabel(primary.sslStatus)}
                    </span>
                  </div>
                  {previewUrl ? (
                    <p className="text-xs text-neutral-400">
                      Live URL:{" "}
                      <a href={previewUrl} target="_blank" rel="noreferrer" className="font-mono text-emerald-400 hover:underline">
                        {previewUrl} ↗
                      </a>
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {previewUrl || liveUrl ? (
                    <a
                      href={previewUrl ?? liveUrl ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonVariants({
                        size: "sm",
                        className: "bg-white text-black font-semibold hover:bg-neutral-200 text-xs h-8",
                      })}
                    >
                      Visit
                    </a>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={sslRunning || !primary.dnsOk || primary.sslStatus === "issued"}
                    title={
                      primary.sslStatus === "issued"
                        ? "TLS certificate already issued"
                        : !primary.dnsOk
                          ? "Verify DNS before requesting TLS"
                          : undefined
                    }
                    onClick={() => void onSsl()}
                    className="border-neutral-800 text-neutral-300 hover:text-white text-xs h-8"
                  >
                    {sslRunning ? "Requesting TLS..." : primary.sslStatus === "issued" ? "TLS Issued" : "Obtain SSL"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={saving}
                    onClick={() => void onRemove()}
                    className="border-red-900/40 text-red-400 hover:bg-red-950/20 text-xs h-8"
                  >
                    Remove
                  </Button>
                </div>
              </div>

              {/* DNS Table */}
              <div className="rounded-lg border border-neutral-800/80 bg-[#050505] p-4 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs font-semibold text-neutral-300">DNS Configuration Record</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={verifyingDns}
                    onClick={() => void onVerifyDns()}
                    className="h-7 text-xs border-neutral-800 text-neutral-300 hover:text-white"
                  >
                    {verifyingDns ? "Verifying..." : "Verify DNS"}
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-neutral-800 text-[11px] text-neutral-500">
                        <th className="pb-2 font-medium">TYPE</th>
                        <th className="pb-2 font-medium">NAME</th>
                        <th className="pb-2 font-medium">VALUE</th>
                        <th className="pb-2 font-medium">RESOLVED IP</th>
                        <th className="pb-2 font-medium text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/40 text-neutral-300">
                      <tr>
                        <td className="py-2.5 font-bold text-white">A</td>
                        <td className="py-2.5">
                          <button
                            type="button"
                            className="cursor-pointer text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600"
                            aria-label={`Copy hostname ${primary.hostname}`}
                            onClick={() => copyValue(primary.hostname, "Hostname")}
                          >
                            {primary.hostname}
                          </button>
                        </td>
                        <td className="py-2.5">
                          {expectedIpv4 ? (
                            <button
                              type="button"
                              className="cursor-pointer font-semibold text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600"
                              aria-label={`Copy target IPv4 ${expectedIpv4}`}
                              onClick={() => copyValue(expectedIpv4, "Target IPv4")}
                            >
                              {expectedIpv4}
                            </button>
                          ) : (
                            <span className="text-neutral-500">Not configured</span>
                          )}
                        </td>
                        <td className="py-2.5 text-neutral-400">
                          {primary.dnsA.length > 0 ? primary.dnsA.join(", ") : "None resolved"}
                        </td>
                        <td className="py-2.5 text-right">
                          {primary.dnsOk ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                              <span className="size-1.5 rounded-full bg-amber-500" />
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {dnsResult ? (
                  <p className="border-t border-neutral-800 pt-2 text-[11px] font-mono text-neutral-400">
                    DNS Status: {dnsResult.message}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <form
            className="space-y-4 max-w-lg"
            onSubmit={(e) => {
              e.preventDefault();
              void onSave();
            }}
          >
            <div className="space-y-1.5">
              <label htmlFor="project-custom-hostname" className="text-xs font-medium text-neutral-300">
                Custom Domain Name
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="project-custom-hostname"
                  className="h-9 font-mono text-xs bg-black border-neutral-800 text-white focus-visible:border-neutral-500"
                  placeholder="app.example.com"
                  value={hostnameDraft}
                  onChange={(e) => setHostnameDraft(e.target.value)}
                  disabled={loading || saving}
                  autoComplete="off"
                  spellCheck={false}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving || loading || !hostnameDraft.trim()}
                  className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs shrink-0 h-9"
                >
                  {saving ? "Attaching..." : "Add Domain"}
                </Button>
              </div>
              <p className="text-[11px] text-neutral-500">
                Enter your apex domain or subdomain. An A record pointing to this host's IPv4 is required.
              </p>
            </div>
          </form>
        )}
      </div>

      <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
        SSL certificates automatically renew before expiration using Certbot.
      </div>
    </div>
  );
}
