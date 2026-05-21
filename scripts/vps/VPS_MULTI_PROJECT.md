# VPS multi-projeto com porta padrão interna

Este modelo permite subir vários projetos/microserviços na mesma VPS, mantendo o backend interno sempre na porta `3000`, sem conflito entre stacks.

## Como funciona

- Cada app roda no Docker com `PORT=3000` (interno).
- Nenhuma app publica `3000` no host.
- Um único gateway (Traefik) publica `80/443`.
- O roteamento externo é por domínio (`APP_HOST`).
- Cada projeto sobe sua própria stack base (`backend + postgres + redis + minio`).

## Arquivos adicionados

- `traefik/docker-compose.vps-gateway.yml`
- `docker/docker-compose.vps-app.yml`
- `scripts/vps/deploy-gateway.sh`
- `scripts/vps/deploy-app.sh`

## Subir o gateway uma única vez (na VPS)

```bash
export LETSENCRYPT_EMAIL="devops@seudominio.com"
./scripts/deploy.sh vps-gateway
```

## Subir cada projeto

```bash
export PROJECT_NAME="cliente-a"
export APP_HOST="api.cliente-a-hml.seudominio.com"
export APP_PORT="3000"
./scripts/deploy.sh vps-app
```

Para outro projeto, altere somente `PROJECT_NAME` e `APP_HOST`.

## Deploy individual por serviço

Para atualizar somente um serviço/microserviço sem subir a stack inteira:

```bash
# Backend (atalho)
./scripts/deploy.sh vps-backend

# Serviço específico (genérico)
./scripts/deploy.sh vps-service redis
./scripts/deploy.sh vps-service minio
```

Observação: para `backend`, o `APP_HOST` deve estar configurado no `.env`.

## Novos serviços (plug and play)

O arquivo `docker/docker-compose.vps-app.yml` já possui blocos comentados de exemplo para:

- `notifications-worker`
- `keycloak`

As variáveis opcionais relacionadas também estão pré-definidas no `.env` como comentários.

## Vantagens

- Padroniza backend em `3000` interno para todos os projetos.
- Evita guerra de portas no host (`3000`, `3002`, `3003`...).
- Mantém isolamento por stack (`docker compose -p PROJECT_NAME`).
- Escala para microserviços e múltiplos clientes com menor custo operacional.

## Observações

- `APP_HOST` precisa apontar no DNS para a VPS.
- Para emissão TLS automática, a porta `80` deve estar pública.
- Banco e Redis ficam privados na rede do projeto (não expostos externamente).
