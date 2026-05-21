#!/bin/bash
set -euo pipefail

ENV_FILE="${ENV_FILE:-.env}"
if [ -f "${ENV_FILE}" ]; then
  set -a
  # shellcheck disable=SC1090
  . "${ENV_FILE}"
  set +a
fi

SERVICE_NAME="${1:-}"
COMPOSE_FILE="${VPS_APP_COMPOSE_FILE:-docker/docker-compose.vps-app.yml}"
TRAEFIK_NETWORK="${TRAEFIK_NETWORK:-}"
APP_HOST="${APP_HOST:-}"
APP_HOST_EXAMPLE="${APP_HOST_EXAMPLE:-api.exemplo.com}"
DEFAULT_SERVICE_EXAMPLE="${VPS_DEFAULT_SERVICE:-backend}"

if [ -z "${COMPOSE_VPS_STACK_NAME:-}" ]; then
  echo "Defina COMPOSE_VPS_STACK_NAME no ${ENV_FILE}"
  exit 1
fi

if [ -z "${SERVICE_NAME}" ]; then
  echo "Informe o nome do serviço."
  echo "Exemplo: ./scripts/vps/deploy-service.sh ${DEFAULT_SERVICE_EXAMPLE}"
  exit 1
fi

echo "Deploy individual do serviço: ${SERVICE_NAME}"

if [ ! -f "${COMPOSE_FILE}" ]; then
  echo "Arquivo ${COMPOSE_FILE} não encontrado."
  exit 1
fi

if [ "${SERVICE_NAME}" = "backend" ] && [ -z "${APP_HOST}" ]; then
  echo "Defina APP_HOST no ${ENV_FILE} para deploy do backend."
  echo "Exemplo: APP_HOST=${APP_HOST_EXAMPLE}"
  exit 1
fi

if [ -z "${TRAEFIK_NETWORK}" ]; then
  echo "Defina TRAEFIK_NETWORK no ${ENV_FILE}"
  exit 1
fi

if ! docker network ls --format '{{.Name}}' | grep -Fxq "${TRAEFIK_NETWORK}"; then
  echo "Rede compartilhada ${TRAEFIK_NETWORK} não existe."
  echo "Suba o gateway primeiro: ./scripts/deploy.sh vps-gateway"
  exit 1
fi

if [ -z "${DOCKER_NETWORK_NAME:-}" ]; then
  echo "Defina DOCKER_NETWORK_NAME no ${ENV_FILE} (mesma rede do stack database)."
  exit 1
fi

if ! docker network ls --format '{{.Name}}' | grep -Fxq "${DOCKER_NETWORK_NAME}"; then
  echo "Criando rede ${DOCKER_NETWORK_NAME}..."
  docker network create --driver bridge "${DOCKER_NETWORK_NAME}" >/dev/null
  echo "Suba Postgres/Redis/MinIO na mesma rede: ./scripts/deploy.sh database"
fi

echo "Validando compose..."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" config >/dev/null

if ! docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" config --services | grep -Fxq "${SERVICE_NAME}"; then
  echo "Serviço '${SERVICE_NAME}' não encontrado no compose."
  echo "Serviços disponíveis:"
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" config --services
  exit 1
fi

echo "Atualizando serviço ${SERVICE_NAME} na stack ${COMPOSE_VPS_STACK_NAME}..."
docker compose --env-file "${ENV_FILE}" -p "${COMPOSE_VPS_STACK_NAME}" -f "${COMPOSE_FILE}" up -d --build "${SERVICE_NAME}"

echo ""
echo "Serviço '${SERVICE_NAME}' atualizado."
echo "Verifique: docker compose --env-file \"${ENV_FILE}\" -p ${COMPOSE_VPS_STACK_NAME} -f ${COMPOSE_FILE} ps ${SERVICE_NAME}"
