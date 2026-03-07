#!/bin/bash
# Бэкап PostgreSQL в папку backups/
# Запускать вручную или через cron:
#   0 3 * * * /path/to/project/scripts/backup-db.sh >> /var/log/anic-backup.log 2>&1

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Загружаем переменные из .env.local
if [ -f "$PROJECT_DIR/.env.local" ]; then
  export $(grep -v '^#' "$PROJECT_DIR/.env.local" | xargs)
fi

POSTGRES_DB="${POSTGRES_DB:-anic_portal}"
POSTGRES_USER="${POSTGRES_USER:-anic}"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
FILE="$BACKUP_DIR/${POSTGRES_DB}_${DATE}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Начинаю бэкап базы $POSTGRES_DB..."

docker exec anic-postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$FILE"

echo "[$(date)] Бэкап сохранён: $FILE ($(du -sh "$FILE" | cut -f1))"

# Удаляем бэкапы старше 30 дней
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
echo "[$(date)] Старые бэкапы удалены."
