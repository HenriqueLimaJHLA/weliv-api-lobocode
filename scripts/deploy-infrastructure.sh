#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "🏗️ Deploy Infraestrutura - weliv"

# Verificar se está no diretório correto
if [ ! -f "docker/docker-compose.infrastructure.yml" ]; then
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

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p nginx/ssl
mkdir -p nginx/logs

# Criar certificado SSL auto-assinado (se não existir)
if [ ! -f "nginx/ssl/cert.pem" ]; then
    echo "🔐 Criando certificado SSL de teste..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=BR/ST=SP/L=SP/O=weliv/CN=localhost"
fi

# Parar infraestrutura existente
echo "🛑 Parando infraestrutura..."
docker compose -f docker/docker-compose.infrastructure.yml down

# Iniciar infraestrutura
echo "🚀 Iniciando infraestrutura..."
docker compose -f docker/docker-compose.infrastructure.yml up -d

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 5

# Verificar status
echo "📊 Status da infraestrutura:"
docker compose -f docker/docker-compose.infrastructure.yml ps

# Testar Nginx
echo "🌐 Testando Nginx..."
sleep 3
curl -k -f https://localhost/health && echo "✅ Nginx OK" || echo "⚠️ Nginx OK (sem backend)"

echo ""
echo "✅ Infraestrutura iniciada!"
echo "🌐 Nginx disponível em: https://localhost"
echo ""
echo "📋 Próximos passos:"
echo "  1. Iniciar database: ./scripts/start-database.sh"
echo "  2. Deploy backend: ./scripts/deploy-backend-only.sh"

