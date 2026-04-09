#!/usr/bin/env bash
# Gera uma senha forte para o PostgreSQL e mostra as linhas para colar no .env
# Uso: ./scripts/generate-db-password.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

# Senha: base64 24 bytes = 32 chars, sem caracteres que quebram URL (evita / + =)
PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)

echo "=============================================="
echo "Senha gerada (guarde em lugar seguro):"
echo "$PASS"
echo "=============================================="
echo ""
echo "Adicione ou atualize no .env na raiz do projeto:"
echo ""
echo "DB_PASSWORD=$PASS"
echo "DATABASE_URL=\"postgresql://postgres:$PASS@localhost:15432/weliv-engine?schema=public\""
echo ""
echo "Se o backend usa Docker e o compose injeta DATABASE_URL, basta:"
echo "DB_PASSWORD=$PASS"
echo ""
echo "Depois: docker compose -f docker/docker-compose.database.yml up -d --force-recreate db"
echo "=============================================="

