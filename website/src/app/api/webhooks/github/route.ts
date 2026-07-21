import { NextRequest, NextResponse } from "next/server";
import { deleteInstallMapping, getInstallMapping, setInstallMapping } from "@/lib/install-registry";
import { createRelayHopSignature, verifyGithubWebhookSignature } from "@/lib/relay-crypto";

const RELAY_FORWARD_ATTEMPTS = 3;
const RELAY_BACKOFF_MS = [200, 800, 2000];

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function forwardToInstance(
  instanceUrl: string,
  installationId: string,
  rawBody: Buffer,
  githubEvent: string,
  relaySecret: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const target = new URL("/api/webhooks/github/relay", instanceUrl.replace(/\/+$/, ""));
  const hop = createRelayHopSignature(rawBody, installationId, relaySecret);

  for (let i = 0; i < RELAY_FORWARD_ATTEMPTS; i++) {
    try {
      const res = await fetch(target.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-GitHub-Event": githubEvent,
          "X-VG-Installation-Id": installationId,
          "X-VG-Relay-Signature": hop,
        },
        body: new Uint8Array(rawBody),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) return { ok: true, status: res.status };
      if (res.status >= 500 && i < RELAY_FORWARD_ATTEMPTS - 1) {
        await sleep(RELAY_BACKOFF_MS[i] ?? 1000);
        continue;
      }
      return { ok: false, status: res.status, error: await res.text().catch(() => "") };
    } catch (err) {
      if (i < RELAY_FORWARD_ATTEMPTS - 1) {
        await sleep(RELAY_BACKOFF_MS[i] ?? 1000);
        continue;
      }
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
  return { ok: false, error: "exhausted retries" };
}

/**
 * Official VersionGate GitHub App webhook URL:
 *   https://versiongate.tech/api/webhooks/github
 *
 * Verifies GitHub signature, looks up installation → instance, fans out to VPS.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  const relaySecret = process.env.RELAY_SECRET;

  if (!webhookSecret || !relaySecret) {
    return NextResponse.json(
      { error: "GITHUB_WEBHOOK_SECRET and RELAY_SECRET must be configured" },
      { status: 500 }
    );
  }

  const rawBody = Buffer.from(await request.arrayBuffer());
  const sig = request.headers.get("x-hub-signature-256") ?? undefined;

  if (!verifyGithubWebhookSignature(rawBody, sig, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = (request.headers.get("x-github-event") ?? "").toLowerCase();

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event === "ping") {
    return NextResponse.json({ ok: true, ping: true });
  }

  const installation = payload.installation as { id?: number } | undefined;
  const installationId = installation?.id != null ? String(installation.id) : null;

  if (event === "installation") {
    const action = typeof payload.action === "string" ? payload.action : "";
    if (action === "deleted" && installationId) {
      await deleteInstallMapping(installationId);
      return NextResponse.json({ ok: true, deleted: installationId });
    }
    // created / suspend / unsuspend — mapping should already exist from callback/register
    if (installationId) {
      const existing = await getInstallMapping(installationId);
      if (!existing) {
        console.warn("[webhooks/github] installation event without registry mapping", {
          installationId,
          action,
        });
      }
    }
    return NextResponse.json({ ok: true, event: "installation", action });
  }

  if (!installationId) {
    // No installation context — acknowledge to avoid GitHub retries
    console.warn("[webhooks/github] missing installation.id", { event });
    return NextResponse.json({ ok: true, skipped: true, reason: "no_installation" });
  }

  const mapping = await getInstallMapping(installationId);
  if (!mapping?.instanceUrl) {
    console.warn("[webhooks/github] no instance mapping", { installationId, event });
    return NextResponse.json({ ok: true, skipped: true, reason: "unmapped_installation" });
  }

  // Refresh TTL/touch by re-setting (keeps registry warm)
  try {
    await setInstallMapping(installationId, {
      instanceUrl: mapping.instanceUrl,
      userId: mapping.userId,
    });
  } catch {
    /* ignore */
  }

  if (event !== "push") {
    return NextResponse.json({ ok: true, skipped: true, reason: `Ignoring event: ${event || "unknown"}` });
  }

  const result = await forwardToInstance(
    mapping.instanceUrl,
    installationId,
    rawBody,
    event,
    relaySecret
  );

  if (!result.ok) {
    console.error("[webhooks/github] fan-out failed", {
      installationId,
      instanceUrl: mapping.instanceUrl,
      status: result.status,
      error: result.error,
    });
    // Return 200 so GitHub does not retry forever for a down VPS;
    // operators can redeploy manually. Transient failures may still retry from GitHub if we return 5xx —
    // prefer 502 when instance is unreachable so GitHub retries briefly.
    if (result.status && result.status >= 400 && result.status < 500) {
      return NextResponse.json({ ok: false, forwarded: false, status: result.status }, { status: 200 });
    }
    return NextResponse.json({ ok: false, forwarded: false, error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true, forwarded: true, instanceUrl: mapping.instanceUrl });
}
