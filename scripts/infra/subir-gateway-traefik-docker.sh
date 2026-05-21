#!/bin/bash
set -euo pipefail

# Traefik file provider: variáveis em traefik/.env.traefik-file-provider (ver .example).

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

FILE_PROVIDER_ENV_FILE="${TRAEFIK_FILE_PROVIDER_ENV_FILE:-traefik/.env.traefik-file-provider}"

if [ -f "${FILE_PROVIDER_ENV_FILE}" ]; then
  set -a
  # shellcheck disable=SC1090
  . "${FILE_PROVIDER_ENV_FILE}"
  set +a
fi

COMPOSE_FILE="${TRAEFIK_FILE_PROVIDER_COMPOSE_FILE:-traefik/docker-compose.traefik-file-provider.yml}"
HTTP_PORT="${TRAEFIK_PUBLISH_HTTP:-}"
HTTPS_PORT="${TRAEFIK_PUBLISH_HTTPS:-}"

port_esta_em_uso() {
  local porta="$1"
  if ! command -v ss >/dev/null 2>&1; then
    return 1
  fi
  ss -tln 2>/dev/null | grep -qE "[.:]${porta}$"
}

acao="${1:-up}"

if [ "${acao}" = "help" ] || [ "${acao}" = "-h" ] || [ "${acao}" = "--help" ]; then
  echo "Uso: ./scripts/infra/subir-gateway-traefik-docker.sh [up|down|config|logs]"
  echo ""
  echo "Env: ${FILE_PROVIDER_ENV_FILE} (copie de traefik/.env.traefik-file-provider.example)"
  echo "Compose: ${COMPOSE_FILE}"
  exit 0
fi

if [ ! -f "${FILE_PROVIDER_ENV_FILE}" ]; then
  echo "Crie ${FILE_PROVIDER_ENV_FILE} a partir de traefik/.env.traefik-file-provider.example"
  exit 1
fi

if [ ! -f "${COMPOSE_FILE}" ]; then
  echo "Arquivo ${COMPOSE_FILE} não encontrado (execute na raiz do repositório)."
  exit 1
fi

if [ -z "${TRAEFIK_FILE_PROVIDER_PROJECT_NAME:-}" ]; then
  echo "Defina TRAEFIK_FILE_PROVIDER_PROJECT_NAME em ${FILE_PROVIDER_ENV_FILE}"
  exit 1
fi

if [ -z "${TRAEFIK_NETWORK:-}" ]; then
  echo "Defina TRAEFIK_NETWORK em ${FILE_PROVIDER_ENV_FILE}"
  exit 1
fi

if [ "${acao}" = "up" ] && ! docker network inspect "${TRAEFIK_NETWORK}" >/dev/null 2>&1; then
  echo "Criando rede Docker: ${TRAEFIK_NETWORK}"
  docker network create "${TRAEFIK_NETWORK}" >/dev/null
fi

if [ -z "${LETSENCRYPT_EMAIL:-}" ] && [ "${acao}" = "up" ]; then
  echo "Defina LETSENCRYPT_EMAIL em ${FILE_PROVIDER_ENV_FILE}"
  exit 1
fi

if [ "${acao}" = "up" ]; then
  if [ -z "${HTTP_PORT}" ] || [ -z "${HTTPS_PORT}" ]; then
    echo "Defina TRAEFIK_PUBLISH_HTTP e TRAEFIK_PUBLISH_HTTPS em ${FILE_PROVIDER_ENV_FILE}"
    exit 1
  fi
  if port_esta_em_uso "${HTTP_PORT}" || port_esta_em_uso "${HTTPS_PORT}"; then
    echo "Portas ${HTTP_PORT} e/ou ${HTTPS_PORT} em uso."
    exit 1
  fi
fi

case "${acao}" in
  up)
    echo "Validando compose..."
    docker compose --env-file "${FILE_PROVIDER_ENV_FILE}" -f "${COMPOSE_FILE}" config >/dev/null
    echo "Subindo Traefik (file provider)..."
    docker compose --env-file "${FILE_PROVIDER_ENV_FILE}" -f "${COMPOSE_FILE}" up -d
    echo "Pronto. Rede: ${TRAEFIK_NETWORK:-}"
    ;;
  down)
    docker compose --env-file "${FILE_PROVIDER_ENV_FILE}" -f "${COMPOSE_FILE}" down
    ;;
  config)
    docker compose --env-file "${FILE_PROVIDER_ENV_FILE}" -f "${COMPOSE_FILE}" config
    ;;
  logs)
    docker compose --env-file "${FILE_PROVIDER_ENV_FILE}" -f "${COMPOSE_FILE}" logs -f --tail=100
    ;;
  *)
    echo "Comando inválido: ${acao}. Use: up | down | config | logs | help"
    exit 1
    ;;
esac
