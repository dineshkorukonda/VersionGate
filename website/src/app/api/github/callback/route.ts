import { NextRequest, NextResponse } from "next/server";
import { parseRelayInstallState } from "@/lib/github-install-state";
import { isValidInstanceUrl, setInstallMapping } from "@/lib/install-registry";

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

/**
 * GitHub App install relay for self-hosted VersionGate instances.
 * GitHub App callback URL (fixed): https://versiongate.tech/api/github/callback
 *
 * Persists installation_id → instanceUrl in Redis so push webhooks can fan out.
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

  if (installationId && /^\d+$/.test(installationId)) {
    try {
      await setInstallMapping(installationId, {
        instanceUrl: decoded.instanceUrl,
        userId: decoded.userId,
      });
    } catch (err) {
      console.error("[github/callback] failed to persist install mapping", err);
      // Still redirect — engine register API is a backup
    }
  }

  const target = new URL("/api/auth/github/callback", decoded.instanceUrl.trim().replace(/\/+$/, ""));
  target.searchParams.set("state", state);
  if (installationId !== null) target.searchParams.set("installation_id", installationId);
  if (setupAction !== null) target.searchParams.set("setup_action", setupAction);

  return NextResponse.redirect(target.toString(), 302);
}
