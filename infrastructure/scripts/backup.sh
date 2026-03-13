#!/bin/bash
# ============================================
# Blazion Forms — Database Backup Script
# Run daily via cron: 0 2 * * * /opt/blazion-forms/infrastructure/scripts/backup.sh
# ============================================

set -euo pipefail

# Configuration
BACKUP_DIR="/opt/blazion-backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="${POSTGRES_DB:-blazion}"
DB_USER="${POSTGRES_USER:-blazion}"
DB_HOST="${POSTGRES_HOST:-localhost}"
S3_BUCKET="${BACKUP_S3_BUCKET:-}"

echo "🗄️  Starting database backup at $(date)"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Dump database
BACKUP_FILE="$BACKUP_DIR/blazion_${TIMESTAMP}.sql.gz"
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  -f "$BACKUP_FILE"

BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "✅ Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# Upload to S3 (if configured)
if [ -n "$S3_BUCKET" ]; then
  aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/database/blazion_${TIMESTAMP}.sql.gz" \
    --storage-class STANDARD_IA
  echo "☁️  Uploaded to S3: s3://$S3_BUCKET/database/"
fi

# Cleanup old local backups
find "$BACKUP_DIR" -name "blazion_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "🧹 Cleaned up backups older than ${RETENTION_DAYS} days"

# Verify backup integrity
pg_restore --list "$BACKUP_FILE" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Backup verification passed"
else
  echo "⚠️  Backup verification failed!"
  exit 1
fi

echo "🎉 Backup complete at $(date)"
