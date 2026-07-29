#!/usr/bin/env bun
/**
 * Unified VersionGate Host Agent CLI (`bun run agent`).
 *
 * Runs system diagnostics, checks prerequisites (Docker, Bun, Git, Nginx, UFW),
 * displays copy-paste remediation commands for missing items, and supports
 * automatic system repair with `--fix`.
 *
 * Usage:
 *   bun run agent
 *   bun run agent --fix
 */
import { runPreflightChecks } from "../src/services/preflight.service";
import { execFileAsync } from "../src/utils/exec";

const shouldFix = process.argv.includes("--fix");

async function execRemediation(cmd: string, args: string[]): Promise<boolean> {
  try {
    console.log(`\n==> Executing Auto-Fix: ${cmd} ${args.join(" ")}`);
    const { stdout, stderr } = await execFileAsync(cmd, args);
    if (stdout) console.log(stdout.trim());
    if (stderr) console.error(stderr.trim());
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`Auto-fix failed for ${cmd}: ${msg}`);
    return false;
  }
}

console.log("============================================================");
console.log(" VersionGate Host Agent // System Audit & Remediation");
console.log("============================================================");

const report = await runPreflightChecks();

console.log(`\nChecked at: ${report.checkedAt}`);
console.log(`Overall Status: ${report.ok ? "[ OK ] Host Ready" : "[ FAILED ] Remediation Required"}\n`);

const missingRemediations: { label: string; command: string }[] = [];

for (const c of report.checks) {
  const mark = c.ok ? "[ OK ]" : c.severity === "required" ? "[ NO ]" : "[ ! ]";
  const sev = c.severity.toUpperCase().padEnd(13);
  console.log(`${mark} ${sev} | ${c.label}: ${c.message}`);

  if (!c.ok) {
    if (c.id === "unzip") {
      missingRemediations.push({ label: "Install unzip", command: "sudo apt install -y unzip" });
    } else if (c.id === "docker_cli" || c.id === "docker_daemon") {
      missingRemediations.push({
        label: "Install Docker Engine",
        command: "curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker $USER",
      });
    } else if (c.id === "docker_network") {
      missingRemediations.push({ label: "Create Docker Network", command: "docker network create versiongate-net" });
    } else if (c.id === "projects_root") {
      missingRemediations.push({
        label: "Create Projects Path",
        command: "sudo mkdir -p /var/versiongate/projects && sudo chown -R $USER:$USER /var/versiongate/projects",
      });
    } else if (c.id === "firewall_ingress") {
      missingRemediations.push({
        label: "Configure UFW Firewall Ports",
        command: "sudo ufw allow 9090/tcp && sudo ufw allow 5173/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp",
      });
    }
  }
}

if (missingRemediations.length > 0) {
  console.log("\n============================================================");
  console.log(" Copy-Paste Remediation Commands for Missing Components:");
  console.log("============================================================");
  for (const rem of missingRemediations) {
    console.log(`\n# ${rem.label}:`);
    console.log(`  ${rem.command}`);
  }

  if (shouldFix) {
    console.log("\n============================================================");
    console.log(" Executing Automatic Host Repair (--fix)...");
    console.log("============================================================");

    for (const rem of missingRemediations) {
      const parts = rem.command.split(" ");
      const cmd = parts[0];
      const args = parts.slice(1);
      await execRemediation(cmd, args);
    }

    console.log("\nRe-running Host Agent Audit after repair...\n");
    const updatedReport = await runPreflightChecks();
    console.log(`Updated Status: ${updatedReport.ok ? "[ OK ] Host Ready" : "[ ! ] Additional Manual Configuration Needed"}`);
  } else {
    console.log("\nTo automatically fix missing host components, run:");
    console.log("  bun run agent --fix");
  }
} else {
  console.log("\n============================================================");
  console.log(" All Host Requirements Satisfied!");
  console.log(" Start VersionGate Engine: bun run dev (or pm2 start ecosystem.config.cjs)");
  console.log(" Open Setup Wizard: http://<your-vm-ip>:9090/setup");
  console.log("============================================================");
}

process.exit(report.ok ? 0 : 1);
