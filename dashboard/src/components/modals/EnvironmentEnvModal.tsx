import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { patchEnvironmentEnv, triggerDeploy, type EnvironmentSummary } from "@/lib/api";
import { EnvVariablesEditor } from "@/components/EnvVariablesEditor";
import { toast } from "sonner";

interface EnvironmentEnvModalProps {
  projectId: string;
  environment: EnvironmentSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => Promise<void>;
}

export function EnvironmentEnvModal({
  projectId,
  environment,
  open,
  onOpenChange,
  onRefresh,
}: EnvironmentEnvModalProps) {
  const navigate = useNavigate();
  const [envPairs, setEnvPairs] = useState<Array<{ key: string; value: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [redeploying, setRedeploying] = useState(false);

  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current && environment) {
      const entries = Object.entries(environment.env || {});
      setEnvPairs(entries.length > 0 ? entries.map(([key, value]) => ({ key, value })) : [{ key: "", value: "" }]);
    }
    wasOpenRef.current = open;
  }, [open, environment]);

  if (!environment) return null;

  const saveEnvVars = async (): Promise<boolean> => {
    const obj: Record<string, string> = {};
    for (const pair of envPairs) {
      const k = pair.key.trim();
      if (k) {
        obj[k] = pair.value;
      }
    }
    await patchEnvironmentEnv(projectId, environment.id, obj);
    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveEnvVars();
      toast.success(`Environment variables updated for ${environment.name}`);
      await onRefresh();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save environment variables");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndRedeploy = async () => {
    setRedeploying(true);
    try {
      await saveEnvVars();
      toast.success(`[ OK ] Variables saved. Redeploying ${environment.name}…`);
      const r = await triggerDeploy(projectId, environment.id);
      toast.success(`Deploy queued — ${environment.name} — job ${r.jobId.slice(0, 8)}…`);
      await onRefresh();
      onOpenChange(false);
      navigate(`/projects/${projectId}/deploy/${r.jobId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save and redeploy");
    } finally {
      setRedeploying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-wide">
            Stage Env Vars — {environment.name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Environment variables set here will override global project defaults when deploying to the{" "}
            <span className="font-semibold text-foreground">{environment.name}</span> stage.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <EnvVariablesEditor
            pairs={envPairs}
            onChange={setEnvPairs}
            title="Stage Variables"
            description="Overrides project-level environment variables for this stage."
            maxHeightClass="max-h-[300px]"
          />
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={saving || redeploying}>
            Cancel
          </Button>
          <Button variant="secondary" type="button" disabled={saving || redeploying} onClick={() => void handleSave()}>
            {saving ? "Saving…" : "Save Variables"}
          </Button>
          <Button
            type="button"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            disabled={saving || redeploying}
            onClick={() => void handleSaveAndRedeploy()}
          >
            {redeploying ? "Deploying…" : "Save & Redeploy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
