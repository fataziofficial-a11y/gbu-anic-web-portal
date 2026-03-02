# Руководство по деплою — ГБУ АНИЦ

## Требования к VPS

- **OS**: Ubuntu 22.04 LTS
- **RAM**: минимум 2 GB (рекомендуется 4 GB)
- **CPU**: 2 vCPU+
- **Диск**: 20 GB+ SSD
- **Домен**: DNS указывает на IP сервера

---

## Первоначальная настройка

### 1. Подключение к серверу

```bash
ssh root@YOUR_SERVER_IP
```

### 2. Запуск скрипта настройки

```bash
# Скачать скрипт
curl -o setup-vps.sh https://raw.githubusercontent.com/YOUR_ORG/anic-portal/main/scripts/setup-vps.sh

# Отредактировать домен внутри файла
nano setup-vps.sh  # Изменить DOMAIN="your-domain.ru"

# Запустить
bash setup-vps.sh
```

Скрипт установит: Node.js 20, pnpm, PM2, PostgreSQL 16, Nginx, Meilisearch, UFW.

### 3. Настройка БД

```bash
sudo -u postgres psql
ALTER USER anic WITH PASSWORD 'НАДЁЖНЫЙ_ПАРОЛЬ';
\q
```

### 4. Nginx

```bash
cp nginx.conf.example /etc/nginx/sites-available/anic-portal
# Отредактировать домен
nano /etc/nginx/sites-available/anic-portal

ln -s /etc/nginx/sites-available/anic-portal /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 5. SSL-сертификат

```bash
certbot --nginx -d your-domain.ru -d www.your-domain.ru
```

### 6. Переменные окружения

```bash
cp .env.production.example /var/www/anic-portal/.env.local
nano /var/www/anic-portal/.env.local
# Заполнить: DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL
```

Генерация `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

## Деплой приложения

```bash
bash scripts/deploy.sh
```

Скрипт выполнит:
1. `git pull` (или `git clone` при первом запуске)
2. `pnpm install --frozen-lockfile`
3. `pnpm db:push` (применяет схему)
4. `pnpm build`
5. `pm2 restart` (или `pm2 start`)

---

## Управление процессом (PM2)

```bash
pm2 status                  # Статус всех процессов
pm2 logs anic-portal        # Логи в реальном времени
pm2 restart anic-portal     # Перезапуск
pm2 stop anic-portal        # Остановить
pm2 monit                   # Мониторинг CPU/RAM
```

---

## Meilisearch

```bash
# Запустить сервис
systemctl start meilisearch
systemctl status meilisearch

# Переиндексировать данные (после наполнения БД)
# pnpm tsx scripts/reindex.ts  ← будет добавлено в Фазе 3
```

---

## Бэкап БД

Автоматический бэкап настроен через cron (ежедневно в 3:00):
```bash
# Ручной бэкап
sudo -u postgres pg_dump anic_portal | gzip > /var/backups/anic_manual_$(date +%Y%m%d).sql.gz

# Восстановление
gunzip -c /var/backups/anic_YYYYMMDD.sql.gz | sudo -u postgres psql anic_portal
```

---

## Проверка работоспособности

```bash
# Healthcheck API
curl https://your-domain.ru/api/health

# Ожидаемый ответ:
# {"status":"ok","db":"ok","latencyMs":5,"timestamp":"..."}
```

---

## Обновление приложения

```bash
ssh user@YOUR_SERVER_IP
cd /var/www/anic-portal
bash scripts/deploy.sh
```

---

## Логи

```bash
# PM2 логи
tail -f /var/log/pm2/anic-portal-out.log
tail -f /var/log/pm2/anic-portal-error.log

# Nginx логи
tail -f /var/log/nginx/anic-portal-access.log
tail -f /var/log/nginx/anic-portal-error.log
```
