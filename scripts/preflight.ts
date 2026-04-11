#!/usr/bin/env bun
/**
 * Host preflight — same checks as GET /api/v1/system/preflight.
 * Run from repo root: `bun run preflight`
 */
import { runPreflightChecks } from "../src/services/preflight.service";

const pretty = process.argv.includes("--json") === false;

const report = await runPreflightChecks();

if (pretty) {
  console.log(`VersionGate preflight — ${report.ok ? "OK" : "FAILED"} (${report.checkedAt})\n`);
  for (const c of report.checks) {
    const mark = c.ok ? "[ok]" : c.severity === "required" ? "[NO]" : "[!]";
    const sev = c.severity === "required" ? "required" : c.severity === "recommended" ? "recommended" : "info";
    console.log(`${mark} [${sev}] ${c.label}: ${c.message}`);
  }
  console.log("");
} else {
  console.log(JSON.stringify(report, null, 2));
}

process.exit(report.ok ? 0 : 1);
