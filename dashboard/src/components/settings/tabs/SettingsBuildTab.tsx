import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VercelCardBox } from "@/components/ui/VercelCardBox";
import { settingsInputClass } from "@/components/settings/settings-styles";
import { cn } from "@/lib/utils";

export interface SettingsBuildTabProps {
  excludedPortsDraft: string;
  onExcludedPortsChange: (value: string) => void;
  savingExcludedPorts: boolean;
  onSaveExcludedPorts: (e: React.FormEvent) => void;
}

export function SettingsBuildTab({
  excludedPortsDraft,
  onExcludedPortsChange,
  savingExcludedPorts,
  onSaveExcludedPorts,
}: SettingsBuildTabProps) {
  return (
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
            onChange={(e) => onExcludedPortsChange(e.target.value)}
            placeholder="80,443,3000,5173,5432,6379,9090"
            className={cn(settingsInputClass, "font-mono")}
            disabled={savingExcludedPorts}
          />
          <p className="mt-2 text-[11px] text-neutral-500">
            Supports individual ports (<code className="font-mono text-neutral-300">3000</code>) and inclusive ranges (
            <code className="font-mono text-neutral-300">8000-8050</code>).
          </p>
        </form>
      </VercelCardBox>
    </div>
  );
}
