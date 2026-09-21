export type DeploymentStatus =
  | "PENDING"
  | "DEPLOYING"
  | "ACTIVE"
  | "FAILED"
  | "ROLLED_BACK";

export interface Project {
  id: string;
  name: string;
  repoUrl: string;
  branch: string;
  localPath: string;
  buildContext: string;
  appPort: number;
  healthPath: string;
  basePort: number;
  webhookSecret?: string | null;
  deploymentType?: "docker" | "pm2";
  packageManager?: string;
  installCommand?: string | null;
  buildCommand?: string | null;
  startCommand?: string | null;
  isAdopted?: boolean;
  env: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Deployment {
  id: string;
  version: number;
  imageTag: string;
  containerName: string;
  port: number;
  color: string;
  status: DeploymentStatus;
  errorMessage?: string | null;
  /** Derived from the parent environment for dashboard filtering */
  projectId: string;
  projectName?: string | null;
  environmentId?: string;
  environmentName?: string | null;
  environmentBranch?: string | null;
  promotedFromId?: string | null;
  jobId?: string | null;
  commitSha?: string | null;
  commitMessage?: string | null;
  commitAuthor?: string | null;
  commitBranch?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCommit {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  isDeployed: boolean;
  isProduction: boolean;
  activeDeployment: Deployment | null;
  latestDeployment: Deployment | null;
  allDeployments: Deployment[];
}

export interface ProjectCommitsResponse {
  projectId: string;
  projectName: string;
  branch: string;
  commits: ProjectCommit[];
}

export interface EnvironmentRow {
  id: string;
  name: string;
  projectId: string;
  branch: string;
  serverHost: string;
  basePort: number;
  appPort: number;
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Response from `GET /projects/:id/environments` (chain UI + active slot). */
export interface EnvironmentSummary {
  id: string;
  name: string;
  chainOrder: number;
  branch: string;
  basePort: number;
  appPort: number;
  env?: Record<string, string>;
  activeDeployment: {
    id: string;
    version: number;
    imageTag: string;
    status: DeploymentStatus;
    port: number;
    color: string;
  } | null;
}

export interface JobRecord {
  id: string;
  type: string;
  status: string;
  projectId: string;
  deploymentId: string | null;
  payload: unknown;
  result: unknown;
  logs: string[];
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Present on `GET /jobs` list */
  project?: { id: string; name: string };
}

export interface ServerStats {
  status: string;
  cpu_percent: number;
  memory_percent: number;
  memory_used: number;
  memory_total: number;
  disk_percent: number;
  disk_used: number;
  disk_total: number;
  network_sent: number;
  network_recv: number;
  /** Bytes per second since last collector sample (when available). */
  network_sent_rate?: number;
  network_recv_rate?: number;
  uptime: number;
  load_avg: [number, number, number];
  process_count: number;
  timestamp: string;
}

export interface ProjectSummaryItem extends Project {
  domains?: Array<{ id: string; hostname: string; sslStatus: string; environmentName: string }>;
  latestJob?: JobRecord | null;
}

export type ProjectDomainSslStatus = "pending_dns" | "http" | "issued" | "failed";

export interface ProjectDomain {
  id: string;
  hostname: string;
  environmentName: string;
  sslStatus: ProjectDomainSslStatus;
  lastError: string | null;
  dnsA: string[];
  dnsOk: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DomainDnsVerificationResult {
  hostname: string;
  expectedIpv4: string | null;
  records: {
    a: string[];
    cname: string[];
  };
  status: "MATCH" | "MISMATCH" | "NOT_RESOLVED";
  message: string;
  canIssueSsl: boolean;
}

export interface ProjectAnalytics {
  projectId: string;
  totalHits: number;
  status2xx: number;
  status3xx: number;
  status4xx: number;
  status5xx: number;
  avgLatencyMs: number;
  recentHitsByHour: { hour: string; count: number }[];
}

export type PreflightSeverity = "required" | "recommended" | "informational";

export interface PreflightCheck {
  id: string;
  label: string;
  severity: PreflightSeverity;
  ok: boolean;
  message: string;
  detail?: string;
}

export interface PreflightReport {
  ok: boolean;
  checkedAt: string;
  checks: PreflightCheck[];
}

export interface DashboardAlert {
  type: string;
  message: string;
  severity: "low" | "medium" | "high";
}

export interface SystemDashboardResponse {
  status: string;
  system_stats: ServerStats;
  connections: { local_address: string; remote_address: string; state: string }[];
  listening_ports: { address: string; port: number }[];
  top_processes: { pid: number; name: string; cpu_percent: number; memory_percent: number }[];
  alerts: DashboardAlert[];
}

export interface EngineHealthReport {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  uptime: number;
  database: { connected: boolean; latencyMs: number };
  redis: { connected: boolean; available: boolean };
  containers: { totalActive: number; healthyCount: number; failedCount: number };
  system: { cpuPercent: number; memoryPercent: number; diskPercent: number };
  alerts: Array<{ id: string; type: string; message: string; severity: "low" | "medium" | "high" }>;
}

export interface SetupStatus {
  configured: boolean;
  dbConnected: boolean;
  /** True when `.env` exists but this process has not loaded DATABASE_URL — restart the API. */
  needsRestart: boolean;
}

export interface AuthStatus {
  databaseReady: boolean;
  hasUsers: boolean;
  authenticated: boolean;
  user?: { id: string; email: string };
}

export interface ApiTokenItem {
  id: string;
  name: string;
  tokenPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface InstanceSettings {
  engineVersion: string;
  nodeEnv: string;
  apiPort: number;
  dockerNetwork: string;
  projectsRootPath: string;
  nginxConfigPath: string;
  /** @deprecated Use drizzleSchemaSync — kept for older API responses */
  prismaSchemaSync?: "migrate" | "push";
  drizzleSchemaSync: "migrate" | "push";
  inProcessWorker: boolean;
  databaseUrlInEnvFile: boolean;
  databaseUrlLoaded: boolean;
  databaseReachable: boolean;
  needsRestart: boolean;
  encryptionKeyConfigured: boolean;
  geminiConfigured: boolean;
  /** Public hostname or IPv4 from `.env` (`PUBLIC_DOMAIN`). */
  publicDomain: string;
  /** URL path prefix where the app is exposed (`PUBLIC_BASE_PATH`, e.g. `/` or `/versiongate`). */
  publicBasePath: string;
  /** Let's Encrypt contact email from `.env` (`CERTBOT_EMAIL`). */
  certbotEmail: string;
  selfUpdateConfigured: boolean;
  selfUpdateGitBranch: string;
  selfUpdatePollMs: number;
  selfUpdateAutoApply: boolean;
  excludedPorts?: string;
}

export interface SelfUpdateGitStatus {
  branch: string;
  isGitRepo: boolean;
  currentCommit: string;
  remoteCommit: string | null;
  behind: boolean;
  message?: string;
}

export interface SelfUpdateSettingsResponse {
  configured: boolean;
  branch: string;
  pollMs: number;
  autoApply: boolean;
  git: SelfUpdateGitStatus | null;
}

export interface SelfUpdateProgress {
  status: "idle" | "running" | "complete" | "failed";
  startedAt: string | null;
  finishedAt: string | null;
  currentStep: string | null;
  steps: string[];
  error?: string;
}

export interface GithubInstallationSummary {
  installationId: string;
  githubAccountLogin: string;
  githubAccountType: string;
  createdAt: string;
}

export interface GithubIntegrationStatus {
  connected: boolean;
  installations: GithubInstallationSummary[];
  installation?: {
    installationId: string;
    githubAccountLogin: string;
    githubAccountType: string;
    avatarUrl: string | null;
    createdAt: string;
  };
}

export interface GithubRepoRow {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  defaultBranch: string | null;
  cloneUrl: string;
  htmlUrl: string;
  language: string | null;
  updatedAt: string | null;
  pushedAt: string | null;
}

export interface GithubReposResponse {
  installationId: string;
  totalCount: number;
  repositories: GithubRepoRow[];
}

export interface GithubBranchRow {
  name: string;
  sha?: string;
}

export interface GithubBranchesResponse {
  installationId: string;
  branches: GithubBranchRow[];
}

export interface GithubInstallationGateResponse {
  installation: GithubInstallationSummary | null;
  installations: GithubInstallationSummary[];
}

export interface DiagnosticCheckpoint {
  id: "database" | "config" | "relay" | "repositories";
  title: string;
  status: "ok" | "fail" | "warn" | "skipped";
  message: string;
  latencyMs?: number;
  details?: Record<string, unknown>;
}

export interface GithubDiagnosticsResponse {
  healthy: boolean;
  mode: "direct" | "relay";
  timestamp: string;
  installationId: string | null;
  checkpoints: DiagnosticCheckpoint[];
  recommendations: string[];
}

export interface RepoStackDetection {
  detected: boolean;
  stack: string;
  label: string;
  framework: string;
  recommendedPort: number;
  recommendedHealthPath: string;
  recommendedBuildContext: string;
  confidence: "high" | "medium" | "low";
  suggestions: { label: string; value: string }[];
}

export interface ManagedDatabase {
  id: string;
  name: string;
  engine: "postgres" | "mysql" | "redis" | "mongodb";
  version: string;
  containerName: string;
  hostPort: number;
  internalPort: number;
  databaseName?: string | null;
  username?: string | null;
  status: "PROVISIONING" | "RUNNING" | "STOPPED" | "FAILED";
  volumeName: string;
  linkedProjectId?: string | null;
  memoryLimit?: string | null;
  cpuLimit?: string | null;
  running?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedDatabaseDetails extends ManagedDatabase {
  passwordDecrypted: string;
  connectionUriLocal: string;
  connectionUriDocker: string;
}

export interface CreateManagedDatabaseInput {
  name: string;
  engine: "postgres" | "mysql" | "redis" | "mongodb";
  version?: string;
  databaseName?: string;
  username?: string;
  password?: string;
  linkedProjectId?: string;
  memoryLimit?: string;
  cpuLimit?: string;
}

export interface DatabaseSchemaTable {
  name: string;
  type?: string;
  rowCount?: number;
}

export interface DatabaseSchemaResult {
  engine: "postgres" | "mysql" | "redis" | "mongodb";
  databaseName: string;
  tables: DatabaseSchemaTable[];
}

export interface DatabaseQueryResult {
  columns: string[];
  rows: string[][];
  rowCount: number;
  executionTimeMs: number;
  rawOutput: string;
}

export interface DiscoveredDeployment {
  id: string;
  name: string;
  serviceType: "pm2" | "docker";
  status: "online" | "running" | "stopped";
  port?: number;
  containerName?: string;
  imageTag?: string;
  pm2Name?: string;
  localPath?: string;
  buildContext?: string;
  repoUrl?: string;
  branch?: string;
  detectedDomains?: string[];
  alreadyAdopted: boolean;
}

export interface AdoptDeploymentInput {
  name: string;
  serviceType: "pm2" | "docker";
  port: number;
  repoUrl?: string;
  branch?: string;
  localPath?: string;
  buildContext?: string;
  containerName?: string;
  pm2Name?: string;
  imageTag?: string;
  customDomains?: string[];
}

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  targetType: "HTTP" | "COMMAND";
  httpMethod?: "GET" | "POST" | "PUT";
  httpPath?: string | null;
  httpHeaders?: Record<string, string> | null;
  command?: string | null;
  timeoutSeconds: number;
  enabled: boolean;
  projectId?: string | null;
  environmentId?: string | null;
  lastRunAt?: string | null;
  lastStatus?: "SUCCESS" | "FAILED" | "TIMEOUT" | "RUNNING" | null;
  lastDurationMs?: number | null;
  lastOutput?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CronJobLog {
  id: string;
  cronJobId: string;
  status: "SUCCESS" | "FAILED" | "TIMEOUT";
  durationMs: number;
  output?: string | null;
  triggeredBy: "SCHEDULE" | "MANUAL";
  createdAt: string;
}

export interface CreateCronJobInput {
  name: string;
  schedule: string;
  targetType?: "HTTP" | "COMMAND";
  httpMethod?: "GET" | "POST" | "PUT";
  httpPath?: string;
  httpHeaders?: Record<string, string>;
  command?: string;
  timeoutSeconds?: number;
  enabled?: boolean;
  projectId?: string;
  environmentId?: string;
}

export interface UpdateCronJobInput {
  name?: string;
  schedule?: string;
  targetType?: "HTTP" | "COMMAND";
  httpMethod?: "GET" | "POST" | "PUT";
  httpPath?: string;
  httpHeaders?: Record<string, string>;
  command?: string;
  timeoutSeconds?: number;
  enabled?: boolean;
}

export interface ServerCapacitySpecs {
  hardware: {
    cpuCores: number;
    cpuModel: string;
    totalMemoryBytes: number;
    totalMemoryMb: number;
    totalMemoryGb: number;
    freeMemoryMb: number;
    loadAverage: [number, number, number];
    platform: string;
    arch: string;
  };
  recommendations: {
    database: {
      memoryLimit: string;
      cpuLimit: string;
      memoryPresetOptions: { label: string; value: string; isRecommended?: boolean }[];
      cpuPresetOptions: { label: string; value: string; isRecommended?: boolean }[];
    };
    cron: {
      maxConcurrentJobs: number;
      defaultTimeoutSeconds: number;
      recommendedTimeoutCeiling: number;
    };
    container: {
      maxRecommendedRunningContainers: number;
      defaultMemoryLimit: string;
    };
  };
}

export interface SubsystemStatus {
  id: string;
  name: string;
  category: "core" | "runtime" | "network" | "integration";
  status: "operational" | "degraded" | "down" | "unconfigured";
  latencyMs?: number;
  details?: Record<string, unknown>;
  description: string;
}

export interface ApplicationStatus {
  projectId: string;
  projectName: string;
  serviceType: "pm2" | "docker";
  branch: string;
  repoUrl: string;
  localPath?: string | null;
  activePort?: number | null;
  healthPath: string;
  status: "healthy" | "degraded" | "error" | "stopped" | "uninitialized";
  healthLatencyMs?: number;
  activeDeployment?: {
    id: string;
    version: number;
    color: string;
    status: string;
    containerName: string;
    commitSha?: string | null;
    commitMessage?: string | null;
    commitAuthor?: string | null;
    updatedAt: string;
  } | null;
  latestCommit?: {
    sha: string;
    message: string;
    author: string;
    date: string;
  } | null;
  isCommitSynced: boolean;
  autoDeployEnabled: boolean;
  webhookConfigured: boolean;
  metrics?: {
    cpuPercent?: number;
    memoryBytes?: number;
    uptime?: number;
  };
  diagnosticMessage: string;
}

export interface ComprehensiveStatusReport {
  timestamp: string;
  overallStatus: "operational" | "degraded" | "down";
  uptime: number;
  subsystems: SubsystemStatus[];
  applications: ApplicationStatus[];
  summary: {
    totalSubsystems: number;
    operationalSubsystems: number;
    totalApplications: number;
    healthyApplications: number;
    outOfSyncApplications: number;
    autoDeployActiveCount: number;
  };
  systemTelemetry: {
    cpuPercent: number;
    memoryPercent: number;
    memoryUsed: number;
    memoryTotal: number;
    diskPercent: number;
    diskUsed: number;
    diskTotal: number;
    loadAvg: number[];
    uptime: number;
  };
}
