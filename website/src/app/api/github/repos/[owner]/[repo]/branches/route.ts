import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import { verifyRelayQuerySignature } from "@/lib/relay-crypto";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const secret = (process.env.RELAY_SECRET || "vg_relay_shared_secret").trim();
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !privateKey) {
    return NextResponse.json({ error: "GitHub App credentials not configured on relay" }, { status: 503 });
  }

  const resolvedParams = await params;
  const { owner, repo } = resolvedParams;
  const installationId = request.nextUrl.searchParams.get("installation_id");
  const sig = request.nextUrl.searchParams.get("sig");

  if (!installationId || !sig || !owner || !repo) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  if (!verifyRelayQuerySignature(`branches:${installationId}:${owner}/${repo}`, sig, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const auth = createAppAuth({
      appId: Number(appId),
      privateKey,
    });
    const { token } = await auth({ type: "app" });
    const octokit = new Octokit({ auth: token });

    const branches: { name: string; sha: string | undefined }[] = [];
    let page = 1;
    for (;;) {
      const { data } = await octokit.rest.repos.listBranches({
        owner,
        repo,
        per_page: 100,
        page,
      });
      for (const b of data) {
        branches.push({ name: b.name, sha: b.commit?.sha });
      }
      if (data.length < 100) break;
      page += 1;
    }

    return NextResponse.json({
      installationId,
      branches,
    });
  } catch (err) {
    console.error("[github/branches relay] error fetching branches:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch branches" },
      { status: 500 }
    );
  }
}
