#!/usr/bin/env bash
set -eo pipefail

echo "=========================================================="
echo "Bootstrapping Distributed Job Scheduler Monorepo Environment"
echo "=========================================================="

# Check Node version
NODE_VERSION=$(node -v)
echo "Found Node.js version: $NODE_VERSION"

# Setup local corepack shims if needed
if ! command -v pnpm &> /dev/null; then
  echo "pnpm not found in PATH. Setting up local shims..."
  corepack enable --install-directory ./node_modules/.bin
  export PATH="./node_modules/.bin:$PATH"
fi

echo "Installing workspace dependencies..."
pnpm install

echo "Initializing Git hooks via Husky..."
pnpm exec husky

echo "Bootstrap completed successfully! You can now start local development."
