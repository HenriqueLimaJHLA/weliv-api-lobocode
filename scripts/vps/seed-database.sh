#!/bin/bash
set -euo pipefail

# Migrate deploy + seed sem Node/npm no host da VPS: container Node na rede do Postgres.
# Execute na raiz do repositório (der-api-lobocode).

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

ENV_FILE="${ENV_FILE:-.env}"
if [ ! -f "${ENV_FILE}" ]; then
  echo "Crie ${ENV_FILE} (ex.: cp .env.example .env)."
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "${ENV_FILE}"
set +a

if [ -z "${DOCKER_NETWORK_NAME:-}" ] || [ -z "${DB_CONTAINER_NAME:-}" ]; then
  echo "Defina DOCKER_NETWORK_NAME e DB_CONTAINER_NAME no ${ENV_FILE}."
  exit 1
fi

export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_CONTAINER_NAME}:5432/${DB_NAME}?schema=public"

NODE_IMAGE="${PRISMA_NODE_IMAGE:-node:22-alpine}"

echo "Rede: ${DOCKER_NETWORK_NAME} | DB: ${DB_CONTAINER_NAME} | Imagem: ${NODE_IMAGE}"

docker run --rm \
  --network "${DOCKER_NETWORK_NAME}" \
  -v "${ROOT_DIR}:/app" \
  -w /app \
  -e DATABASE_URL \
  -e DIRECT_URL="${DIRECT_URL:-}" \
  "${NODE_IMAGE}" \
  sh -c '
    set -e
    apk add --no-cache python3 make g++ git >/dev/null
    if [ -f package-lock.json ]; then
      npm ci --legacy-peer-deps
    else
      npm install --legacy-peer-deps
    fi
    npx prisma generate
    npx prisma migrate deploy
    npx ts-node prisma/seed.ts
  '

echo "Pronto."
