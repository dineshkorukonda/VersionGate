import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { triggerDeploy, updateProject, listManagedDatabases, type Project, type ManagedDatabase } from "@/lib/api";
import { EnvVariablesEditor } from "@/components/EnvVariablesEditor";

export function EditProjectModal({
  open,
  onOpenChange,
  project,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onUpdated?: () => void;
}) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [redeploying, setRedeploying] = useState(false);
  const [managedDbs, setManagedDbs] = useState<ManagedDatabase[]>([]);
  const [selectedDbId, setSelectedDbId] = useState<string>("");
  const [repoUrl, setRepoUrl] = useState(project.repoUrl);
  const [branch, setBranch] = useState(project.branch);
  const [buildContext, setBuildContext] = useState(project.buildContext);
  const [appPort, setAppPort] = useState(String(project.appPort));
  const [healthPath, setHealthPath] = useState(project.healthPath);
  const [deploymentType, setDeploymentType] = useState<"docker" | "pm2">(project.deploymentType || "docker");
  const [packageManager, setPackageManager] = useState(project.packageManager || "auto");
  const [installCommand, setInstallCommand] = useState(project.installCommand || "");
  const [buildCommand, setBuildCommand] = useState(project.buildCommand || "");
  const [startCommand, setStartCommand] = useState(project.startCommand || "");
  const [showAdvancedRuntime, setShowAdvancedRuntime] = useState(
    Boolean(project.installCommand || project.buildCommand || project.startCommand)
  );
  const [envPairs, setEnvPairs] = useState<{ key: string; value: string }[]>([]);

  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setRepoUrl(project.repoUrl);
      setBranch(project.branch);
      setBuildContext(project.buildContext);
      setAppPort(String(project.appPort));
      setHealthPath(project.healthPath);
      setDeploymentType(project.deploymentType || "docker");
      setPackageManager(project.packageManager || "auto");
      setInstallCommand(project.installCommand || "");
      setBuildCommand(project.buildCommand || "");
      setStartCommand(project.startCommand || "");
      setShowAdvancedRuntime(
        Boolean(project.installCommand || project.buildCommand || project.startCommand)
      );
      const rawEnv = project.env || {};
      const pairs = Object.entries(rawEnv).map(([k, v]) => ({ key: k, value: String(v) }));
      setEnvPairs(pairs.length > 0 ? pairs : [{ key: "", value: "" }]);

      void listManagedDatabases()
        .then((res) => setManagedDbs(res.databases))
        .catch(() => setManagedDbs([]));
    }
    wasOpenRef.current = open;
  }, [open, project]);

  const handleAttachDatabase = async (dbId: string) => {
    if (!dbId) return;
    try {
      const { getManagedDatabase } = await import("@/lib/api");
      const res = await getManagedDatabase(dbId);
      const db = res.database;
      const key = db.engine === "redis" ? "REDIS_URL" : db.engine === "mongodb" ? "MONGODB_URI" : "DATABASE_URL";
      const uri = deploymentType === "docker" ? db.connectionUriDocker : db.connectionUriLocal;

      setEnvPairs((prev) => {
        const existingIdx = prev.findIndex((p) => p.key.trim() === key);
        if (existingIdx >= 0) {
          return prev.map((p, idx) => (idx === existingIdx ? { key, value: uri } : p));
        }
        const filtered = prev.filter((p) => p.key.trim() || p.value.trim());
        return [...filtered, { key, value: uri }];
      });
      toast.success(`[ OK ] Attached ${db.name} as ${key}`);
      setSelectedDbId("");
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "Failed to load database connection URI");
    }
  };

  const saveProjectSettings = async (): Promise<boolean> => {
    const port = Number.parseInt(appPort, 10);
    if (!Number.isFinite(port) || port < 1 || port > 65535) {
      toast.error("App port must be between 1 and 65535.");
      return false;
    }

    const envMap: Record<string, string> = {};
    for (const p of envPairs) {
      const k = p.key.trim();
      if (k) {
        envMap[k] = p.value;
      }
    }

    await updateProject(project.id, {
      repoUrl: repoUrl.trim(),
      branch: branch.trim() || "main",
      buildContext: buildContext.trim() || ".",
      appPort: port,
      healthPath: healthPath.trim() || "/health",
      deploymentType,
      packageManager,
      installCommand: installCommand.trim() || null,
      buildCommand: buildCommand.trim() || null,
      startCommand: startCommand.trim() || null,
      env: envMap,
    });
    return true;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await saveProjectSettings();
      if (!ok) return;
      toast.success("[ OK ] Project configuration updated");
      onOpenChange(false);
      onUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setSubmitting(false);
    }
  };

  const onSaveAndRedeploy = async () => {
    setRedeploying(true);
    try {
      const ok = await saveProjectSettings();
      if (!ok) return;
      toast.success("[ OK ] Settings saved. Triggering redeployment…");
      const r = await triggerDeploy(project.id);
      toast.success(`Redeployment queued — job ${r.jobId.slice(0, 8)}…`);
      onOpenChange(false);
      onUpdated?.();
      navigate(`/projects/${project.id}/deploy/${r.jobId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save and redeploy");
    } finally {
      setRedeploying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl font-sans">
        <DialogHeader>
          <DialogTitle>Edit Project Settings</DialogTitle>
          <DialogDescription>
            Update Git repository, deployment paths, container port, and project-level environment variables.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
          <div className="grid gap-1.5">
            <label htmlFor="ep-repo" className="text-sm font-medium">
              Git Repository URL
            </label>
            <Input
              id="ep-repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/org/repo.git"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="ep-branch" className="text-sm font-medium">
                Production Branch
              </label>
              <Input
                id="ep-branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="ep-context" className="text-sm font-medium">
                Build Context Subdirectory
              </label>
              <Input
                id="ep-context"
                value={buildContext}
                onChange={(e) => setBuildContext(e.target.value)}
                placeholder="."
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label htmlFor="ep-port" className="text-sm font-medium">
                Container Internal Port
              </label>
              <Input
                id="ep-port"
                type="number"
                min={1}
                max={65535}
                value={appPort}
                onChange={(e) => setAppPort(e.target.value)}
                placeholder="3000"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="ep-health" className="text-sm font-medium">
                Health Check Path
              </label>
              <Input
                id="ep-health"
                value={healthPath}
                onChange={(e) => setHealthPath(e.target.value)}
                placeholder="/health"
                required
              />
            </div>
          </div>

          {/* Runtime & Framework Configuration */}
          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Runtime &amp; Framework Settings</label>
                <p className="text-xs text-muted-foreground">
                  Switch deployment runner engine, package manager, or customize build commands.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs h-7 font-mono"
                onClick={() => setShowAdvancedRuntime((prev) => !prev)}
              >
                {showAdvancedRuntime ? "[ HIDE COMMANDS ]" : "[ CUSTOM COMMANDS ]"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label htmlFor="ep-runtime-type" className="text-xs font-medium text-muted-foreground">
                  Deployment Engine
                </label>
                <select
                  id="ep-runtime-type"
                  className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                  value={deploymentType}
                  onChange={(e) => setDeploymentType(e.target.value as "docker" | "pm2")}
                >
                  <option value="docker">Docker Container (Default)</option>
                  <option value="pm2">Host PM2 Process (Bare-metal)</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  {deploymentType === "pm2"
                    ? "Runs natively on host server under PM2 supervision."
                    : "Runs inside an isolated zero-downtime container."}
                </p>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="ep-pkg-mgr" className="text-xs font-medium text-muted-foreground">
                  Package Manager
                </label>
                <select
                  id="ep-pkg-mgr"
                  className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                  value={packageManager}
                  onChange={(e) => setPackageManager(e.target.value)}
                >
                  <option value="auto">Auto-detect from repo</option>
                  <option value="bun">Bun</option>
                  <option value="pnpm">pnpm</option>
                  <option value="npm">npm</option>
                  <option value="yarn">Yarn</option>
                  <option value="uv">Python (uv)</option>
                  <option value="poetry">Python (Poetry)</option>
                  <option value="pip">Python (pip)</option>
                  <option value="cargo">Rust (Cargo)</option>
                  <option value="composer">PHP (Composer)</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Tool used to install dependencies and run build scripts.
                </p>
              </div>
            </div>

            {showAdvancedRuntime ? (
              <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="grid gap-1.5">
                  <label htmlFor="ep-install-cmd" className="text-xs font-mono font-medium text-muted-foreground">
                    Custom Install Command (Optional)
                  </label>
                  <Input
                    id="ep-install-cmd"
                    value={installCommand}
                    onChange={(e) => setInstallCommand(e.target.value)}
                    placeholder="e.g. pnpm install --frozen-lockfile"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="ep-build-cmd" className="text-xs font-mono font-medium text-muted-foreground">
                    Custom Build Command (Optional)
                  </label>
                  <Input
                    id="ep-build-cmd"
                    value={buildCommand}
                    onChange={(e) => setBuildCommand(e.target.value)}
                    placeholder="e.g. npm run build:prod or cargo build --release"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="ep-start-cmd" className="text-xs font-mono font-medium text-muted-foreground">
                    Custom Start Command (Optional)
                  </label>
                  <Input
                    id="ep-start-cmd"
                    value={startCommand}
                    onChange={(e) => setStartCommand(e.target.value)}
                    placeholder="e.g. npm run start or uvicorn main:app --host 0.0.0.0 --port $PORT"
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="pt-2 border-t border-border/50">
            <EnvVariablesEditor
              pairs={envPairs}
              onChange={setEnvPairs}
              managedDbs={managedDbs}
              selectedDbId={selectedDbId}
              onAttachDatabase={(id) => void handleAttachDatabase(id)}
              title="Project Environment Variables"
              description="Encrypted at rest with AES-256-GCM. Applied to all deployments unless overridden by environment stages."
            />
          </div>

          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting || redeploying}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              disabled={submitting || redeploying}
            >
              {submitting ? "Saving…" : "Save Changes"}
            </Button>
            <Button
              type="button"
              onClick={() => void onSaveAndRedeploy()}
              disabled={submitting || redeploying}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {redeploying ? "Deploying…" : "Save & Redeploy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
