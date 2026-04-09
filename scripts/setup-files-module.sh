#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "🚀 Configurando módulo de arquivos..."

# Instalar dependências
echo "📦 Instalando dependências..."
npm install minio multer
npm install --save-dev @types/multer

# Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

# Executar migração
echo "🗄️ Executando migração do banco..."
npx prisma migrate dev --name add-files-module

echo "✅ Módulo de arquivos configurado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Iniciar o MinIO: docker-compose up minio"
echo "2. Acessar o console MinIO: http://localhost:19001"
echo "3. Login: admin / password123"
echo "4. Testar upload: POST http://localhost:30100/files/upload"

