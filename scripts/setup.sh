#!/usr/bin/env bash
set -eo pipefail

echo "=========================================================="
echo "Initializing Project Setup & Configurations"
echo "=========================================================="

# Check and copy environment file
if [ ! -f .env ]; then
  echo "Copying .env.example to .env..."
  cp .env.example .env
  echo "Success: Local .env configuration file initialized."
else
  echo "Note: .env file already exists. Skipping initialization."
fi

# Placeholder for verifying Docker infrastructure
if command -v docker &> /dev/null; then
  echo "Success: Docker CLI detected."
  if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    echo "Success: Docker Compose detected."
  else
    echo "Warning: Docker Compose not found. Local dependency containers cannot be started."
  fi
else
  echo "Warning: Docker not found. You will need Docker for containerized services."
fi

echo "Setup completed successfully."
