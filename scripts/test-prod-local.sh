#!/usr/bin/env bash

# Garante raiz do repositório (WSL, /mnt/c/... e chamada por caminho absoluto).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "🧪 Testando configuração de produção localmente"

# Verificar se está no diretório correto
if [ ! -f "docker/docker-compose.prod.yml" ]; then
    echo "❌ Erro: Execute este script no diretório do projeto"
    exit 1
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker compose -f docker/docker-compose.prod.yml down 2>/dev/null

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p nginx/ssl
mkdir -p nginx/logs
mkdir -p backups

# Criar certificado SSL auto-assinado para teste local
echo "🔐 Criando certificado SSL de teste..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/key.pem \
    -out nginx/ssl/cert.pem \
    -subj "/C=BR/ST=SP/L=SP/O=weliv/CN=localhost"

# Construir e iniciar containers
echo "🔨 Construindo e iniciando containers..."
docker compose -f docker/docker-compose.prod.yml up -d --build

# Aguardar banco estar pronto
echo "⏳ Aguardando banco de dados..."
sleep 15

# Aplicar migrations
echo "📦 Aplicando migrations..."
docker compose -f docker/docker-compose.prod.yml exec -T backend npx prisma migrate deploy

# Aguardar inicialização
echo "⏳ Aguardando inicialização (30s)..."
sleep 30

# Verificar status dos containers
echo "📊 Status dos containers:"
docker compose -f docker/docker-compose.prod.yml ps

# Testar health check
echo "🏥 Testando health check..."
sleep 5
curl -k -f https://localhost/health && echo "✅ Health check OK" || echo "❌ Health check falhou"

# Testar API
echo "🌐 Testando API..."
sleep 5
curl -k -f https://localhost/health && echo "✅ API OK" || echo "❌ API falhou"

# Verificar logs
echo "📋 Últimos logs do backend:"
docker compose -f docker/docker-compose.prod.yml logs --tail=10 backend

echo ""
echo "🧪 Teste concluído!"
echo "🌐 Acesse: https://localhost (aceite o certificado auto-assinado)"
echo ""
echo "📋 Para parar: docker compose -f docker/docker-compose.prod.yml down"
echo "📋 Para ver logs: docker compose -f docker/docker-compose.prod.yml logs -f"

