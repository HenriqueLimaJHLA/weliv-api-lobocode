#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "🚀 Deploy Backend Apenas - weliv"

# Verificar se está no diretório correto
if [ ! -f "docker/docker-compose.prod.yml" ]; then
    echo "❌ Erro: Execute este script no diretório do projeto"
    exit 1
fi

# Criar rede se não existir
echo "🔧 Verificando rede app-net-weliv..."
if ! docker network ls | grep -q "app-net-weliv"; then
    echo "📡 Criando rede app-net-weliv..."
    docker network create --driver bridge app-net-weliv
    echo "✅ Rede app-net-weliv criada com sucesso!"
else
    echo "✅ Rede app-net-weliv já existe"
fi

# Verificar se infraestrutura está rodando
echo "🔍 Verificando infraestrutura..."

if ! docker ps | grep -q "weliv-db"; then
    echo "⚠️ Database não está rodando. Execute: ./scripts/start-database.sh"
    exit 1
fi

# Parar apenas o backend
echo "🛑 Parando backend..."
docker compose -f docker/docker-compose.prod.yml stop backend

# Reconstruir e iniciar apenas o backend
echo "🔨 Reconstruindo backend..."
docker compose -f docker/docker-compose.prod.yml build --no-cache backend
docker compose -f docker/docker-compose.prod.yml up -d backend

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 15

# Verificar status
echo "📊 Status do backend:"
docker compose -f docker/docker-compose.prod.yml ps backend

# Testar health check (compose prod expõe 30100; use BACKEND_HEALTH_URL para outro endpoint)
BACKEND_HEALTH_URL="${BACKEND_HEALTH_URL:-http://localhost:30100/health}"
echo "🏥 Testando health check ($BACKEND_HEALTH_URL)..."
sleep 5
curl -sf "$BACKEND_HEALTH_URL" && echo "✅ Backend OK" || echo "❌ Backend falhou"

echo ""
echo "✅ Deploy do backend concluído!"
echo "🌐 API local (WSL): http://localhost:30100"
echo "   Produção: defina BACKEND_HEALTH_URL se o health estiver atrás de outro host/caminho."
echo ""
echo "📋 Comandos úteis:"
echo "  - Logs: docker compose -f docker/docker-compose.prod.yml logs -f backend"
echo "  - Restart: docker compose -f docker/docker-compose.prod.yml restart backend"

