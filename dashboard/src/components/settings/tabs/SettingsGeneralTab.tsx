import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DonutChart } from "@/components/charts/DonutChart";
import { VercelCardBox } from "@/components/ui/VercelCardBox";
import { ChangePasswordCard } from "@/components/settings/ChangePasswordCard";
import { settingsInputClass } from "@/components/settings/settings-styles";
import { boolPill, Row } from "@/components/settings/settings-ui";
import { type InstanceSettings } from "@/lib/api";
export interface SettingsGeneralTabProps {
  instance: InstanceSettings;
}

export function SettingsGeneralTab({ instance }: SettingsGeneralTabProps) {
  const [teamNameDraft, setTeamNameDraft] = useState("korukonda");
  const [teamUrlDraft, setTeamUrlDraft] = useState("korukonda");

  const checkSummary = useMemo(() => {
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

  return (
    <div className="space-y-6">
      <VercelCardBox
        title="Team Name"
        description="This is your team's visible name within VersionGate. For example, the name of your company or department."
        footerLeft={<span>Team profile editing is coming soon. Please use 32 characters at maximum.</span>}
        footerAction={
          <Button
            size="sm"
            className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
            disabled
            title="Team profile API is not yet available"
          >
            Save
          </Button>
        }
      >
        <div className="max-w-md">
          <Input
            value={teamNameDraft}
            onChange={(e) => setTeamNameDraft(e.target.value)}
            className={settingsInputClass}
            maxLength={32}
            disabled
            aria-disabled="true"
          />
        </div>
      </VercelCardBox>

      <VercelCardBox
        title="Team URL"
        description="This is your team's URL namespace on VersionGate. Used in deployment URLs and API namespaces."
        footerLeft={<span>Team URL editing is coming soon. Please use 48 characters at maximum.</span>}
        footerAction={
          <Button
            size="sm"
            className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
            disabled
            title="Team profile API is not yet available"
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
            disabled
            aria-disabled="true"
          />
        </div>
      </VercelCardBox>

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

      <ChangePasswordCard />

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
  );
}
