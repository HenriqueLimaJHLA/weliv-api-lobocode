#!/bin/bash
set -euo pipefail

# Gateway Traefik: variáveis só em traefik/.env.gateway (ver traefik/.env.gateway.example).
# Não usa o .env da raiz do app — evita misturar infra da VPS com o repositório da API.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

GATEWAY_ENV_FILE="${VPS_GATEWAY_ENV_FILE:-traefik/.env.gateway}"

if [ ! -f "${GATEWAY_ENV_FILE}" ]; then
  echo "Arquivo ${GATEWAY_ENV_FILE} não encontrado."
  echo "Copie traefik/.env.gateway.example para traefik/.env.gateway e preencha (uma vez por VPS)."
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "${GATEWAY_ENV_FILE}"
set +a

COMPOSE_FILE="${VPS_GATEWAY_COMPOSE_FILE:-traefik/docker-compose.vps-gateway.yml}"

if [ -z "${VPS_GATEWAY_PROJECT_NAME:-}" ]; then
  echo "Defina VPS_GATEWAY_PROJECT_NAME em ${GATEWAY_ENV_FILE}"
  exit 1
fi

if [ -z "${TRAEFIK_NETWORK:-}" ]; then
  echo "Defina TRAEFIK_NETWORK em ${GATEWAY_ENV_FILE}"
  exit 1
fi

if [ -z "${LETSENCRYPT_EMAIL:-}" ]; then
  echo "Defina LETSENCRYPT_EMAIL em ${GATEWAY_ENV_FILE} (conta Let's Encrypt / ACME)."
  echo "Sem e-mail válido o Traefik costuma ficar com certificado interno (self-signed) e o browser acusa erro de SSL."
  exit 1
fi

if ! docker network inspect "${TRAEFIK_NETWORK}" >/dev/null 2>&1; then
  echo "Criando rede Docker: ${TRAEFIK_NETWORK}"
  docker network create "${TRAEFIK_NETWORK}" >/dev/null
fi

echo "Subindo gateway compartilhado da VPS (env: ${GATEWAY_ENV_FILE})..."

if [ ! -f "${COMPOSE_FILE}" ]; then
  echo "Arquivo ${COMPOSE_FILE} não encontrado."
  exit 1
fi

echo "Validando compose do gateway..."
docker compose --env-file "${GATEWAY_ENV_FILE}" -f "${COMPOSE_FILE}" config >/dev/null

echo "Iniciando Traefik..."
docker compose --env-file "${GATEWAY_ENV_FILE}" -f "${COMPOSE_FILE}" up -d

echo ""
echo "Gateway compartilhado ativo."
echo "Rede: ${TRAEFIK_NETWORK:-}"
echo "ACME: TLS-ALPN na 443 — abra 443 (e 80 se usar redirect HTTP) para a internet."
echo "Se o certificado continuar inválido após mudança ACME: docker volume rm ${TRAEFIK_LETSENCRYPT_VOLUME_NAME:-traefik-letsencrypt} && ./scripts/deploy.sh vps-gateway"
echo "Próximo passo (app): ./scripts/deploy.sh vps-app (usa o .env na raiz do repositório da API)."
