#!/usr/bin/env bash
# VersionGate Installation & Preflight Wrapper
# Delegates to the unified TypeScript setup wizard (bun run setup)

set -e

echo "======================================================="
echo "  🚀 VersionGate Installer"
echo "======================================================="

if ! command -v bun >/dev/null 2>&1; then
  echo "❌ Bun runtime is required to run VersionGate."
  echo "Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

echo "📦 Installing dependencies and launching setup wizard..."
bun install
bun run setup
