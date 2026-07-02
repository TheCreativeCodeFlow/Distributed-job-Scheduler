#!/usr/bin/env bash
set -eo pipefail

echo "=========================================================="
echo "Cleaning Workspace Build Outputs and Cache Files"
echo "=========================================================="

# Remove root node_modules and target workspace folders
echo "Clearing node_modules, build outputs, and Turborepo caches..."

# Run package script if path is available
if command -v pnpm &> /dev/null; then
  pnpm clean
else
  echo "pnpm not found. Manually purging directories..."
  rm -rf node_modules .turbo dist build .next
  find . -name "node_modules" -type d -prune -exec rm -rf {} +
  find . -name "dist" -type d -prune -exec rm -rf {} +
  find . -name ".turbo" -type d -prune -exec rm -rf {} +
fi

echo "Workspace clean completed successfully."
