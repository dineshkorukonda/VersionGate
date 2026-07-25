#!/usr/bin/env bun
/**
 * VersionGate Industry-Standard Setup & Verification Wizard
 *
 * Performs host system preflight, suggests OS-specific installation steps,
 * provisions environment configuration, runs Drizzle database migrations,
 * initializes Docker networks, and builds dashboard static assets.
 *
 * Usage:
 *   bun run setup
 */
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";
import { execSync } from "child_process";
import { runPreflightChecks } from "../src/services/preflight.service";
import { runDrizzleSchemaSync } from "../src/utils/drizzle-schema-sync";
import { projectRoot, envFilePath } from "../src/utils/paths";

function printHeader() {
  console.log("\n=======================================================");
  console.log("  🚀 VersionGate Setup & Preflight Inspection Wizard");
  console.log("=======================================================\n");
}

function detectOS(): { name: string; distro?: string } {
  const platform = process.platform;
  if (platform === "darwin") return { name: "macOS" };
  if (platform === "linux") {
    try {
      if (existsSync("/etc/os-release")) {
        const release = readFileSync("/etc/os-release", "utf8");
        if (release.toLowerCase().includes("ubuntu")) return { name: "Linux", distro: "ubuntu" };
        if (release.toLowerCase().includes("debian")) return { name: "Linux", distro: "debian" };
        if (release.toLowerCase().includes("fedora")) return { name: "Linux", distro: "fedora" };
        if (release.toLowerCase().includes("alpine")) return { name: "Linux", distro: "alpine" };
      }
    } catch {}
    return { name: "Linux", distro: "generic" };
  }
  return { name: platform };
}

function suggestInstallCommands(missing: string[], os: { name: string; distro?: string }) {
  console.log("\n-------------------------------------------------------");
  console.log(" 💡 OS-Specific Dependency Installation Suggestions");
  console.log("-------------------------------------------------------\n");

  if (os.name === "macOS") {
    console.log("Run the following Homebrew command to install missing dependencies:\n");
    console.log("  brew install postgresql@16 redis nginx certbot\n");
    console.log("To start services on macOS:\n  brew services start postgresql@16\n  brew services start redis\n");
  } else if (os.name === "Linux" && (os.distro === "ubuntu" || os.distro === "debian")) {
    console.log("Run the following APT command to install missing dependencies in one shot:\n");
    console.log("  sudo apt update && sudo apt install -y git curl postgresql postgresql-contrib redis-server nginx certbot\n");
    console.log("To start services on Ubuntu/Debian:\n  sudo systemctl enable --now postgresql redis-server\n  sudo usermod -aG docker $USER\n");
  } else if (os.name === "Linux" && os.distro === "fedora") {
    console.log("Run the following DNF command to install missing dependencies:\n");
    console.log("  sudo dnf install -y git curl postgresql-server redis nginx certbot\n");
  } else {
    console.log("Please install the missing tools listed above using your system package manager.\n");
  }
}

async function ensureDotEnv(): Promise<boolean> {
  console.log("📦 1. Provisioning Environment Configuration (.env)...");
  if (!existsSync(envFilePath)) {
    const examplePath = join(projectRoot, ".env.example");
    let content = "";
    if (existsSync(examplePath)) {
      content = readFileSync(examplePath, "utf8");
    } else {
      content = `PORT=9090
LOG_LEVEL=info
DATABASE_URL=postgres://versiongate:versiongate@127.0.0.1:5432/versiongate
REDIS_URL=redis://127.0.0.1:6379
ENCRYPTION_KEY=${randomBytes(32).toString("hex")}
`;
    }

    if (!content.includes("ENCRYPTION_KEY=") || content.includes("ENCRYPTION_KEY=\n")) {
      const key = randomBytes(32).toString("hex");
      content += `\nENCRYPTION_KEY=${key}\n`;
    }

    writeFileSync(envFilePath, content, "utf8");
    console.log("   ✅ Created .env file with secure ENCRYPTION_KEY.");
  } else {
    console.log("   ✅ Existing .env file found.");
  }
  return true;
}

function ensureDockerNetwork() {
  console.log("\n🐳 2. Initializing Docker Network (versiongate-net)...");
  try {
    const networks = execSync("docker network ls --format '{{.Name}}'", { encoding: "utf8" });
    if (!networks.includes("versiongate-net")) {
      execSync("docker network create versiongate-net");
      console.log("   ✅ Docker network 'versiongate-net' created.");
    } else {
      console.log("   ✅ Docker network 'versiongate-net' already exists.");
    }
  } catch (err: any) {
    console.log("   ⚠️  Docker daemon not reachable or network creation skipped.");
  }
}

async function syncDatabaseSchema() {
  console.log("\n🗄️  3. Syncing PostgreSQL Schema via Drizzle ORM...");
  try {
    const result = runDrizzleSchemaSync();
    if (result.ok) {
      console.log(`   ✅ Drizzle schema synchronized (${result.appliedCount} statements executed).`);
    } else {
      console.log(`   ⚠️  Drizzle schema sync completed with warnings: ${result.error}`);
    }
  } catch (err: any) {
    console.log(`   ⚠️  Database sync skipped or DATABASE_URL not ready: ${err.message}`);
  }
}

function buildDashboardAssets() {
  console.log("\n🎨 4. Building Dashboard UI Static Assets...");
  try {
    execSync("bun run build:dashboard", { cwd: projectRoot, stdio: "inherit" });
    console.log("   ✅ Dashboard built successfully to dashboard/out/.");
  } catch (err: any) {
    console.log("   ❌ Dashboard build failed. Run 'cd dashboard && bun run build' to inspect errors.");
  }
}

async function main() {
  printHeader();

  const os = detectOS();
  console.log(`🔍 Detected Operating System: ${os.name}${os.distro ? ` (${os.distro})` : ""}`);

  // Ensure local projects directory exists
  const projectsDir = join(projectRoot, "projects");
  if (!existsSync(projectsDir)) {
    const { mkdirSync } = await import("fs");
    mkdirSync(projectsDir, { recursive: true });
  }

  console.log("\n-------------------------------------------------------");
  console.log(" 🩺 Running System & Host Dependency Preflight Checks");
  console.log("-------------------------------------------------------\n");

  const report = await runPreflightChecks();
  const missing: string[] = [];

  for (const check of report.checks) {
    const symbol = check.ok ? "✅" : check.severity === "required" ? "❌" : "⚠️ ";
    console.log(`${symbol} [${check.severity}] ${check.label}: ${check.message}`);
    if (!check.ok && check.severity === "required") {
      missing.push(check.label);
    }
  }

  if (!report.ok) {
    suggestInstallCommands(missing, os);
    console.log("❌ Setup cannot complete automatically because required dependencies are missing.");
    console.log("   Please install the missing tools above and re-run: bun run setup\n");
    process.exit(1);
  }

  await ensureDotEnv();
  ensureDockerNetwork();
  await syncDatabaseSchema();
  buildDashboardAssets();

  console.log("\n=======================================================");
  console.log("  🎉 Setup Complete! VersionGate is Ready to Run.");
  console.log("=======================================================");
  console.log("\nStart the backend server & background worker:");
  console.log("  bun run dev           (Starts Backend API on port 9090)");
  console.log("  bun run dev:dashboard (Starts Dashboard dev server on port 5173)\n");
}

main().catch((err) => {
  console.error("\n❌ Fatal setup error:", err);
  process.exit(1);
});
