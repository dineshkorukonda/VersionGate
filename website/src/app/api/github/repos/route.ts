import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import { verifyRelayQuerySignature } from "@/lib/relay-crypto";

export async function GET(request: NextRequest) {
  const secret = process.env.RELAY_SECRET;
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!secret) {
    return NextResponse.json({ error: "RELAY_SECRET not configured on relay" }, { status: 500 });
  }

  if (!appId || !privateKey) {
    return NextResponse.json({ error: "GitHub App credentials not configured on relay" }, { status: 503 });
  }

  const installationId = request.nextUrl.searchParams.get("installation_id");
  const sig = request.nextUrl.searchParams.get("sig");

  if (!installationId || !sig) {
    return NextResponse.json({ error: "Missing installation_id or sig" }, { status: 400 });
  }

  if (!verifyRelayQuerySignature(`repos:${installationId}`, sig, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const auth = createAppAuth({
      appId: Number(appId),
      privateKey,
    });
    const { token } = await auth({ type: "app" });
    const octokit = new Octokit({ auth: token });

    const repositories: Awaited<
      ReturnType<Octokit["rest"]["apps"]["listReposAccessibleToInstallation"]>
    >["data"]["repositories"] = [];

    let page = 1;
    for (;;) {
      const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
        installation_id: Number(installationId),
        per_page: 100,
        page,
      });
      repositories.push(...data.repositories);
      if (data.repositories.length < 100) break;
      page += 1;
    }

    return NextResponse.json({
      installationId,
      totalCount: repositories.length,
      repositories: repositories.map((r) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        owner: r.owner?.login ?? r.full_name.split("/")[0] ?? "",
        private: r.private,
        defaultBranch: r.default_branch,
        cloneUrl: r.clone_url,
        htmlUrl: r.html_url,
        language: r.language ?? null,
        updatedAt: r.updated_at ?? null,
        pushedAt: r.pushed_at ?? null,
      })),
    });
  } catch (err) {
    console.error("[github/repos relay] error fetching repos:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
