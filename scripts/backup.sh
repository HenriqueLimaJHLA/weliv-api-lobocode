#!/usr/bin/env bash
#
# Backup lógico do PostgreSQL do container weliv-db (gzip em backups/).
# Uso: ./scripts/backup.sh
# Requer: Docker com o container weliv-db em execução.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

BACKUP_DIR="$ROOT_DIR/backups"
mkdir -p "$BACKUP_DIR"

if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker não está acessível. Inicie o Docker e tente de novo."
    exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx 'weliv-db'; then
    echo "❌ Container weliv-db não está em execução. Inicie o banco (ex.: ./scripts/start-database.sh)."
    exit 1
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
OUT="$BACKUP_DIR/weliv_pg_${STAMP}.sql.gz"

echo "📦 Gerando backup em $OUT ..."
docker exec weliv-db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' | gzip -c > "$OUT"
echo "✅ Backup concluído."
