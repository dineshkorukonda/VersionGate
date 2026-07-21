import { NextRequest, NextResponse } from "next/server";
import { isValidInstanceUrl, setInstallMapping } from "@/lib/install-registry";
import { parseRegisterPayload } from "@/lib/relay-crypto";

/**
 * Backup registration from a VersionGate instance after GitHub App install.
 * Body: { token: base64url signed RegisterPayload }
 * Auth: RELAY_SECRET HMAC inside token.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.RELAY_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "RELAY_SECRET is not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token =
    body && typeof body === "object" && "token" in body && typeof (body as { token: unknown }).token === "string"
      ? (body as { token: string }).token
      : null;

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const parsed = parseRegisterPayload(token, secret);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  if (!isValidInstanceUrl(parsed.instanceUrl)) {
    return NextResponse.json({ error: "Invalid instanceUrl" }, { status: 400 });
  }

  try {
    await setInstallMapping(parsed.installationId, {
      instanceUrl: parsed.instanceUrl,
      userId: parsed.userId,
    });
  } catch (err) {
    console.error("[github/register] redis error", err);
    return NextResponse.json({ error: "Registry unavailable" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, installationId: parsed.installationId });
}
