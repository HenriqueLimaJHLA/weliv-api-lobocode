#!/bin/bash
# =============================================================================
# DEV - Inicia o ambiente de desenvolvimento
# Uso: ./scripts/dev.sh
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"

cd "${PROJECT_DIR}"

# Carregar variáveis do .env
if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1090
  source ".env"
  set +a
else
  echo "❌ Arquivo .env não encontrado."
  exit 1
fi

echo "🚀 Iniciando modo desenvolvimento..."

# Verificar se banco está rodando
if ! docker ps --format '{{.Names}}' | grep -q "${DB_CONTAINER_NAME}"; then
  echo "⚠️  Banco não está rodando. Executando setup..."
  ./scripts/setup.sh
fi

# Iniciar NestJS em watch mode
echo "🔄 Iniciando NestJS em watch mode..."
echo "   Swagger: http://localhost:${PORT:-3000}/docs"
echo "   Health:  http://localhost:${PORT:-3000}/health"
echo ""

npm run start:dev
