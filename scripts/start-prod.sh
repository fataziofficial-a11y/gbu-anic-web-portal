#!/bin/bash
# Production startup script for Next.js standalone server.
# Loads .env.local (secrets stay on disk, not in git/PM2 config).
set -a
# shellcheck disable=SC1091
source /var/www/gbu-anic/.env.local
set +a

# ── Live-public для standalone ─────────────────────────────────────────────────
# Каждый `pnpm build` копирует public/ → .next/standalone/public/ как snapshot.
# Файлы, загруженные через /api/files после билда (в реальный public/uploads/),
# в этой копии отсутствуют — next/image optimizer отдаёт 400 на свежие обложки.
# Симлинк заставляет standalone всегда читать из живой public/.
STANDALONE_PUBLIC="/var/www/gbu-anic/.next/standalone/public"
if [ -e "$STANDALONE_PUBLIC" ] && [ ! -L "$STANDALONE_PUBLIC" ]; then
  mv "$STANDALONE_PUBLIC" "${STANDALONE_PUBLIC}.buildtime.$(date +%s)" 2>/dev/null \
    || rm -rf "$STANDALONE_PUBLIC"
fi
if [ ! -L "$STANDALONE_PUBLIC" ]; then
  ln -s /var/www/gbu-anic/public "$STANDALONE_PUBLIC"
fi

exec node /var/www/gbu-anic/.next/standalone/server.js
