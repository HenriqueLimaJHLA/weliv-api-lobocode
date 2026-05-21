#!/bin/bash
set -e

# Entrypoint que garante que a senha do Postgres sempre bate com POSTGRES_PASSWORD.
# Assim, se você mudar DB_PASSWORD no .env e reiniciar o container, a senha no banco
# é atualizada e o backend/pgAdmin continuam conseguindo conectar (sem precisar resetar na mão).

echo "🚀 [postgres-entrypoint] Iniciando PostgreSQL..."

# Executar entrypoint oficial do PostgreSQL em background (stdin fechado para não receber EOF e morrer)
</dev/null /usr/local/bin/docker-entrypoint.sh postgres "$@" &
POSTGRES_PID=$!

term_handler() {
  echo "🛑 [postgres-entrypoint] Encerrando PostgreSQL..."
  if [ -n "${POSTGRES_PID:-}" ] && kill -0 "$POSTGRES_PID" > /dev/null 2>&1; then
    kill -TERM "$POSTGRES_PID" > /dev/null 2>&1 || true
    wait "$POSTGRES_PID" || true
  fi
  exit 0
}
trap term_handler SIGTERM SIGINT

# Aguardar PostgreSQL estar pronto
echo "⏳ [postgres-entrypoint] Aguardando PostgreSQL..."
for i in $(seq 1 60); do
  if pg_isready -U "${POSTGRES_USER:-postgres}" > /dev/null 2>&1; then
    echo "✅ [postgres-entrypoint] PostgreSQL pronto."
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "❌ [postgres-entrypoint] Timeout aguardando PostgreSQL"
    exit 1
  fi
  sleep 1
done

sleep 2

# Garantir que a senha no banco bate com POSTGRES_PASSWORD (evita "senha parou de funcionar")
# -h /var/run/postgresql = socket Unix (regra "local" no pg_hba, trust), evita "password authentication failed"
if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "⚠️ [postgres-entrypoint] POSTGRES_PASSWORD vazio - senha NÃO será sincronizada."
  echo "   Verifique DB_PASSWORD no docker/.env. Conexões podem falhar depois de um tempo."
else
  echo "🔐 [postgres-entrypoint] Sincronizando senha com POSTGRES_PASSWORD..."
  sync_ok=0
  for attempt in 1 2 3 4 5; do
    if psql -h /var/run/postgresql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-postgres}" -v ON_ERROR_STOP=1 -c "ALTER USER \"${POSTGRES_USER:-postgres}\" PASSWORD '${POSTGRES_PASSWORD}';" 2>&1; then
      echo "✅ [postgres-entrypoint] Senha sincronizada com sucesso."
      sync_ok=1
      break
    fi
    if [ "$attempt" -lt 5 ]; then
      echo "   Tentativa $attempt falhou, aguardando 2s..."
      sleep 2
    fi
  done
  if [ "$sync_ok" -eq 0 ]; then
    echo "⚠️ [postgres-entrypoint] Não foi possível sincronizar a senha (container segue em frente). Ajuste manual se precisar."
  fi
fi

# Sinalizar que a senha já foi sincronizada — o healthcheck só passa depois disso (evita backend conectar antes)
touch /tmp/postgres-entrypoint-done
echo "✅ [postgres-entrypoint] PostgreSQL pronto para conexões."

# Manter script vivo até o processo do Postgres encerrar (evita exit por set -e se wait retornar não-zero)
wait $POSTGRES_PID
exit $?
