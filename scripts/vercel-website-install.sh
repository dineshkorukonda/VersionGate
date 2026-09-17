#!/usr/bin/env bash
set -euo pipefail

# Works whether Vercel Root Directory is the repo root or the website/ folder.
if [[ -f package.json ]] && grep -q '"name": "versiongate-website"' package.json; then
  bun install
elif [[ -d website && -f website/package.json ]]; then
  cd website
  bun install
else
  echo "versiongate-website package.json not found" >&2
  exit 1
fi
