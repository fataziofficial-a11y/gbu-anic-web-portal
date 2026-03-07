#!/bin/bash
# Восстановление БД из бэкапа
# Использование: ./scripts/restore-db.sh backups/anic_portal_2025-01-01_03-00-00.sql.gz

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -z "$1" ]; then
  echo "Использование: $0 <путь_к_файлу.sql.gz>"
  echo ""
  echo "Доступные бэкапы:"
  ls -lh "$PROJECT_DIR/backups/"*.sql.gz 2>/dev/null || echo "  Бэкапов нет"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Ошибка: файл '$BACKUP_FILE' не найден"
  exit 1
fi

if [ -f "$PROJECT_DIR/.env.local" ]; then
  export $(grep -v '^#' "$PROJECT_DIR/.env.local" | xargs)
fi

POSTGRES_DB="${POSTGRES_DB:-anic_portal}"
POSTGRES_USER="${POSTGRES_USER:-anic}"

echo "ВНИМАНИЕ: Это перезапишет базу данных '$POSTGRES_DB'!"
read -p "Продолжить? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Отменено."
  exit 0
fi

echo "[$(date)] Восстанавливаю из $BACKUP_FILE..."

gunzip -c "$BACKUP_FILE" | docker exec -i anic-postgres psql -U "$POSTGRES_USER" "$POSTGRES_DB"

echo "[$(date)] Восстановление завершено."
