#!/bin/bash
# ============================================
# Blazion Forms — Database Restore Script
# Usage: ./restore.sh <backup_file.sql.gz>
# ============================================

set -euo pipefail

BACKUP_FILE="${1:-}"
DB_NAME="${POSTGRES_DB:-blazion}"
DB_USER="${POSTGRES_USER:-blazion}"
DB_HOST="${POSTGRES_HOST:-localhost}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  echo "Available backups:"
  ls -la /opt/blazion-backups/blazion_*.sql.gz 2>/dev/null || echo "  No local backups found"
  exit 1
fi

echo "⚠️  WARNING: This will restore the database from backup."
echo "   Database: $DB_NAME"
echo "   Backup:   $BACKUP_FILE"
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo "🔄 Restoring database..."

# Terminate active connections
PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB_NAME' AND pid <> pg_backend_pid();"

# Drop and recreate database
PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# Restore from backup
PGPASSWORD="${POSTGRES_PASSWORD}" pg_restore \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-privileges \
  "$BACKUP_FILE"

echo "✅ Database restored successfully from: $BACKUP_FILE"
