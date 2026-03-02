#!/bin/bash
# Скрипт первоначальной настройки VPS (Ubuntu 22.04)
# Запуск: bash setup-vps.sh
set -e

APP_DIR="/var/www/anic-portal"
APP_USER="www-data"
DOMAIN="your-domain.ru"  # Заменить перед запуском

echo "=== [1/9] Обновление системы ==="
apt-get update -y && apt-get upgrade -y

echo "=== [2/9] Установка Node.js 20 LTS ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pnpm pm2

echo "=== [3/9] Установка PostgreSQL 16 ==="
apt-get install -y postgresql-16 postgresql-client-16
systemctl enable postgresql
systemctl start postgresql

echo "=== [4/9] Установка Nginx ==="
apt-get install -y nginx certbot python3-certbot-nginx
systemctl enable nginx

echo "=== [5/9] Установка Meilisearch ==="
curl -L https://install.meilisearch.com | sh
mv meilisearch /usr/local/bin/
cat > /etc/systemd/system/meilisearch.service << 'EOF'
[Unit]
Description=Meilisearch
After=network.target

[Service]
ExecStart=/usr/local/bin/meilisearch --env production --master-key ${MEILISEARCH_MASTER_KEY} --db-path /var/lib/meilisearch/data
WorkingDirectory=/var/lib/meilisearch
Restart=on-failure
User=meilisearch
Group=meilisearch

[Install]
WantedBy=multi-user.target
EOF
useradd -r -s /bin/false meilisearch 2>/dev/null || true
mkdir -p /var/lib/meilisearch/data
chown -R meilisearch:meilisearch /var/lib/meilisearch
systemctl daemon-reload
systemctl enable meilisearch

echo "=== [6/9] Настройка БД ==="
sudo -u postgres psql -c "CREATE USER anic WITH PASSWORD 'CHANGE_THIS_PASSWORD';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE anic_portal OWNER anic;" 2>/dev/null || true

echo "=== [7/9] Настройка firewall ==="
apt-get install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "=== [8/9] Создание рабочей директории ==="
mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
mkdir -p "$APP_DIR/public/uploads"

echo "=== [9/9] Настройка cron-бэкапа БД ==="
cat > /etc/cron.d/anic-backup << 'EOF'
0 3 * * * postgres pg_dump anic_portal | gzip > /var/backups/anic_$(date +\%Y\%m\%d).sql.gz && find /var/backups -name "anic_*.sql.gz" -mtime +30 -delete
EOF

echo ""
echo "========================================="
echo " Базовая настройка завершена!"
echo " Следующие шаги:"
echo " 1. Скопировать nginx.conf в /etc/nginx/sites-available/anic-portal"
echo " 2. ln -s /etc/nginx/sites-available/anic-portal /etc/nginx/sites-enabled/"
echo " 3. certbot --nginx -d $DOMAIN"
echo " 4. Задеплоить приложение: bash scripts/deploy.sh"
echo "========================================="
