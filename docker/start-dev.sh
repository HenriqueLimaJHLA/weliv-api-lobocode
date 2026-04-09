#!/bin/bash

echo "🚀 Iniciando ambiente de desenvolvimento weliv..."

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Inicie o Docker primeiro."
    exit 1
fi

# Iniciar serviços
echo "📦 Iniciando serviços..."
docker compose -f docker/docker-compose.yml --env-file .env up -d

# Aguardar serviços iniciarem
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Verificar status
echo "📊 Status dos serviços:"
docker compose -f docker/docker-compose.yml --env-file .env ps

# Health checks
echo "🏥 Verificando saúde dos serviços..."

# Backend
if curl -s http://localhost:30100/health > /dev/null; then
    echo "✅ Backend: http://localhost:30100"
else
    echo "❌ Backend: Não respondeu"
fi

# MinIO
if curl -s http://localhost:19000/minio/health/live > /dev/null; then
    echo "✅ MinIO API: http://localhost:19000"
    echo "✅ MinIO Console: http://localhost:19001 (admin/password123)"
else
    echo "❌ MinIO: Não respondeu"
fi

echo ""
echo "🎉 Ambiente iniciado com sucesso!"
echo ""
echo "📋 Comandos úteis:"
echo "  📊 Logs: docker compose -f docker/docker-compose.yml logs -f"
echo "  🛑 Parar: docker compose -f docker/docker-compose.yml down"
echo "  🔄 Reiniciar: docker compose -f docker/docker-compose.yml restart"
