#!/usr/bin/env bash
set -eo pipefail

echo "=========================================================="
echo "Executing Codebase Automated Tests"
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

# Ensure shims PATH mapping
export PATH="$SCRIPT_DIR/../node_modules/.bin:$PATH"

if command -v pnpm &> /dev/null; then
  pnpm test
else
  echo "Error: pnpm package manager binary not found."
  exit 1
fi
