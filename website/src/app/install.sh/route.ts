import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export async function GET() {
  const publicPath = path.join(process.cwd(), "public", "install.sh");
  const rootPath = path.join(process.cwd(), "..", "install.sh");

  let scriptContent = "";
  if (fs.existsSync(publicPath)) {
    scriptContent = fs.readFileSync(publicPath, "utf-8");
  } else if (fs.existsSync(rootPath)) {
    scriptContent = fs.readFileSync(rootPath, "utf-8");
  } else {
    return new NextResponse("Installer script not found", { status: 404 });
  }

  return new NextResponse(scriptContent, {
    status: 200,
    headers: {
      "Content-Type": "text/x-shellscript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
