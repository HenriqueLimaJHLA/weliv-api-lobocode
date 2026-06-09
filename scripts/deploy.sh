#!/bin/bash
set -euo pipefail

# Fluxo: variáveis no .env da raiz (ver .env.example).

ENV_FILE="${ENV_FILE:-.env}"
if [ -f "${ENV_FILE}" ]; then
  set -a
  # shellcheck disable=SC1090
  . "${ENV_FILE}"
  set +a
fi

show_help() {
  local example_project="${VPS_APP_PROJECT_NAME:-<VPS_APP_PROJECT_NAME>}"
  local example_host="${APP_HOST:-<APP_HOST>}"
  local example_service="${VPS_DEFAULT_SERVICE:-backend}"

  echo "Deploy (docker/ + scripts/vps/)"
  echo ""
  echo "Uso: ./scripts/deploy.sh [comando]"
  echo ""
  echo "Comandos:"
  echo "  vps-gateway  - Traefik compartilhado (portas em TRAEFIK_PUBLISH_*)"
  echo "  vps-app      - Backend com labels Traefik (compose vps-app)"
  echo "  vps-backend  - Só o serviço backend"
  echo "  vps-service  - Um serviço do compose vps-app (ex.: backend)"
  echo "  database     - Postgres + Redis + MinIO (compose database)"
  echo "  minio        - Só MinIO (via start-database.sh minio)"
  echo "  help"
  echo ""
  echo "Exemplos:"
  echo "  ./scripts/deploy.sh vps-gateway"
  echo "  ./scripts/deploy.sh vps-app"
  echo "  VPS_APP_PROJECT_NAME=${example_project} APP_HOST=${example_host} ./scripts/deploy.sh vps-app"
  echo "  APP_HOST=${example_host} ./scripts/deploy.sh vps-backend"
  echo "  ./scripts/deploy.sh vps-service ${example_service}"
  echo "  ./scripts/deploy.sh database"
}

check_directory() {
  if [ ! -f "traefik/docker-compose.vps-gateway.yml" ] || [ ! -f "docker/docker-compose.vps-app.yml" ]; then
    echo "Erro: execute na raiz do repositório (pasta que contém docker/)."
    exit 1
  fi
}

deploy_vps_gateway() {
  ./scripts/vps/deploy-gateway.sh
}

deploy_vps_app() {
  ./scripts/vps/deploy-app.sh
}

deploy_vps_backend() {
  ./scripts/vps/deploy-backend.sh
}

deploy_vps_service() {
  ./scripts/vps/deploy-service.sh "${2:-}"
}

start_database() {
  ./scripts/start-database.sh
}

start_minio_only() {
  ./scripts/start-database.sh minio
}

check_directory

case "${1:-help}" in
  vps-gateway)
    deploy_vps_gateway
    ;;
  vps-app)
    deploy_vps_app
    ;;
  vps-backend)
    deploy_vps_backend
    ;;
  vps-service)
    deploy_vps_service "$@"
    ;;
  database)
    start_database
    ;;
  minio)
    start_minio_only
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    echo "Comando inválido: ${1:-}"
    echo ""
    show_help
    exit 1
    ;;
esac
