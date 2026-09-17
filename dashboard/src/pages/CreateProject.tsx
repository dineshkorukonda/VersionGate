import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EnvVariablesEditor } from "@/components/EnvVariablesEditor";
import {
  ApiError,
  createProject,
  createCronJob,
  detectRepoStack,
  getGithubInstallation,
  getGithubRepoBranches,
  listManagedDatabases,
  type GithubInstallationSummary,
  type GithubRepoRow,
  type ManagedDatabase,
  type RepoStackDetection,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GithubRepoPicker } from "@/components/GithubRepoPicker";
import { cn } from "@/lib/utils";

const NAME_PATTERN = /^[a-z0-9-]+$/;

const ROOT_PRESETS = [
  { label: "Repository root", value: "." },
  { label: "apps/web", value: "apps/web" },
  { label: "frontend", value: "frontend" },
  { label: "backend", value: "backend" },
  { label: "packages/app", value: "packages/app" },
] as const;

const selectClass = cn(
  "h-9 w-full min-w-0 rounded-md border border-neutral-800 bg-black px-3 py-1 text-xs text-white outline-none transition-colors",
  "focus-visible:border-neutral-500",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export function CreateProject() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [buildContext, setBuildContext] = useState(".");
  const [appPort, setAppPort] = useState("3000");
  const [healthPath, setHealthPath] = useState("/health");
  const [deploymentType, setDeploymentType] = useState<"docker" | "pm2">("docker");
  const [packageManager, setPackageManager] = useState("auto");
  const [installCommand, setInstallCommand] = useState("");
  const [buildCommand, setBuildCommand] = useState("");
  const [startCommand, setStartCommand] = useState("");
  const [showAdvancedRuntime, setShowAdvancedRuntime] = useState(false);

  const [ghLoading, setGhLoading] = useState(false);
  const [ghConnected, setGhConnected] = useState(false);
  const [ghInstallations, setGhInstallations] = useState<GithubInstallationSummary[]>([]);
  const [selectedInstallationId, setSelectedInstallationId] = useState<string | null>(null);
  const [ghSource, setGhSource] = useState<"github" | "manual">("github");
  const [selectedGithubRepo, setSelectedGithubRepo] = useState<GithubRepoRow | null>(null);
  const [branchNames, setBranchNames] = useState<string[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [stackDetecting, setStackDetecting] = useState(false);
  const [detectedStack, setDetectedStack] = useState<RepoStackDetection | null>(null);
  const [envPairs, setEnvPairs] = useState<{ key: string; value: string }[]>([]);
  const [managedDbs, setManagedDbs] = useState<ManagedDatabase[]>([]);

  // Optional Initial Scheduled Cron Job
  const [enableInitialCron, setEnableInitialCron] = useState(false);
  const [cronName, setCronName] = useState("");
  const [cronSchedule, setCronSchedule] = useState("0 0 * * *");
  const [cronTargetType, setCronTargetType] = useState<"HTTP" | "COMMAND">("HTTP");
  const [cronHttpPath, setCronHttpPath] = useState("/api/cron");
  const [cronCommand, setCronCommand] = useState("");

  useEffect(() => {
    let cancelled = false;
    setGhLoading(true);
    void Promise.all([
      getGithubInstallation().catch(() => ({ installation: null, installations: [] })),
      listManagedDatabases().catch(() => ({ databases: [] })),
    ])
      .then(([ghRes, dbRes]) => {
        if (cancelled) return;
        const connected = ghRes.installation !== null;
        setGhConnected(connected);
        setGhInstallations(ghRes.installations || []);
        const id =
          ghRes.installation?.installationId ?? ghRes.installations?.[0]?.installationId ?? null;
        setSelectedInstallationId(id);
        setGhSource(connected ? "github" : "manual");
        setManagedDbs(dbRes.databases || []);
      })
      .finally(() => {
        if (!cancelled) setGhLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRepoPick = (r: GithubRepoRow) => {
    setSelectedGithubRepo(r);
    setRepoUrl(r.cloneUrl);
    const defaultB = r.defaultBranch?.trim() || "main";
    setBranch(defaultB);
    setBranchNames([]);
    const cleanName = r.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    setName(cleanName);

    if (cleanName.includes("website")) {
      setBuildContext("website");
    } else if (cleanName.includes("dashboard")) {
      setBuildContext("dashboard");
    } else if (cleanName.includes("frontend") || cleanName.includes("web")) {
      setBuildContext("frontend");
    } else if (cleanName.includes("backend") || cleanName.includes("api") || cleanName.includes("server")) {
      setBuildContext("backend");
    } else {
      setBuildContext(".");
    }
  };

  useEffect(() => {
    if (!selectedGithubRepo || !selectedInstallationId) return;
    const slash = selectedGithubRepo.fullName.indexOf("/");
    const owner = slash >= 0 ? selectedGithubRepo.fullName.slice(0, slash) : "";
    const repoName = slash >= 0 ? selectedGithubRepo.fullName.slice(slash + 1) : "";
    if (!owner || !repoName) return;

    setBranchesLoading(true);
    void getGithubRepoBranches(owner, repoName, selectedInstallationId)
      .then((res) => {
        const names = res.branches.map((b) => b.name);
        setBranchNames(names);
        const preferred = selectedGithubRepo.defaultBranch?.trim() || "main";
        if (names.includes(preferred)) {
          setBranch(preferred);
        } else if (names[0]) {
          setBranch(names[0]);
        }
      })
      .catch((e: unknown) => {
        setBranchNames([]);
        const msg = e instanceof ApiError ? e.message : "Could not list branches.";
        toast.error(msg);
      })
      .finally(() => setBranchesLoading(false));
  }, [selectedInstallationId, selectedGithubRepo]);

  useEffect(() => {
    let active = true;
    let owner = "";
    let repoName = "";

    if (selectedGithubRepo) {
      const slash = selectedGithubRepo.fullName.indexOf("/");
      owner = slash >= 0 ? selectedGithubRepo.fullName.slice(0, slash) : "";
      repoName = slash >= 0 ? selectedGithubRepo.fullName.slice(slash + 1) : "";
    } else if (repoUrl.trim()) {
      const match = repoUrl.trim().match(/github\.com[:/]([^/]+)\/([^/.]+?)(?:\\.git)?$/);
      if (match) {
        owner = match[1];
        repoName = match[2];
      }
    }

    if (!owner || !repoName) {
      setDetectedStack(null);
      setStackDetecting(false);
      return;
    }

    setStackDetecting(true);
    void detectRepoStack(owner, repoName, branch || undefined, selectedInstallationId || undefined)
      .then((res) => {
        if (!active) return;
        if (res && res.detected) {
          setDetectedStack(res);
          setAppPort(String(res.recommendedPort));
          setHealthPath(res.recommendedHealthPath);
          if (res.recommendedBuildContext && res.recommendedBuildContext !== ".") {
            setBuildContext(res.recommendedBuildContext);
          }
        } else {
          setDetectedStack(null);
        }
      })
      .catch(() => {
        if (active) setDetectedStack(null);
      })
      .finally(() => {
        if (active) setStackDetecting(false);
      });

    return () => {
      active = false;
    };
  }, [selectedGithubRepo, branch, repoUrl, selectedInstallationId]);

  const contextPresets = useMemo(() => {
    const list: { label: string; value: string }[] = [...ROOT_PRESETS];
    if (detectedStack?.suggestions) {
      for (const s of detectedStack.suggestions) {
        if (!list.some((existing) => existing.value === s.value)) {
          list.push(s);
        }
      }
    }
    return list;
  }, [detectedStack]);

  const handleAttachDatabase = (dbId: string) => {
    const db = managedDbs.find((d) => d.id === dbId);
    if (!db) return;
    const uri =
      db.engine === "postgres"
        ? `postgresql://${db.username || "postgres"}:password@127.0.0.1:${db.hostPort}/${db.databaseName || "versiongate_app"}`
        : db.engine === "mysql"
        ? `mysql://${db.username || "root"}:password@127.0.0.1:${db.hostPort}/${db.databaseName || "versiongate_app"}`
        : db.engine === "redis"
        ? `redis://127.0.0.1:${db.hostPort}`
        : `mongodb://127.0.0.1:${db.hostPort}/${db.databaseName || "versiongate_app"}`;

    const key = db.engine === "redis" ? "REDIS_URL" : db.engine === "mongodb" ? "MONGODB_URL" : "DATABASE_URL";
    setEnvPairs((prev) => {
      const existing = prev.filter((p) => p.key !== key);
      return [...existing, { key, value: uri }];
    });
    toast.success(`Attached ${db.name} as ${key}`);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim().toLowerCase();
    if (!NAME_PATTERN.test(trimmed)) {
      toast.error("Name must be lowercase letters, numbers, and hyphens only (e.g. my-app).");
      return;
    }
    if (ghSource === "github" && ghConnected && !repoUrl.trim()) {
      toast.error("Select a GitHub repository or switch to manual URL.");
      return;
    }
    if (ghSource === "manual" && !repoUrl.trim()) {
      toast.error("Enter a Git repository URL.");
      return;
    }
    const port = Number.parseInt(appPort, 10);
    if (!Number.isFinite(port) || port < 1 || port > 65535) {
      toast.error("App port must be between 1 and 65535.");
      return;
    }

    const envMap: Record<string, string> = {};
    for (const p of envPairs) {
      const k = p.key.trim();
      if (k) {
        envMap[k] = p.value;
      }
    }

    setSubmitting(true);
    try {
      const { project } = await createProject({
        name: trimmed,
        repoUrl: repoUrl.trim(),
        branch: branch.trim() || "main",
        buildContext: buildContext.trim() || ".",
        appPort: port,
        healthPath: healthPath.trim() || "/health",
        deploymentType,
        packageManager,
        installCommand: installCommand.trim() || undefined,
        buildCommand: buildCommand.trim() || undefined,
        startCommand: startCommand.trim() || undefined,
        env: Object.keys(envMap).length > 0 ? envMap : undefined,
      });
      toast.success("Project created successfully");

      if (enableInitialCron && (cronName.trim() || cronHttpPath.trim() || cronCommand.trim())) {
        try {
          await createCronJob({
            name: cronName.trim() || `${trimmed}-daily-task`,
            schedule: cronSchedule.trim() || "0 0 * * *",
            targetType: cronTargetType,
            httpMethod: "GET",
            httpPath: cronTargetType === "HTTP" ? (cronHttpPath.trim() || "/api/cron") : undefined,
            command: cronTargetType === "COMMAND" ? cronCommand.trim() : undefined,
            projectId: project.id,
          });
          toast.success("Initial cron routine scheduled");
        } catch {
          toast.error("Project created, but initial cron schedule failed");
        }
      }

      navigate(`/projects/${project.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16 font-sans">
      {/* Vercel Header Bar */}
      <div className="flex flex-col gap-4 border-b border-neutral-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Link to="/projects" className="hover:text-white transition-colors">
              Projects
            </Link>
            <span>/</span>
            <span className="text-neutral-200">New</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Create a New Project
          </h1>
          <p className="text-xs text-neutral-400">
            Import a Git repository and configure zero-downtime blue/green deployment slots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:text-white text-xs h-8"
            onClick={() => navigate("/projects")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-project-form"
            size="sm"
            disabled={submitting}
            className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs h-8"
          >
            {submitting ? "Initializing..." : "Create & Deploy"}
          </Button>
        </div>
      </div>

      <form id="create-project-form" onSubmit={(e) => void onSubmit(e)} className="space-y-6">
        {/* Section 1: Import Git Repository */}
        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-white">Import Git Repository</h3>
              <p className="mt-1 text-xs text-neutral-400">
                Select a GitHub repository to enable automated webhook triggers on git push.
              </p>
            </div>

            {ghLoading ? (
              <div className="rounded-lg border border-neutral-800 bg-black/40 p-8 text-center text-xs text-neutral-500">
                Loading GitHub integration status...
              </div>
            ) : ghConnected ? (
              <Tabs
                value={ghSource}
                onValueChange={(v) => {
                  setGhSource(v as "github" | "manual");
                  if (v === "manual") {
                    setSelectedGithubRepo(null);
                    setBranchNames([]);
                  }
                }}
                className="space-y-4"
              >
                <TabsList className="flex h-auto w-full justify-start gap-6 rounded-none border-b border-neutral-800 bg-transparent p-0">
                  <TabsTrigger
                    value="github"
                    className="rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-2 text-xs font-medium text-neutral-400 transition-colors data-[state=active]:border-white data-[state=active]:text-white hover:text-neutral-200"
                  >
                    GitHub App
                  </TabsTrigger>
                  <TabsTrigger
                    value="manual"
                    className="rounded-none border-b-2 border-transparent bg-transparent pb-3 pt-2 text-xs font-medium text-neutral-400 transition-colors data-[state=active]:border-white data-[state=active]:text-white hover:text-neutral-200"
                  >
                    Manual Git URL
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="github" className="space-y-4 pt-2">
                  {ghInstallations.length > 1 ? (
                    <div className="space-y-1.5">
                      <label htmlFor="cp-gh-install" className="text-xs font-medium text-neutral-300">
                        GitHub Organization / Account
                      </label>
                      <select
                        id="cp-gh-install"
                        className={selectClass}
                        value={selectedInstallationId ?? ""}
                        onChange={(e) => {
                          setSelectedInstallationId(e.target.value || null);
                          setSelectedGithubRepo(null);
                          setRepoUrl("");
                          setBranchNames([]);
                        }}
                      >
                        {ghInstallations.map((i) => (
                          <option key={i.installationId} value={i.installationId}>
                            {i.githubAccountLogin} ({i.githubAccountType})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-neutral-300">Select Repository</span>
                    <GithubRepoPicker
                      installationId={selectedInstallationId}
                      selectedFullName={selectedGithubRepo?.fullName ?? null}
                      onRepoSelect={handleRepoPick}
                    />
                  </div>

                  <div className="space-y-1.5 max-w-md">
                    <label htmlFor="cp-branch-gh" className="text-xs font-medium text-neutral-300">
                      Target Production Branch
                    </label>
                    {branchesLoading ? (
                      <p className="text-xs text-neutral-500 font-mono">Fetching repository branches...</p>
                    ) : branchNames.length > 0 ? (
                      <select
                        id="cp-branch-gh"
                        className={selectClass}
                        value={branchNames.includes(branch) ? branch : branchNames[0]}
                        onChange={(e) => setBranch(e.target.value)}
                      >
                        {branchNames.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id="cp-branch-gh"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder={selectedGithubRepo ? "main" : "Select a repository first"}
                        disabled={!selectedGithubRepo}
                        className="font-mono text-xs bg-black border-neutral-800 text-white"
                      />
                    )}
                    <p className="text-[11px] text-neutral-500">
                      Pushes to this branch trigger an atomic blue-green deployment.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="manual" className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label htmlFor="cp-repo-manual" className="text-xs font-medium text-neutral-300">
                      Git Clone URL
                    </label>
                    <Input
                      id="cp-repo-manual"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/organization/repository.git"
                      autoComplete="off"
                      className="font-mono text-xs bg-black border-neutral-800 text-white"
                      required={ghSource === "manual"}
                    />
                  </div>
                  <div className="space-y-1.5 max-w-md">
                    <label htmlFor="cp-branch-manual" className="text-xs font-medium text-neutral-300">
                      Default Branch
                    </label>
                    <Input
                      id="cp-branch-manual"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="main"
                      className="font-mono text-xs bg-black border-neutral-800 text-white"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-xs">
                  <span className="font-semibold text-white">GitHub App Not Connected</span>
                  <p className="mt-1 text-neutral-400">
                    Connect the VersionGate GitHub App to browse and import repositories directly.{" "}
                    <Link to="/integrations" className="text-white underline hover:text-neutral-300">
                      Open Integrations
                    </Link>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cp-repo-manual" className="text-xs font-medium text-neutral-300">
                    Git Clone URL
                  </label>
                  <Input
                    id="cp-repo-manual"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/organization/repository.git"
                    autoComplete="off"
                    className="font-mono text-xs bg-black border-neutral-800 text-white"
                    required
                  />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <label htmlFor="cp-branch-manual" className="text-xs font-medium text-neutral-300">
                    Default Branch
                  </label>
                  <Input
                    id="cp-branch-manual"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="main"
                    className="font-mono text-xs bg-black border-neutral-800 text-white"
                  />
                </div>
              </div>
            )}

            {/* Stack auto-detection badge */}
            {stackDetecting ? (
              <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-black/60 px-3 py-2 text-xs font-mono text-neutral-400">
                <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>Analyzing repository framework and package manifests...</span>
              </div>
            ) : detectedStack ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-white">
                    Framework: {detectedStack.label}
                  </span>
                  <span className="text-neutral-400">
                    (Port {detectedStack.recommendedPort}, Health {detectedStack.recommendedHealthPath})
                  </span>
                </div>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
                  {detectedStack.confidence} confidence
                </span>
              </div>
            ) : null}
          </div>

          <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
            VersionGate clones over HTTPS. Deploy keys or personal access tokens are supported.
          </div>
        </div>

        {/* Section 2: Project & Runtime Configuration */}
        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-white">Configure Project</h3>
              <p className="mt-1 text-xs text-neutral-400">
                Configure execution runtime, build context, and network parameters.
              </p>
            </div>

            {/* Project Slug */}
            <div className="space-y-1.5 max-w-md">
              <label htmlFor="cp-name" className="text-xs font-medium text-neutral-300">
                Project Name
              </label>
              <Input
                id="cp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-cool-app"
                autoComplete="off"
                className="font-mono text-xs bg-black border-neutral-800 text-white"
                required
              />
              <p className="text-[11px] text-neutral-500">
                Lowercase letters, numbers, and hyphens only.
              </p>
            </div>

            {/* Runtime Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">Deployment Runtime</label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setDeploymentType("docker")}
                  className={cn(
                    "flex flex-col gap-2 rounded-lg border p-4 text-left transition-all",
                    deploymentType === "docker"
                      ? "border-white bg-neutral-900/90 text-white shadow-sm"
                      : "border-neutral-800 bg-black/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Docker Container</span>
                    {deploymentType === "docker" ? (
                      <span className="size-2 rounded-full bg-white" />
                    ) : null}
                  </div>
                  <p className="text-xs text-neutral-400">
                    Runs inside isolated Docker containers with automated zero-downtime blue/green port swapping.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeploymentType("pm2")}
                  className={cn(
                    "flex flex-col gap-2 rounded-lg border p-4 text-left transition-all",
                    deploymentType === "pm2"
                      ? "border-white bg-neutral-900/90 text-white shadow-sm"
                      : "border-neutral-800 bg-black/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Host PM2 Process</span>
                    {deploymentType === "pm2" ? (
                      <span className="size-2 rounded-full bg-white" />
                    ) : null}
                  </div>
                  <p className="text-xs text-neutral-400">
                    Direct host execution under PM2 process supervisor. Ideal for Node, Bun, Python, Go, and Rust.
                  </p>
                </button>
              </div>
            </div>

            {/* Toolchain & Context */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="cp-pkg-mgr" className="text-xs font-medium text-neutral-300">
                  Package Manager / Toolchain
                </label>
                <select
                  id="cp-pkg-mgr"
                  className={selectClass}
                  value={packageManager}
                  onChange={(e) => setPackageManager(e.target.value)}
                >
                  <option value="auto">Auto-detect from repo manifests</option>
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
              </div>

              <div className="space-y-1.5">
                <label htmlFor="cp-ctx" className="text-xs font-medium text-neutral-300">
                  Root Directory / Build Context
                </label>
                <Input
                  id="cp-ctx"
                  value={buildContext}
                  onChange={(e) => setBuildContext(e.target.value)}
                  placeholder="."
                  className="font-mono text-xs bg-black border-neutral-800 text-white"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {contextPresets.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      className={cn(
                        "rounded px-2 py-0.5 font-mono text-[10px] transition-colors border",
                        buildContext === p.value
                          ? "border-neutral-700 bg-neutral-800 text-white"
                          : "border-neutral-800/80 bg-neutral-900/60 text-neutral-400 hover:text-white"
                      )}
                      onClick={() => setBuildContext(p.value)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ports and Healthcheck */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="cp-port" className="text-xs font-medium text-neutral-300">
                  Internal Application Port
                </label>
                <Input
                  id="cp-port"
                  inputMode="numeric"
                  value={appPort}
                  onChange={(e) => setAppPort(e.target.value)}
                  placeholder="3000"
                  className="font-mono text-xs bg-black border-neutral-800 text-white"
                  required
                />
                <p className="text-[11px] text-neutral-500">
                  Port your application listens on internally inside container.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="cp-health" className="text-xs font-medium text-neutral-300">
                  Health Check Endpoint
                </label>
                <Input
                  id="cp-health"
                  value={healthPath}
                  onChange={(e) => setHealthPath(e.target.value)}
                  placeholder="/health"
                  className="font-mono text-xs bg-black border-neutral-800 text-white"
                  required
                />
                <p className="text-[11px] text-neutral-500">
                  Endpoint polled to verify ready status before traffic transition.
                </p>
              </div>
            </div>

            {/* Custom Build Commands Collapsible */}
            <div className="rounded-lg border border-neutral-800 bg-black/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">Build and Output Settings</h4>
                  <p className="text-[11px] text-neutral-400">
                    Override default install, build, and start commands.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-neutral-800 text-neutral-300 hover:text-white"
                  onClick={() => setShowAdvancedRuntime((prev) => !prev)}
                >
                  {showAdvancedRuntime ? "Hide Overrides" : "Customize"}
                </Button>
              </div>

              {showAdvancedRuntime ? (
                <div className="space-y-3 pt-3 border-t border-neutral-800/80">
                  <div className="space-y-1.5">
                    <label htmlFor="cp-install-cmd" className="text-xs text-neutral-400">
                      Install Command
                    </label>
                    <Input
                      id="cp-install-cmd"
                      value={installCommand}
                      onChange={(e) => setInstallCommand(e.target.value)}
                      placeholder="e.g. bun install --frozen-lockfile"
                      className="font-mono text-xs bg-black border-neutral-800 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="cp-build-cmd" className="text-xs text-neutral-400">
                      Build Command
                    </label>
                    <Input
                      id="cp-build-cmd"
                      value={buildCommand}
                      onChange={(e) => setBuildCommand(e.target.value)}
                      placeholder="e.g. bun run build"
                      className="font-mono text-xs bg-black border-neutral-800 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="cp-start-cmd" className="text-xs text-neutral-400">
                      Start Command
                    </label>
                    <Input
                      id="cp-start-cmd"
                      value={startCommand}
                      onChange={(e) => setStartCommand(e.target.value)}
                      placeholder="e.g. bun run start"
                      className="font-mono text-xs bg-black border-neutral-800 text-white"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
            VersionGate will allocate two consecutive host ports for blue/green routing.
          </div>
        </div>

        {/* Section 3: Environment Variables */}
        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white">Environment Variables</h3>
              <p className="mt-1 text-xs text-neutral-400">
                Encrypted at rest with AES-256-GCM. Injected automatically at build and runtime.
              </p>
            </div>

            <EnvVariablesEditor
              pairs={envPairs.length > 0 ? envPairs : [{ key: "", value: "" }]}
              onChange={setEnvPairs}
              managedDbs={managedDbs}
              onAttachDatabase={handleAttachDatabase}
              maxHeightClass="max-h-72"
            />
          </div>

          <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
            Secrets are decrypted in-memory only during container startup.
          </div>
        </div>

        {/* Section 4: Scheduled Cron Automation */}
        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Scheduled Automation (Cron)</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  Optional recurring HTTP webhook dispatches or internal runtime shell commands.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEnableInitialCron((prev) => !prev)}
                className={cn(
                  "h-7 text-xs",
                  enableInitialCron
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    : "border-neutral-800 text-neutral-400 hover:text-white"
                )}
              >
                {enableInitialCron ? "Enabled" : "Disabled"}
              </Button>
            </div>

            {enableInitialCron && (
              <div className="space-y-4 pt-3 border-t border-neutral-800">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="cp-cron-name" className="text-xs font-medium text-neutral-300">Task Name</label>
                    <Input
                      id="cp-cron-name"
                      value={cronName}
                      onChange={(e) => setCronName(e.target.value)}
                      placeholder="daily-cache-cleanup"
                      className="font-mono text-xs bg-black border-neutral-800 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="cp-cron-sched" className="text-xs font-medium text-neutral-300">Cron Schedule</label>
                    <Input
                      id="cp-cron-sched"
                      value={cronSchedule}
                      onChange={(e) => setCronSchedule(e.target.value)}
                      placeholder="0 0 * * *"
                      className="font-mono text-xs bg-black border-neutral-800 text-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300">Target Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCronTargetType("HTTP")}
                        className={cn(
                          "rounded-md border py-1.5 text-xs font-medium transition-colors",
                          cronTargetType === "HTTP"
                            ? "border-white bg-neutral-900 text-white"
                            : "border-neutral-800 bg-black text-neutral-400 hover:text-white"
                        )}
                      >
                        HTTP Webhook
                      </button>
                      <button
                        type="button"
                        onClick={() => setCronTargetType("COMMAND")}
                        className={cn(
                          "rounded-md border py-1.5 text-xs font-medium transition-colors",
                          cronTargetType === "COMMAND"
                            ? "border-white bg-neutral-900 text-white"
                            : "border-neutral-800 bg-black text-neutral-400 hover:text-white"
                        )}
                      >
                        Shell Command
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="cp-cron-target" className="text-xs font-medium text-neutral-300">
                      {cronTargetType === "HTTP" ? "Endpoint Path" : "Command"}
                    </label>
                    {cronTargetType === "HTTP" ? (
                      <Input
                        id="cp-cron-target"
                        value={cronHttpPath}
                        onChange={(e) => setCronHttpPath(e.target.value)}
                        placeholder="/api/cron"
                        className="font-mono text-xs bg-black border-neutral-800 text-white"
                      />
                    ) : (
                      <Input
                        id="cp-cron-target"
                        value={cronCommand}
                        onChange={(e) => setCronCommand(e.target.value)}
                        placeholder="bun run cleanup.ts"
                        className="font-mono text-xs bg-black border-neutral-800 text-white"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
            Cron execution history will be recorded under the project's Cron Jobs tab.
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:text-white text-xs h-9 px-4"
            onClick={() => navigate("/projects")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            size="sm"
            className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs h-9 px-5"
          >
            {submitting ? "Initializing project..." : "Create & Deploy Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}
