#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "📁 Iniciando MinIO weliv..."

# Verificar se está no diretório correto
if [ ! -f "docker/docker-compose.minio.yml" ]; then
    echo "❌ Erro: Execute este script no diretório do projeto"
    exit 1
fi

# Criar rede se não existir
if ! docker network ls | grep -q "app-net-weliv"; then
    echo "📡 Criando rede app-net-weliv..."
    docker network create --driver bridge app-net-weliv
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker compose -f docker/docker-compose.minio.yml --env-file .env down

# Iniciar MinIO
echo "▶️ Iniciando MinIO..."
docker compose -f docker/docker-compose.minio.yml --env-file .env up -d

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 10

# Verificar status
echo "📊 Status dos containers:"
docker compose -f docker/docker-compose.minio.yml --env-file .env ps

echo ""
echo "✅ MinIO iniciado!"
echo "📁 API disponível em: http://localhost:19000 (weliv)"
echo "🖥️ Console web disponível em: http://localhost:19001 (weliv)"
echo "👤 Usuário: admin"
echo "🔑 Senha: password123"
echo ""
echo "📋 Comandos úteis:"
echo "  - Logs: docker compose -f docker/docker-compose.minio.yml logs -f minio"
echo "  - Parar: docker compose -f docker/docker-compose.minio.yml down"
echo "  - Restart: docker compose -f docker/docker-compose.minio.yml restart minio"
echo ""
echo "🔧 Configuração no .env:"
echo "  MINIO_ROOT_USER=admin"
echo "  MINIO_ROOT_PASSWORD=password123"
echo "  MINIO_ENDPOINT=http://localhost:19000"
echo "  MINIO_USE_SSL=false"

