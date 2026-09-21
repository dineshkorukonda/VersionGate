import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VercelCardBox } from "@/components/ui/VercelCardBox";
import { settingsInputClass } from "@/components/settings/settings-styles";
import { boolPill, Row } from "@/components/settings/settings-ui";
import { type SelfUpdateSettingsResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface SettingsUpdatesTabProps {
  selfUpdate: SelfUpdateSettingsResponse;
  suOpts: { branch: string; pollMs: string; autoApply: string };
  suBusy: string | null;
  onSuOptsChange: (opts: { branch: string; pollMs: string; autoApply: string }) => void;
  onEnableSelfUpdate: () => void;
  onCheckSelfUpdate: () => void;
  onApplySelfUpdate: () => void;
  onSaveSelfUpdateOpts: (e: React.FormEvent) => void;
}

export function SettingsUpdatesTab({
  selfUpdate,
  suOpts,
  suBusy,
  onSuOptsChange,
  onEnableSelfUpdate,
  onCheckSelfUpdate,
  onApplySelfUpdate,
  onSaveSelfUpdateOpts,
}: SettingsUpdatesTabProps) {
  return (
    <div className="space-y-6">
      <VercelCardBox
        title="Zero-Downtime Engine Self-Update"
        description="Pull latest commits from Git, run database migrations, rebuild control plane, and atomically reload PM2."
        footerLeft={<span>Save background polling cadence and automated branch pull triggers.</span>}
        footerAction={
          <div className="flex items-center gap-2">
            {!selfUpdate.configured ? (
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
            <Row label="Tracked Branch" value={selfUpdate.branch} />
            <Row
              label="Polling Interval"
              value={selfUpdate.pollMs > 0 ? `${selfUpdate.pollMs} ms` : "Manual only"}
            />
            <Row label="Auto-apply on poll" value={boolPill(selfUpdate.autoApply, "Enabled", "Disabled")} />
          </dl>

          {selfUpdate.git ? (
            <div className="rounded-lg border border-neutral-800 bg-black/60 p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Git Commit State:</span>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="rounded bg-neutral-900 px-2 py-0.5 text-neutral-300">
                    local: {selfUpdate.git.currentCommit ? selfUpdate.git.currentCommit.slice(0, 7) : "—"}
                  </span>
                  {selfUpdate.git.remoteCommit ? (
                    <span className="rounded bg-neutral-900 px-2 py-0.5 text-neutral-300">
                      remote: {selfUpdate.git.remoteCommit.slice(0, 7)}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="mt-2">
                {selfUpdate.git.message ? (
                  <p className="text-amber-400">{selfUpdate.git.message}</p>
                ) : selfUpdate.git.behind ? (
                  <p className="text-emerald-400 font-medium">New commits available on origin. Ready to update.</p>
                ) : selfUpdate.git.isGitRepo ? (
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
                  onChange={(e) => onSuOptsChange({ ...suOpts, branch: e.target.value })}
                  placeholder="main"
                  autoComplete="off"
                  className={settingsInputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300" htmlFor="su-poll">
                  Poll Interval (ms)
                </label>
                <Input
                  id="su-poll"
                  value={suOpts.pollMs}
                  onChange={(e) => onSuOptsChange({ ...suOpts, pollMs: e.target.value })}
                  placeholder="0 = off"
                  inputMode="numeric"
                  autoComplete="off"
                  className={settingsInputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300" htmlFor="su-auto">
                  Auto-apply on poll
                </label>
                <select
                  id="su-auto"
                  value={suOpts.autoApply}
                  onChange={(e) => onSuOptsChange({ ...suOpts, autoApply: e.target.value })}
                  className={cn(settingsInputClass, "h-9")}
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
  );
}
