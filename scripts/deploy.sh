#!/bin/bash
# Деплой приложения на production VPS
# Запуск: bash scripts/deploy.sh
set -e

APP_DIR="/var/www/anic-portal"
REPO_URL="https://github.com/YOUR_ORG/anic-portal.git"  # Заменить
BRANCH="main"

echo "=== [1/6] Получение последнего кода ==="
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin
  git reset --hard origin/$BRANCH
else
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "=== [2/6] Установка зависимостей ==="
pnpm install --frozen-lockfile

echo "=== [3/6] Проверка .env ==="
if [ ! -f "$APP_DIR/.env.local" ]; then
  echo "ОШИБКА: .env.local не найден в $APP_DIR"
  echo "Создайте файл на основе .env.production.example"
  exit 1
fi

echo "=== [4/6] Применение миграций БД ==="
pnpm db:push

echo "=== [5/6] Сборка ==="
pnpm build

echo "=== [6/6] Перезапуск PM2 ==="
pm2 startOrRestart ecosystem.config.js --env production
pm2 save

echo ""
echo "========================================="
echo " Деплой завершён успешно!"
echo " Статус: pm2 status"
echo " Логи:   pm2 logs anic-portal"
echo "========================================="
