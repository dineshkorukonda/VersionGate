import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VercelCardBox } from "@/components/ui/VercelCardBox";
import { settingsInputClass } from "@/components/settings/settings-styles";
import { boolPill, Row } from "@/components/settings/settings-ui";
import { type InstanceSettings } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface SettingsAdvancedTabProps {
  instance: InstanceSettings;
  envDraft: Record<string, string>;
  envSaving: boolean;
  onEnvFieldChange: (key: string, value: string) => void;
  onSaveEnv: (e: React.FormEvent) => void;
}

export function SettingsAdvancedTab({
  instance,
  envDraft,
  envSaving,
  onEnvFieldChange,
  onSaveEnv,
}: SettingsAdvancedTabProps) {
  return (
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
              onChange={(e) => onEnvFieldChange(e.target.value.toUpperCase(), Object.values(envDraft)[0] ?? "")}
              className={cn(settingsInputClass, "font-mono")}
            />
            <Input
              placeholder="VALUE"
              value={Object.values(envDraft)[0] ?? ""}
              onChange={(e) => onEnvFieldChange(Object.keys(envDraft)[0] ?? "NEW_KEY", e.target.value)}
              className={cn(settingsInputClass, "font-mono")}
            />
          </div>
        </form>
      </VercelCardBox>

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
  );
}
