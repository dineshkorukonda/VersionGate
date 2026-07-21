import { NextRequest, NextResponse } from "next/server";
import { parseRelayInstallState } from "@/lib/github-install-state";

function badRequest(message: string) {
  const body = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>GitHub relay error</title></head><body><p>${escapeHtml(message)}</p></body></html>`;
  return new NextResponse(body, {
    status: 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isValidInstanceUrl(instanceUrl: string): boolean {
  const t = instanceUrl.trim();
  if (!t) return false;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    if (!u.hostname) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * GitHub App install relay for self-hosted VersionGate instances.
 * GitHub App callback URL (fixed): https://versiongate.tech/api/github/callback
 */
export async function GET(request: NextRequest) {
  const secret = process.env.RELAY_SECRET;
  if (!secret) {
    return new NextResponse("RELAY_SECRET is not configured.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const installationId = request.nextUrl.searchParams.get("installation_id");
  const setupAction = request.nextUrl.searchParams.get("setup_action");
  const state = request.nextUrl.searchParams.get("state");

  if (!state) {
    return badRequest("Missing state parameter.");
  }

  const decoded = parseRelayInstallState(state, secret);
  if (!decoded) {
    return badRequest("Invalid or tampered state.");
  }

  if (!isValidInstanceUrl(decoded.instanceUrl)) {
    return badRequest("Invalid instance URL in state.");
  }

  const target = new URL("/api/auth/github/callback", decoded.instanceUrl.trim().replace(/\/+$/, ""));
  target.searchParams.set("state", state);
  if (installationId !== null) target.searchParams.set("installation_id", installationId);
  if (setupAction !== null) target.searchParams.set("setup_action", setupAction);

  return NextResponse.redirect(target.toString(), 302);
}
