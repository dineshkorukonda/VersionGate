import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const websiteDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(websiteDir, "..");

const nextConfig: NextConfig = {
  // Monorepo: trace deps from repo root (matches Vercel outputFileTracingRoot).
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
  },
};

export default nextConfig;
