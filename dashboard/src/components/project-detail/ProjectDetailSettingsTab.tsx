import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VercelCardBox } from "@/components/ui/VercelCardBox";
import {
  checkAutoDeploy,
  triggerDeploy,
  updateProject,
  type Project,
} from "@/lib/api";
import { toast } from "sonner";

export interface ProjectDetailSettingsTabProps {
  project: Project;
  onRefresh: () => void;
  onDeleteRequest: () => void;
  copyText: (text: string, label: string) => void;
}

export function ProjectDetailSettingsTab({
  project,
  onRefresh,
  onDeleteRequest,
  copyText,
}: ProjectDetailSettingsTabProps) {
  const navigate = useNavigate();

  const [projectNameDraft, setProjectNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [buildContextDraft, setBuildContextDraft] = useState(".");
  const [packageManagerDraft, setPackageManagerDraft] = useState("auto");
  const [installCommandDraft, setInstallCommandDraft] = useState("");
  const [buildCommandDraft, setBuildCommandDraft] = useState("");
  const [startCommandDraft, setStartCommandDraft] = useState("");
  const [showCustomCommands, setShowCustomCommands] = useState(false);
  const [savingBuildSettings, setSavingBuildSettings] = useState(false);
  const [savingBuildAndDeploy, setSavingBuildAndDeploy] = useState(false);

  const [localPathDraft, setLocalPathDraft] = useState("");
  const [savingPathSettings, setSavingPathSettings] = useState(false);

  const [deploymentTypeDraft, setDeploymentTypeDraft] = useState<"docker" | "pm2">("docker");
  const [appPortDraft, setAppPortDraft] = useState("3000");
  const [healthPathDraft, setHealthPathDraft] = useState("/health");
  const [savingRuntimeSettings, setSavingRuntimeSettings] = useState(false);

  const [repoUrlDraft, setRepoUrlDraft] = useState("");
  const [branchDraft, setBranchDraft] = useState("main");
  const [savingGitSettings, setSavingGitSettings] = useState(false);

  const [syncingAutoDeploy, setSyncingAutoDeploy] = useState(false);

  useEffect(() => {
    setProjectNameDraft(project.name);
    setBuildContextDraft(project.buildContext || ".");
    setPackageManagerDraft(project.packageManager || "auto");
    setInstallCommandDraft(project.installCommand || "");
    setBuildCommandDraft(project.buildCommand || "");
    setStartCommandDraft(project.startCommand || "");
    setShowCustomCommands(
      Boolean(project.installCommand || project.buildCommand || project.startCommand)
    );
    setLocalPathDraft(project.localPath || "");
    setDeploymentTypeDraft((project.deploymentType as "docker" | "pm2") || "docker");
    setAppPortDraft(String(project.appPort || 3000));
    setHealthPathDraft(project.healthPath || "/health");
    setRepoUrlDraft(project.repoUrl || "");
    setBranchDraft(project.branch || "main");
  }, [project]);

  const webhookUrl = useMemo(() => {
    if (!project.webhookSecret) return "";
    return `${window.location.origin}/api/webhooks/${project.webhookSecret}`;
  }, [project.webhookSecret]);

  const repoHref = project.repoUrl.startsWith("http://") || project.repoUrl.startsWith("https://")
    ? project.repoUrl
    : `https://${project.repoUrl}`;

  const onSaveProjectName = async () => {
    if (!projectNameDraft.trim()) return;
    setSavingName(true);
    try {
      await updateProject(project.id, { name: projectNameDraft.trim() });
      toast.success("[ OK ] Project name updated");
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update project name");
    } finally {
      setSavingName(false);
    }
  };

  const onSaveBuildSettings = async (redeploy = false) => {
    if (redeploy) setSavingBuildAndDeploy(true);
    else setSavingBuildSettings(true);
    try {
      await updateProject(project.id, {
        buildContext: buildContextDraft.trim() || ".",
        packageManager: packageManagerDraft,
        installCommand: installCommandDraft.trim() || null,
        buildCommand: buildCommandDraft.trim() || null,
        startCommand: startCommandDraft.trim() || null,
      });
      toast.success("[ OK ] Build and development settings saved");
      if (redeploy) {
        const r = await triggerDeploy(project.id);
        toast.success(`Redeployment queued — job ${r.jobId.slice(0, 8)}…`);
        navigate(`/projects/${project.id}/deploy/${r.jobId}`);
      } else {
        onRefresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save build settings");
    } finally {
      setSavingBuildSettings(false);
      setSavingBuildAndDeploy(false);
    }
  };

  const onSaveRuntimeSettings = async () => {
    const port = Number.parseInt(appPortDraft, 10);
    if (!Number.isFinite(port) || port < 1 || port > 65535) {
      toast.error("App port must be between 1 and 65535.");
      return;
    }
    setSavingRuntimeSettings(true);
    try {
      await updateProject(project.id, {
        deploymentType: deploymentTypeDraft,
        appPort: port,
        healthPath: healthPathDraft.trim() || "/health",
      });
      toast.success("[ OK ] Runtime and health check settings saved");
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save runtime settings");
    } finally {
      setSavingRuntimeSettings(false);
    }
  };

  const onSaveGitSettings = async () => {
    if (!repoUrlDraft.trim()) {
      toast.error("Repository URL cannot be empty.");
      return;
    }
    setSavingGitSettings(true);
    try {
      await updateProject(project.id, {
        repoUrl: repoUrlDraft.trim(),
        branch: branchDraft.trim() || "main",
      });
      toast.success("[ OK ] Git repository and branch settings saved");
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save git settings");
    } finally {
      setSavingGitSettings(false);
    }
  };

  const onSavePathSettings = async () => {
    setSavingPathSettings(true);
    try {
      await updateProject(project.id, {
        localPath: localPathDraft.trim() || null,
      });
      toast.success("[ OK ] Root directory path saved");
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save root directory path");
    } finally {
      setSavingPathSettings(false);
    }
  };

  const onCheckAutoDeploy = async () => {
    setSyncingAutoDeploy(true);
    try {
      const res = await checkAutoDeploy({ projectId: project.id });
      const result = res.results?.[0];
      if (result) {
        if (result.deployTriggered) {
          toast.success(`[ LIVE ] ${result.reason} — Deployment queued!`);
          onRefresh();
        } else {
          toast.success(`[ OK ] ${result.reason}`);
        }
      } else {
        toast.success("[ OK ] Auto-deploy sync completed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sync auto-deploy");
    } finally {
      setSyncingAutoDeploy(false);
    }
  };

  return (
    <div className="space-y-6">
      <VercelCardBox
        title="Project Name"
        description="Used to identify your Project on the Dashboard, CLI, and in deployment URLs."
        footerLeft={
          <a
            href={repoHref}
            target="_blank"
            rel="noreferrer"
            className="text-neutral-400 hover:text-white transition-colors underline-offset-2 hover:underline"
          >
            Learn more about Project Name ↗
          </a>
        }
        footerAction={
          <Button
            size="sm"
            className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
            onClick={() => void onSaveProjectName()}
            disabled={savingName}
          >
            {savingName ? "Saving..." : "Save"}
          </Button>
        }
      >
        <div className="flex items-center max-w-md rounded-md border border-neutral-800 bg-black overflow-hidden focus-within:border-neutral-600">
          <span className="bg-neutral-900/80 px-3 py-2 text-xs text-neutral-500 font-mono select-none border-r border-neutral-800">
            versiongate.com/korukonda/
          </span>
          <Input
            value={projectNameDraft}
            onChange={(e) => setProjectNameDraft(e.target.value)}
            className="h-9 border-0 bg-transparent px-3 text-xs text-white focus-visible:ring-0"
          />
        </div>
      </VercelCardBox>

      <VercelCardBox
        title="Avatar"
        description="This is your project's avatar. Click it or drop an image to upload."
        footerLeft={<span>An avatar is optional but recommended.</span>}
      >
        <div className="flex items-center justify-between max-w-md">
          <span className="text-xs text-neutral-400">Custom project logo</span>
          <div className="size-14 rounded-full border border-neutral-800 bg-neutral-900 flex items-center justify-center text-white font-bold text-lg shadow-inner">
            {project.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </VercelCardBox>

      <VercelCardBox
        title="Project ID"
        description="Used when interacting with the VersionGate API and CLI commands."
        footerLeft={
          <span className="text-neutral-500 font-mono text-[11px]">
            Target project UUID identifier
          </span>
        }
      >
        <div className="flex items-center max-w-md rounded-md border border-neutral-800 bg-black overflow-hidden">
          <span className="flex-1 px-3 py-2 font-mono text-xs text-neutral-300 select-all">
            prj_{project.id}
          </span>
          <button
            type="button"
            onClick={() => copyText(`prj_${project.id}`, "Project ID")}
            className="px-3 py-2 text-xs font-medium text-neutral-400 hover:text-white border-l border-neutral-800 transition-colors"
          >
            Copy
          </button>
        </div>
      </VercelCardBox>

      <VercelCardBox
        title="Build & Development Settings"
        description="Configure your project build context subdirectory, package manager, and custom build scripts."
        footerLeft={<span>Build scripts run in isolated container environments before preflight health checks.</span>}
        footerAction={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-neutral-700 bg-neutral-900 text-xs font-medium text-neutral-200 hover:bg-neutral-800"
              onClick={() => void onSaveBuildSettings(false)}
              disabled={savingBuildSettings || savingBuildAndDeploy}
            >
              {savingBuildSettings ? "Saving…" : "Save Settings"}
            </Button>
            <Button
              size="sm"
              className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
              onClick={() => void onSaveBuildSettings(true)}
              disabled={savingBuildSettings || savingBuildAndDeploy}
            >
              {savingBuildAndDeploy ? "Deploying…" : "Save & Redeploy"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">
                Build Context Subdirectory
              </label>
              <Input
                value={buildContextDraft}
                onChange={(e) => setBuildContextDraft(e.target.value)}
                placeholder="."
                className="h-9 border-neutral-800 bg-black font-mono text-xs text-white"
              />
              <p className="text-[11px] text-neutral-500">
                Subdirectory containing project code (e.g. <code>.</code> or <code>apps/web</code>).
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">
                Package Manager
              </label>
              <select
                className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white focus:outline-none focus:border-neutral-600"
                value={packageManagerDraft}
                onChange={(e) => setPackageManagerDraft(e.target.value)}
              >
                <option value="auto">Auto-detect from repository</option>
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
              <p className="text-[11px] text-neutral-500">
                Engine used to resolve dependencies and build output artifacts.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-neutral-300">Custom Build &amp; Start Commands</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs font-mono text-neutral-400 hover:text-white"
                onClick={() => setShowCustomCommands((prev) => !prev)}
              >
                {showCustomCommands ? "[ HIDE COMMANDS ]" : "[ CUSTOM COMMANDS ]"}
              </Button>
            </div>

            {showCustomCommands && (
              <div className="grid gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-neutral-400">Install Command (Optional)</label>
                  <Input
                    value={installCommandDraft}
                    onChange={(e) => setInstallCommandDraft(e.target.value)}
                    placeholder="e.g. pnpm install --frozen-lockfile"
                    className="h-8 border-neutral-800 bg-black font-mono text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-neutral-400">Build Command (Optional)</label>
                  <Input
                    value={buildCommandDraft}
                    onChange={(e) => setBuildCommandDraft(e.target.value)}
                    placeholder="e.g. npm run build:prod or bun run build"
                    className="h-8 border-neutral-800 bg-black font-mono text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-neutral-400">Start Command (Optional)</label>
                  <Input
                    value={startCommandDraft}
                    onChange={(e) => setStartCommandDraft(e.target.value)}
                    placeholder="e.g. npm run start or node dist/index.js"
                    className="h-8 border-neutral-800 bg-black font-mono text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </VercelCardBox>

      <VercelCardBox
        title="Root Directory &amp; Host Path"
        description="Configured directory path on the server for adopted applications and local repositories."
        footerLeft={<span>Synced automatically during deployment if local fallback is active.</span>}
        footerAction={
          <Button
            size="sm"
            className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
            onClick={() => void onSavePathSettings()}
            disabled={savingPathSettings}
          >
            {savingPathSettings ? "Saving…" : "Save Path"}
          </Button>
        }
      >
        <div className="space-y-1.5 max-w-xl">
          <label className="text-xs font-medium text-neutral-400">Host Working Directory (localPath)</label>
          <Input
            value={localPathDraft}
            onChange={(e) => setLocalPathDraft(e.target.value)}
            placeholder="/var/versiongate/projects/my-app"
            className="h-9 border-neutral-800 bg-black font-mono text-xs text-white"
          />
          <p className="text-[11px] text-neutral-500">
            Local directory on the host server where this project source or adopted service resides.
          </p>
        </div>
      </VercelCardBox>

      <VercelCardBox
        title="Runtime Engine &amp; Health Checks"
        description="Deployment runner engine, internal container port, and zero-downtime healthcheck endpoint."
        footerLeft={<span>Blue/Green slots (:basePort and :basePort + 1) route traffic only after health checks pass.</span>}
        footerAction={
          <Button
            size="sm"
            className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
            onClick={() => void onSaveRuntimeSettings()}
            disabled={savingRuntimeSettings}
          >
            {savingRuntimeSettings ? "Saving…" : "Save Runtime"}
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-400">Deployment Engine</label>
            <select
              className="h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-white focus:outline-none focus:border-neutral-600"
              value={deploymentTypeDraft}
              onChange={(e) => setDeploymentTypeDraft(e.target.value as "docker" | "pm2")}
            >
              <option value="docker">Docker Container (Default)</option>
              <option value="pm2">Host PM2 Supervisor</option>
            </select>
            <p className="text-[11px] text-neutral-500">
              {deploymentTypeDraft === "pm2" ? "Direct host process execution." : "Isolated Docker container."}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-400">App Internal Port</label>
            <Input
              type="number"
              min={1}
              max={65535}
              value={appPortDraft}
              onChange={(e) => setAppPortDraft(e.target.value)}
              placeholder="3000"
              className="h-9 border-neutral-800 bg-black font-mono text-xs text-white"
            />
            <p className="text-[11px] text-neutral-500">
              Port the application listens on internally.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-400">Health Check Endpoint</label>
            <Input
              value={healthPathDraft}
              onChange={(e) => setHealthPathDraft(e.target.value)}
              placeholder="/health"
              className="h-9 border-neutral-800 bg-black font-mono text-xs text-white"
            />
            <p className="text-[11px] text-neutral-500">
              HTTP endpoint probed before traffic cutover.
            </p>
          </div>
        </div>
      </VercelCardBox>

      <VercelCardBox
        title="Git Repository &amp; Automated Deployments"
        description="Continuous deployment triggers on push to your repository branch."
        footerLeft={
          <span className="text-[11px] text-neutral-400">
            GitHub App Relay &amp; Direct Webhook endpoints continuously listen for push events on <code className="font-mono text-neutral-200">{project.branch}</code>.
          </span>
        }
        footerAction={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-neutral-700 bg-neutral-900 text-xs font-medium text-neutral-200 hover:bg-neutral-800"
              onClick={() => void onCheckAutoDeploy()}
              disabled={syncingAutoDeploy}
            >
              {syncingAutoDeploy ? "Checking commits…" : "Sync Latest Commit"}
            </Button>
            <Button
              size="sm"
              className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs"
              onClick={() => void onSaveGitSettings()}
              disabled={savingGitSettings}
            >
              {savingGitSettings ? "Saving…" : "Save Git Settings"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">Git Repository URL</label>
              <Input
                value={repoUrlDraft}
                onChange={(e) => setRepoUrlDraft(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="h-9 border-neutral-800 bg-black font-mono text-xs text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">Target Production Branch</label>
              <Input
                value={branchDraft}
                onChange={(e) => setBranchDraft(e.target.value)}
                placeholder="main"
                className="h-9 border-neutral-800 bg-black font-mono text-xs text-white"
              />
            </div>
          </div>

          {webhookUrl && (
            <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
              <label className="text-xs font-medium text-neutral-400">
                Direct Webhook URL
              </label>
              <div className="flex items-center rounded-md border border-neutral-800 bg-black overflow-hidden">
                <span className="flex-1 px-3 py-2 font-mono text-xs text-neutral-300 select-all truncate">
                  {webhookUrl}
                </span>
                <button
                  type="button"
                  onClick={() => copyText(webhookUrl, "Webhook URL")}
                  className="px-3 py-2 text-xs font-medium text-neutral-400 hover:text-white border-l border-neutral-800 transition-colors shrink-0"
                >
                  Copy Webhook URL
                </button>
              </div>
              <p className="text-[11px] text-neutral-500">
                Add this payload URL to your GitHub repository under <strong>Settings &rarr; Webhooks</strong> with Content type set to <code>application/json</code>.
              </p>
            </div>
          )}
        </div>
      </VercelCardBox>

      <VercelCardBox
        title="Danger Zone"
        description="Permanently delete this project, destroy its Docker containers, remove blue/green slots, and purge isolated Nginx configurations."
        danger
        footerLeft={
          <span className="text-xs text-red-300/80">
            This action is irreversible. All environment mappings will be lost.
          </span>
        }
        footerAction={
          <Button
            variant="destructive"
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-xs text-white font-semibold"
            onClick={onDeleteRequest}
          >
            Delete Project
          </Button>
        }
      >
        <p className="text-xs text-neutral-400">
          Deleting this project will immediately tear down all running container slots and delete all associated records from the engine database.
        </p>
      </VercelCardBox>
    </div>
  );
}
