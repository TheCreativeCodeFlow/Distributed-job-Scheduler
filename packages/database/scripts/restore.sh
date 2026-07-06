#!/bin/sh

# Database Restore Script
# Restores database state from a compressed sql.gz file.

set -e

if [ -z "$1" ]; then
    echo "❌ ERROR: Backup file path is required. Usage: restore.sh /path/to/backup.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ ERROR: Backup file does not exist: ${BACKUP_FILE}"
    exit 1
fi

echo "Checking configurations..."
if [ -z "$DB_USER" ] || [ -z "$DB_NAME" ] || [ -z "$DB_HOST" ]; then
    echo "❌ ERROR: DB_USER, DB_NAME, and DB_HOST environment variables must be defined."
    exit 1
fi

echo "⏳ WARNING: This will overwrite data in database '${DB_NAME}'. Proceeding..."
gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME"

echo "✅ Database restore completed successfully."
