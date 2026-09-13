import { NextResponse } from "next/server";
import { getRelayPrivateKey } from "@/lib/relay-crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = getRelayPrivateKey();
  const configured = Boolean(appId && privateKey);

  return NextResponse.json({
    status: "ok",
    relay: "active",
    githubAppConfigured: configured,
    appId: configured ? Number(appId) : null,
    timestamp: new Date().toISOString(),
  });
}
