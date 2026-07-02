#!/usr/bin/env bash
set -eo pipefail

echo "=========================================================="
echo "Resetting Workspace to Factory Clean State"
echo "=========================================================="

# Resolve parent directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

# Run clean
if [ -f "$SCRIPT_DIR/clean.sh" ]; then
  bash "$SCRIPT_DIR/clean.sh"
else
  echo "Error: clean.sh not found."
  exit 1
fi

# Run bootstrap
if [ -f "$SCRIPT_DIR/bootstrap.sh" ]; then
  bash "$SCRIPT_DIR/bootstrap.sh"
else
  echo "Error: bootstrap.sh not found."
  exit 1
fi

echo "Workspace reset completed successfully."
