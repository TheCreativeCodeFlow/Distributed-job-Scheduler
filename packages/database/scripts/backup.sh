#!/bin/sh

# Database Backup Script
# Automatically creates a compressed gzip archive of the production postgres database schema & content.

set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/djs_backup_${TIMESTAMP}.sql.gz"

echo "Checking configurations..."
if [ -z "$DB_USER" ] || [ -z "$DB_NAME" ] || [ -z "$DB_HOST" ]; then
    echo "❌ ERROR: DB_USER, DB_NAME, and DB_HOST environment variables must be defined."
    exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "⏳ Starting database backup for database '${DB_NAME}'..."
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -F p | gzip > "$BACKUP_FILE"

echo "✅ Backup completed successfully: ${BACKUP_FILE}"

# Rotate backups: Keep only the 10 most recent backups
echo "🧹 Pruning old backups (keeping last 10)..."
find "$BACKUP_DIR" -name "djs_backup_*.sql.gz" -type f | sort -r | tail -n +11 | xargs rm -f || true
echo "✅ Rotation complete."
