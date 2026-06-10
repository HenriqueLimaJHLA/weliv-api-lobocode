#!/bin/bash
# =============================================================================
# SETUP - Configura o ambiente de desenvolvimento
# Uso: ./scripts/setup.sh
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
  echo "❌ Arquivo .env não encontrado. Copie .env.example para .env e configure."
  exit 1
fi

echo "🚀 Configurando ambiente de desenvolvimento..."

# Verificar Docker
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker não está rodando. Inicie o Docker primeiro."
  exit 1
fi

# 1. Subir banco de dados
echo "📦 Subindo banco de dados..."
./scripts/start-database.sh

# 2. Gerar Prisma Client
echo "🔧 Gerando Prisma Client..."
npx prisma generate

# 3. Criar migração inicial (se não existir)
echo "📝 Verificando migrações..."
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "   Migrações já existem, aplicando..."
  npx prisma migrate deploy
else
  echo "   Criando migração inicial..."
  npx prisma migrate dev --name init
fi

# 4. Seed
echo "🌱 Executando seed..."
npx ts-node prisma/seed.ts

echo ""
echo "✅ Setup concluído!"
echo ""
echo "📋 Próximos passos:"
echo "   Para iniciar o dev: ./scripts/dev.sh"
echo "   Ou: npm run dev"
echo ""
echo "🔐 Credenciais de acesso (seed):"
echo "   Admin: admin@${APP_HOST:-templatelobocode.com} / Admin@123456"
echo "   User:  user@${APP_HOST:-templatelobocode.com} / User@123456"
