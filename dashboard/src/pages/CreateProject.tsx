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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GithubRepoPicker } from "@/components/GithubRepoPicker";
import { PageHeader } from "@/components/PageHeader";
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
  "h-9 w-full min-w-0 rounded-lg border border-border bg-background px-3 py-1 text-sm text-foreground outline-none transition-colors",
  "focus-visible:border-neutral-500 focus-visible:ring-1 focus-visible:ring-neutral-500",
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
      const match = repoUrl.trim().match(/github\.com[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/);
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
    toast.success(`[ OK ] Attached ${db.name} as ${key}`);
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
      toast.success("[ OK ] Project created successfully");

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
          toast.success("[ OK ] Initial cron routine scheduled");
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
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <Link to="/projects" className="hover:text-foreground">
          Projects
        </Link>
        <span>/</span>
        <span className="text-foreground">New Project</span>
      </div>

      <PageHeader
        title="Create New Project"
        description="Deploy Docker containers or native PM2 processes with zero-downtime blue/green routing."
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate("/projects")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-project-form"
              size="sm"
              disabled={submitting}
            >
              {submitting ? "Initializing…" : "Create & Initialize Project"}
            </Button>
          </div>
        }
      />

      <form id="create-project-form" onSubmit={(e) => void onSubmit(e)} className="space-y-6">
        {/* Section 1: General Info */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">01 // Project Details</CardTitle>
            <CardDescription>
              Assign a unique identifier for your project. Two dedicated host ports are automatically reserved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1.5">
              <label htmlFor="cp-name" className="text-sm font-medium">
                Project Name (slug)
              </label>
              <Input
                id="cp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. core-api-service"
                autoComplete="off"
                className="max-w-md font-mono text-sm"
                required
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only. Used for routing and container names.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Repository Source */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">02 // Repository &amp; Source</CardTitle>
            <CardDescription>
              Connect to your GitHub repository or enter a custom Git clone URL.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ghLoading ? (
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                Loading GitHub integration status…
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
              >
                <TabsList variant="line" className="w-full justify-start border-b border-border">
                  <TabsTrigger value="github">GitHub App Integration</TabsTrigger>
                  <TabsTrigger value="manual">Manual Git URL</TabsTrigger>
                </TabsList>

                <TabsContent value="github" className="mt-4 space-y-4">
                  {ghInstallations.length > 1 ? (
                    <div className="grid gap-1.5">
                      <label htmlFor="cp-gh-install" className="text-sm font-medium">
                        GitHub Installation
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

                  <div className="grid gap-1.5">
                    <span className="text-sm font-medium">Select Repository</span>
                    <GithubRepoPicker
                      installationId={selectedInstallationId}
                      selectedFullName={selectedGithubRepo?.fullName ?? null}
                      onRepoSelect={handleRepoPick}
                    />
                  </div>

                  <div className="grid max-w-md gap-1.5">
                    <label htmlFor="cp-branch-gh" className="text-sm font-medium">
                      Deployment Branch
                    </label>
                    {branchesLoading ? (
                      <p className="text-xs text-muted-foreground font-mono">Loading repository branches…</p>
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
                        className="font-mono text-sm"
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      Automatic webhook deploys trigger when pushes occur on this branch.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="manual" className="mt-4 space-y-4">
                  <div className="grid gap-1.5">
                    <label htmlFor="cp-repo-manual" className="text-sm font-medium">
                      Git Repository URL
                    </label>
                    <Input
                      id="cp-repo-manual"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/organization/repository.git"
                      autoComplete="off"
                      className="font-mono text-sm"
                      required={ghSource === "manual"}
                    />
                  </div>
                  <div className="grid max-w-md gap-1.5">
                    <label htmlFor="cp-branch-manual" className="text-sm font-medium">
                      Default Branch
                    </label>
                    <Input
                      id="cp-branch-manual"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="main"
                      className="font-mono text-sm"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-4">
                <Alert className="border-border bg-muted/20">
                  <AlertTitle className="text-sm">GitHub App Not Connected</AlertTitle>
                  <AlertDescription className="text-xs">
                    Install the VersionGate GitHub App to browse repositories automatically.&nbsp;
                    <Link to="/dashboard/integrations" className="font-medium text-foreground underline hover:no-underline">
                      Open Integrations
                    </Link>
                  </AlertDescription>
                </Alert>

                <div className="grid gap-1.5">
                  <label htmlFor="cp-repo-manual" className="text-sm font-medium">
                    Git Repository URL
                  </label>
                  <Input
                    id="cp-repo-manual"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/organization/repository.git"
                    autoComplete="off"
                    className="font-mono text-sm"
                    required
                  />
                </div>
                <div className="grid max-w-md gap-1.5">
                  <label htmlFor="cp-branch-manual" className="text-sm font-medium">
                    Default Branch
                  </label>
                  <Input
                    id="cp-branch-manual"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="main"
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {/* Stack auto-detection badge */}
            {stackDetecting ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs font-mono text-muted-foreground">
                <span className="font-semibold text-sky-400">[ SCANNING STACK ]</span>
                <span>Inspecting repository structure and package manifests…</span>
              </div>
            ) : detectedStack ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                    [ STACK: {detectedStack.label.toUpperCase()} ]
                  </span>
                  <span className="text-muted-foreground">
                    Recommended port: {detectedStack.recommendedPort} // health: {detectedStack.recommendedHealthPath}
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase text-emerald-400/80">
                  {detectedStack.confidence} confidence
                </span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Section 3: Runtime & Framework Architecture */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">03 // Runtime &amp; Framework Engine</CardTitle>
            <CardDescription>
              Choose between containerized Docker execution or bare-metal PM2 process supervision.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Engine Selection Tiles */}
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeploymentType("docker")}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors",
                  deploymentType === "docker"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border bg-muted/10 hover:bg-muted/20"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    [ DOCKER CONTAINER ]
                  </span>
                  {deploymentType === "docker" ? (
                    <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                      SELECTED
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  Runs inside an isolated container with zero-downtime blue/green port swapping.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDeploymentType("pm2")}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors",
                  deploymentType === "pm2"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border bg-muted/10 hover:bg-muted/20"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    [ HOST PM2 PROCESS ]
                  </span>
                  {deploymentType === "pm2" ? (
                    <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                      SELECTED
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  Direct host execution under PM2 process supervisor. Ideal for Node, Python, Go, and Rust.
                </p>
              </button>
            </div>

            {/* Package Manager & Paths */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="cp-pkg-mgr" className="text-sm font-medium">
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
                <p className="text-xs text-muted-foreground">
                  Toolchain used to install dependencies and run build scripts.
                </p>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="cp-ctx" className="text-sm font-medium">
                  Build Context Directory
                </label>
                <Input
                  id="cp-ctx"
                  value={buildContext}
                  onChange={(e) => setBuildContext(e.target.value)}
                  placeholder="."
                  className="font-mono text-sm"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {contextPresets.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      className={cn(
                        "rounded border px-2 py-0.5 font-mono text-[10px] transition-colors",
                        buildContext === p.value
                          ? "border-primary bg-primary text-primary-foreground font-semibold"
                          : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
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
              <div className="grid gap-1.5">
                <label htmlFor="cp-port" className="text-sm font-medium">
                  Internal Application Port
                </label>
                <Input
                  id="cp-port"
                  inputMode="numeric"
                  value={appPort}
                  onChange={(e) => setAppPort(e.target.value)}
                  placeholder="3000"
                  className="font-mono text-sm"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Port your application listens on internally (e.g. 3000, 8080).
                </p>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="cp-health" className="text-sm font-medium">
                  Health Check Endpoint
                </label>
                <Input
                  id="cp-health"
                  value={healthPath}
                  onChange={(e) => setHealthPath(e.target.value)}
                  placeholder="/health"
                  className="font-mono text-sm"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  HTTP endpoint checked before switching blue/green traffic.
                </p>
              </div>
            </div>

            {/* Custom Build Commands Collapsible */}
            <div className="space-y-3 rounded-lg border border-border/80 bg-muted/15 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono font-semibold uppercase text-foreground">
                    Custom Script Overrides
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Override default install, build, and start commands for bespoke setups.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 font-mono text-xs"
                  onClick={() => setShowAdvancedRuntime((prev) => !prev)}
                >
                  {showAdvancedRuntime ? "[ HIDE COMMANDS ]" : "[ CONFIGURE COMMANDS ]"}
                </Button>
              </div>

              {showAdvancedRuntime ? (
                <div className="space-y-3 pt-2">
                  <div className="grid gap-1.5">
                    <label htmlFor="cp-install-cmd" className="font-mono text-xs font-medium text-muted-foreground">
                      Custom Install Command (Optional)
                    </label>
                    <Input
                      id="cp-install-cmd"
                      value={installCommand}
                      onChange={(e) => setInstallCommand(e.target.value)}
                      placeholder="e.g. bun install --frozen-lockfile"
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label htmlFor="cp-build-cmd" className="font-mono text-xs font-medium text-muted-foreground">
                      Custom Build Command (Optional)
                    </label>
                    <Input
                      id="cp-build-cmd"
                      value={buildCommand}
                      onChange={(e) => setBuildCommand(e.target.value)}
                      placeholder="e.g. bun run build or cargo build --release"
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label htmlFor="cp-start-cmd" className="font-mono text-xs font-medium text-muted-foreground">
                      Custom Start Command (Optional)
                    </label>
                    <Input
                      id="cp-start-cmd"
                      value={startCommand}
                      onChange={(e) => setStartCommand(e.target.value)}
                      placeholder="e.g. bun run start or uvicorn main:app --host 0.0.0.0 --port $PORT"
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Environment Variables */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">04 // Environment Variables</CardTitle>
            <CardDescription>
              Encrypted at rest with AES-256-GCM. Injected automatically into the deployment runtime.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnvVariablesEditor
              pairs={envPairs.length > 0 ? envPairs : [{ key: "", value: "" }]}
              onChange={setEnvPairs}
              managedDbs={managedDbs}
              onAttachDatabase={handleAttachDatabase}
              maxHeightClass="max-h-72"
            />
          </CardContent>
        </Card>

        {/* Section 5: Scheduled Cron Automation */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">05 // Scheduled Cron Automation</CardTitle>
                <CardDescription>
                  Optional recurring HTTP webhook dispatches or in-container command jobs.
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setEnableInitialCron((prev) => !prev)}
                className={`border px-3 py-1 font-mono text-xs font-semibold uppercase transition-colors ${
                  enableInitialCron
                    ? "border-emerald-500 bg-emerald-950/40 text-emerald-400"
                    : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
                }`}
              >
                {enableInitialCron ? "[ ENABLED ]" : "[ DISABLED ]"}
              </button>
            </div>
          </CardHeader>
          {enableInitialCron && (
            <CardContent className="space-y-4 pt-2 font-mono text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="cp-cron-name" className="text-neutral-300">Task Name</label>
                  <Input
                    id="cp-cron-name"
                    value={cronName}
                    onChange={(e) => setCronName(e.target.value)}
                    placeholder="e.g. daily-cache-warmup"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="cp-cron-sched" className="text-neutral-300">Cron Schedule</label>
                  <Input
                    id="cp-cron-sched"
                    value={cronSchedule}
                    onChange={(e) => setCronSchedule(e.target.value)}
                    placeholder="0 0 * * *"
                    className="font-mono text-xs text-emerald-400"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-neutral-300">Target Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCronTargetType("HTTP")}
                      className={`border px-2 py-1.5 text-center text-xs uppercase ${
                        cronTargetType === "HTTP"
                          ? "border-blue-500 bg-blue-950/40 text-blue-400 font-semibold"
                          : "border-neutral-800 bg-neutral-900 text-neutral-400"
                      }`}
                    >
                      HTTP Webhook
                    </button>
                    <button
                      type="button"
                      onClick={() => setCronTargetType("COMMAND")}
                      className={`border px-2 py-1.5 text-center text-xs uppercase ${
                        cronTargetType === "COMMAND"
                          ? "border-purple-500 bg-purple-950/40 text-purple-400 font-semibold"
                          : "border-neutral-800 bg-neutral-900 text-neutral-400"
                      }`}
                    >
                      Shell Command
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cp-cron-target" className="text-neutral-300">
                    {cronTargetType === "HTTP" ? "Endpoint Path (e.g. /api/cron)" : "Command (Inside runtime)"}
                  </label>
                  {cronTargetType === "HTTP" ? (
                    <Input
                      id="cp-cron-target"
                      value={cronHttpPath}
                      onChange={(e) => setCronHttpPath(e.target.value)}
                      placeholder="/api/cron"
                      className="font-mono text-xs"
                    />
                  ) : (
                    <Input
                      id="cp-cron-target"
                      value={cronCommand}
                      onChange={(e) => setCronCommand(e.target.value)}
                      placeholder="bun run cleanup.ts"
                      className="font-mono text-xs"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/projects")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Initializing project…" : "Create & Initialize Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}
