import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VercelCardBox } from "@/components/ui/VercelCardBox";
import { settingsInputClass } from "@/components/settings/settings-styles";

export interface SettingsNetworkTabProps {
  publicDomainDraft: string;
  publicBasePathDraft: string;
  certbotEmailDraft: string;
  publicUrlPreview: string | null;
  publicUrlSaving: boolean;
  nginxApplying: boolean;
  certbotRunning: boolean;
  onPublicDomainChange: (value: string) => void;
  onPublicBasePathChange: (value: string) => void;
  onCertbotEmailChange: (value: string) => void;
  onSavePublicUrlEnv: (e: React.FormEvent) => void;
  onApplyNginxSite: () => void;
  onRunCertbotSsl: () => void;
}

export function SettingsNetworkTab({
  publicDomainDraft,
  publicBasePathDraft,
  certbotEmailDraft,
  publicUrlPreview,
  publicUrlSaving,
  nginxApplying,
  certbotRunning,
  onPublicDomainChange,
  onPublicBasePathChange,
  onCertbotEmailChange,
  onSavePublicUrlEnv,
  onApplyNginxSite,
  onRunCertbotSsl,
}: SettingsNetworkTabProps) {
  return (
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
                onChange={(e) => onPublicDomainChange(e.target.value)}
                autoComplete="off"
                className={settingsInputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">URL Path (optional)</label>
              <Input
                placeholder="/ or /versiongate"
                value={publicBasePathDraft}
                onChange={(e) => onPublicBasePathChange(e.target.value)}
                autoComplete="off"
                className={settingsInputClass}
              />
            </div>
          </div>

          <div className="space-y-1.5 max-w-md">
            <label className="text-xs font-medium text-neutral-300">Let's Encrypt Contact Email</label>
            <Input
              type="email"
              placeholder="admin@example.com"
              value={certbotEmailDraft}
              onChange={(e) => onCertbotEmailChange(e.target.value)}
              autoComplete="email"
              className={settingsInputClass}
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
  );
}
