#!/bin/sh
set -e
if [ "${SKIP_PRISMA_MIGRATE:-0}" != "1" ]; then
  echo "[docker-entrypoint] prisma migrate deploy..."
  npx prisma migrate deploy
fi
echo "[docker-entrypoint] node dist/src/main.js"
exec node dist/src/main.js
