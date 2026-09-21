import { Button } from "@/components/ui/button";
import { VercelCardBox } from "@/components/ui/VercelCardBox";
import { EnvVariablesEditor, type EnvPair } from "@/components/EnvVariablesEditor";

interface ProjectDetailEnvTabProps {
  envPairs: EnvPair[];
  onChange: (pairs: EnvPair[]) => void;
  savingEnv: boolean;
  onSave: () => void;
}

export function ProjectDetailEnvTab({
  envPairs,
  onChange,
  savingEnv,
  onSave,
}: ProjectDetailEnvTabProps) {
  return (
    <div className="space-y-6">
      <VercelCardBox
        title="Environment Variables"
        description="Injected securely into the Docker container runtime at container boot time. Encrypted with AES-256-GCM."
        footerLeft={<span>Environment variables are loaded automatically on deployment.</span>}
        footerAction={
          <Button
            size="sm"
            className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
            onClick={onSave}
            disabled={savingEnv}
          >
            {savingEnv ? "Saving..." : "Save Variables"}
          </Button>
        }
      >
        <EnvVariablesEditor pairs={envPairs} onChange={onChange} />
      </VercelCardBox>
    </div>
  );
}
