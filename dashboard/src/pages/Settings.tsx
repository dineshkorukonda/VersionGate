import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsAdvancedTab } from "@/components/settings/tabs/SettingsAdvancedTab";
import { SettingsBuildTab } from "@/components/settings/tabs/SettingsBuildTab";
import { SettingsGeneralTab } from "@/components/settings/tabs/SettingsGeneralTab";
import { SettingsNetworkTab } from "@/components/settings/tabs/SettingsNetworkTab";
import { SettingsSecurityTab } from "@/components/settings/tabs/SettingsSecurityTab";
import { SettingsUpdatesTab } from "@/components/settings/tabs/SettingsUpdatesTab";
import { SettingsWebhooksTab } from "@/components/settings/tabs/SettingsWebhooksTab";
import { SystemUpdateModal } from "@/components/modals/SystemUpdateModal";
import { useSettingsPage } from "@/hooks/use-settings-page";

export function Settings() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "general";
  const settings = useSettingsPage();

  if (settings.loadError && !settings.instance) {
    return (
      <div className="flex w-full max-w-4xl flex-col items-center justify-center gap-4 py-16 text-center" role="alert">
        <p className="text-sm text-neutral-300">{settings.loadError}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={settings.loading}
          onClick={settings.reload}
          className="border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white text-xs"
        >
          {settings.loading ? "Retrying..." : "Retry"}
        </Button>
      </div>
    );
  }

  if (settings.loading || !settings.instance || !settings.setup || !settings.selfUpdateSafe) {
    return (
      <div className="w-full max-w-4xl space-y-6" role="status" aria-live="polite">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-6 font-sans">
      {activeTab === "general" && <SettingsGeneralTab instance={settings.instance} />}

      {activeTab === "build" && (
        <SettingsBuildTab
          excludedPortsDraft={settings.excludedPortsDraft}
          onExcludedPortsChange={settings.setExcludedPortsDraft}
          savingExcludedPorts={settings.savingExcludedPorts}
          onSaveExcludedPorts={settings.onSaveExcludedPorts}
        />
      )}

      {activeTab === "network" && (
        <SettingsNetworkTab
          publicDomainDraft={settings.publicDomainDraft}
          publicBasePathDraft={settings.publicBasePathDraft}
          certbotEmailDraft={settings.certbotEmailDraft}
          publicUrlPreview={settings.publicUrlPreview}
          publicUrlSaving={settings.publicUrlSaving}
          nginxApplying={settings.nginxApplying}
          certbotRunning={settings.certbotRunning}
          onPublicDomainChange={settings.setPublicDomainDraft}
          onPublicBasePathChange={settings.setPublicBasePathDraft}
          onCertbotEmailChange={settings.setCertbotEmailDraft}
          onSavePublicUrlEnv={settings.onSavePublicUrlEnv}
          onApplyNginxSite={() => void settings.onApplyNginxSite()}
          onRunCertbotSsl={() => void settings.onRunCertbotSsl()}
        />
      )}

      {activeTab === "security" && <SettingsSecurityTab />}

      {activeTab === "webhooks" && <SettingsWebhooksTab />}

      {activeTab === "updates" && (
        <SettingsUpdatesTab
          selfUpdate={settings.selfUpdateSafe}
          suOpts={settings.suOpts}
          suBusy={settings.suBusy}
          onSuOptsChange={settings.setSuOpts}
          onEnableSelfUpdate={() => void settings.onEnableSelfUpdate()}
          onCheckSelfUpdate={() => void settings.onCheckSelfUpdate()}
          onApplySelfUpdate={() => settings.setSuModalOpen(true)}
          onSaveSelfUpdateOpts={settings.onSaveSelfUpdateOpts}
        />
      )}

      {activeTab === "advanced" && (
        <SettingsAdvancedTab
          instance={settings.instance}
          envDraft={settings.envDraft}
          envSaving={settings.envSaving}
          onEnvFieldChange={settings.setEnvField}
          onSaveEnv={settings.onSaveEnv}
        />
      )}

      <SystemUpdateModal
        open={settings.suModalOpen}
        onOpenChange={settings.setSuModalOpen}
        branch={settings.selfUpdateSafe.branch}
        onComplete={() => {
          void settings.refreshSelfUpdate();
        }}
      />
    </div>
  );
}
