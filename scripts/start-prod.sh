#!/bin/bash
# Production startup script for Next.js standalone server.
# Loads .env.local (secrets stay on disk, not in git/PM2 config).
set -a
# shellcheck disable=SC1091
source /var/www/gbu-anic/.env.local
set +a

exec node /var/www/gbu-anic/.next/standalone/server.js
