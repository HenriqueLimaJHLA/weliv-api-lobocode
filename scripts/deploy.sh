#!/usr/bin/env bash

# Script principal de deploy do weliv
# Uso: ./scripts/deploy.sh [comando]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para exibir ajuda
show_help() {
    echo -e "${BLUE}🚀 Script Principal de Deploy - weliv${NC}"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  network     - Gerenciar rede app-net-weliv"
    echo "  infra       - Deploy da infraestrutura (Nginx)"
    echo "  backend     - Deploy do backend apenas"
    echo "  unified     - Deploy completo unificado"
    echo "  database    - Iniciar apenas database"
    echo "  monitoring  - Iniciar monitoramento"
    echo "  minio       - Iniciar apenas MinIO"
    echo "  status      - Verificar status dos serviços"
    echo "  logs        - Ver logs dos serviços"
    echo "  stop        - Parar todos os serviços"
    echo "  cleanup     - Limpar recursos não utilizados"
    echo "  help        - Exibir esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 network create"
    echo "  $0 infra"
    echo "  $0 unified"
    echo "  $0 status"
}

# Função para verificar se está no diretório correto
check_directory() {
    if [ ! -f "docker/docker-compose.yml" ]; then
        echo -e "${RED}❌ Erro: Execute este script no diretório do projeto${NC}"
        exit 1
    fi
}

# Função para gerenciar rede
manage_network() {
    "$SCRIPT_DIR/network-manager.sh" "$1"
}

# Função para deploy de infraestrutura
deploy_infra() {
    echo -e "${BLUE}🏗️ Deploy Infraestrutura - weliv${NC}"
    "$SCRIPT_DIR/deploy-infrastructure.sh"
}

# Função para deploy do backend
deploy_backend() {
    echo -e "${BLUE}🚀 Deploy Backend - weliv${NC}"
    "$SCRIPT_DIR/deploy-backend-only.sh"
}

# Função para deploy unificado
deploy_unified() {
    echo -e "${BLUE}🚀 Deploy Unificado - weliv${NC}"
    "$SCRIPT_DIR/deploy-unified.sh"
}

# Função para iniciar database
start_database() {
    echo -e "${BLUE}🗄️ Iniciando Database - weliv${NC}"

    # Criar rede se não existir
    if ! docker network ls | grep -q "app-net-weliv"; then
        echo "📡 Criando rede app-net-weliv..."
        docker network create --driver bridge app-net-weliv
    fi

    docker compose -f docker/docker-compose.database.yml up -d
    echo "✅ Database iniciado!"
}

# Função para iniciar monitoramento
start_monitoring() {
    echo -e "${BLUE}📊 Iniciando Monitoramento - weliv${NC}"

    # Criar rede se não existir
    if ! docker network ls | grep -q "app-net-weliv"; then
        echo "📡 Criando rede app-net-weliv..."
        docker network create --driver bridge app-net-weliv
    fi

    docker compose -f docker/docker-compose.monitoring.yml up -d
    echo "✅ Monitoramento iniciado!"
}

# Função para iniciar MinIO
start_minio() {
    echo -e "${BLUE}📁 Iniciando MinIO - weliv${NC}"

    # Criar rede se não existir
    if ! docker network ls | grep -q "app-net-weliv"; then
        echo "📡 Criando rede app-net-weliv..."
        docker network create --driver bridge app-net-weliv
    fi

    docker compose -f docker/docker-compose.minio.yml up -d
    echo "✅ MinIO iniciado!"
}

# Função para verificar status
check_status() {
    echo -e "${BLUE}📊 Status dos Serviços - weliv${NC}"
    echo ""

    # Status da rede
    echo "🔗 Status da rede:"
    "$SCRIPT_DIR/network-manager.sh" status
    echo ""

    # Status dos containers
    echo "🐳 Status dos containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep weliv
}

# Função para ver logs
show_logs() {
    echo -e "${BLUE}📋 Logs dos Serviços - weliv${NC}"
    echo ""
    echo "Escolha o serviço para ver logs:"
    echo "  1. Backend"
    echo "  2. Database"
    echo "  3. Redis"
    echo "  4. MinIO"
    echo "  5. Nginx"
    echo "  6. Prometheus"
    echo "  7. Grafana"
    echo "  8. Todos"
    echo ""
    read -p "Digite o número (1-8): " choice

    case $choice in
        1)
            docker compose -f docker/docker-compose.prod.yml logs -f backend
            ;;
        2)
            docker compose -f docker/docker-compose.database.yml logs -f db
            ;;
        3)
            docker compose -f docker/docker-compose.database.yml logs -f redis
            ;;
        4)
            docker compose -f docker/docker-compose.unified.yml logs -f minio
            ;;
        5)
            docker compose -f docker/docker-compose.infrastructure.yml logs -f nginx
            ;;
        6)
            docker compose -f docker/docker-compose.monitoring.yml logs -f prometheus
            ;;
        7)
            docker compose -f docker/docker-compose.monitoring.yml logs -f grafana
            ;;
        8)
            docker compose -f docker/docker-compose.unified.yml logs -f
            ;;
        *)
            echo "Opção inválida"
            ;;
    esac
}

# Função para parar todos os serviços
stop_all() {
    echo -e "${BLUE}🛑 Parando todos os serviços - weliv${NC}"

    docker compose -f docker/docker-compose.unified.yml down
    docker compose -f docker/docker-compose.prod.yml down
    docker compose -f docker/docker-compose.backend.yml down
    docker compose -f docker/docker-compose.database.yml down
    docker compose -f docker/docker-compose.infrastructure.yml down
    docker compose -f docker/docker-compose.monitoring.yml down

    echo "✅ Todos os serviços parados!"
}

# Função para limpeza
cleanup() {
    echo -e "${BLUE}🧹 Limpeza de recursos - weliv${NC}"

    # Parar containers órfãos
    docker compose -f docker/docker-compose.unified.yml down --remove-orphans
    docker compose -f docker/docker-compose.prod.yml down --remove-orphans
    docker compose -f docker/docker-compose.backend.yml down --remove-orphans
    docker compose -f docker/docker-compose.database.yml down --remove-orphans
    docker compose -f docker/docker-compose.infrastructure.yml down --remove-orphans
    docker compose -f docker/docker-compose.monitoring.yml down --remove-orphans

    # Limpar recursos não utilizados
    docker system prune -f

    echo "✅ Limpeza concluída!"
}

# Verificar se está no diretório correto
check_directory

# Processar argumentos
case "${1:-help}" in
    network)
        manage_network "$2"
        ;;
    infra)
        deploy_infra
        ;;
    backend)
        deploy_backend
        ;;
    unified)
        deploy_unified
        ;;
    database)
        start_database
        ;;
    monitoring)
        start_monitoring
        ;;
    minio)
        start_minio
        ;;
    status)
        check_status
        ;;
    logs)
        show_logs
        ;;
    stop)
        stop_all
        ;;
    cleanup)
        cleanup
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Comando inválido: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac

