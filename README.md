# Weliv API (NestJS + Prisma)

API HTTP e WebSockets do ecossistema **Weliv**, construída com **NestJS 11**, **Prisma 6** e **PostgreSQL**. Este serviço expõe autenticação JWT, upload de ficheiros (MinIO), métricas Prometheus e uma camada genérica de CRUD/permissões preparada para evolução do domínio.

O frontend de referência no monorepo é **`weliv-app-lobocode`** (React + Vite). A URL base esperada em desenvolvimento é `http://localhost:30100` (configurável via `PORT`).

## Documentação detalhada

| Documento | Conteúdo |
|-----------|----------|
| [docs/ESTRUTURA.md](./docs/ESTRUTURA.md) | Pastas, módulos Nest e responsabilidades |
| [docs/ENTIDADES.md](./docs/ENTIDADES.md) | Modelos Prisma, enums e relações |
| [docs/ROLES_E_PERMISSOES.md](./docs/ROLES_E_PERMISSOES.md) | Papéis (`Roles`), JWT e CASL |
| [docs/API_E_SERVICOS.md](./docs/API_E_SERVICOS.md) | Rotas expostas, serviços centrais e camada universal |
| [docs/INTEGRACAO_FRONTEND.md](./docs/INTEGRACAO_FRONTEND.md) | Como o app React consome a API e mapeamento de roles |
| [docs/PRISMA_RELACIONAMENTOS.md](./docs/PRISMA_RELACIONAMENTOS.md) | Relacionamentos entre modelos Prisma e diagramas ER (Mermaid) |

Documentação adicional existente: `src/shared/auth/README.md`, `src/shared/casl/README.md`, `docker/README.md`, `nginx/README.md`, etc.

## Requisitos

- Node.js compatível com o `package.json` do projeto
- PostgreSQL acessível via `DATABASE_URL`
- (Opcional) MinIO para uploads — ver [docs/API_E_SERVICOS.md](./docs/API_E_SERVICOS.md)
- Variáveis de ambiente — ver secção abaixo (não commite segredos; o ficheiro `.env` local não faz parte do controlo de versão por defeito)

## Variáveis de ambiente (referência)

Defina no `.env` na raiz de `weliv-api-lobocode` (valores reais são da sua responsabilidade; não sobrescreva `.env` sem confirmação explícita).

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | Ligação PostgreSQL (Prisma) |
| `JWT_SECRET` | Assinatura do access token (obrigatório em produção) |
| `JWT_REFRESH_SECRET` | Assinatura do refresh token (fallback: `JWT_SECRET`) |
| `JWT_EXPIRES_IN` | Expiração do access token (ex.: `15m`) |
| `PORT` | Porta HTTP (predefinição: `30100`) |
| `NODE_ENV` | `development` / `production` |
| `RATE_LIMIT_MAX_REQUESTS` | Limite opcional de pedidos (rate limit global) |
| `ENABLE_PROMETHEUS_METRICS` | `true` para métricas adicionais na camada universal |
| `MINIO_HOST`, `MINIO_PORT`, `MINIO_ENDPOINT`, `MINIO_USE_SSL` | Cliente MinIO |
| `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` | Credenciais MinIO |

## Scripts npm

| Comando | Descrição |
|---------|-----------|
| `npm run start:dev` | Migrações dev + seed + servidor com `--watch` |
| `npm run build` | Compilação Nest |
| `npm run start:prod` | Executa `dist/src/main` (após build) |
| `npm run db:init:dev` | `prisma generate` + `migrate dev` |
| `npm run prisma:seed` | Executa `prisma/seed.ts` |
| `npm run prisma:studio` | Prisma Studio |
| `npm run docker:dev` | Compose para desenvolvimento (ver `docker/`) |

**Nota:** `src/main.ts` invoca `runSeed()` no arranque; em ambientes partilhados avalie se o seed deve ser condicionado a `NODE_ENV` ou executado apenas em pipelines.

## Arranque rápido (desenvolvimento)

1. Instalar dependências: `npm install`
2. Configurar `.env` com `DATABASE_URL` e segredos JWT
3. `npm run start:dev`

Verificações úteis:

- `GET /health` — estado do serviço
- `GET /metrics` — métricas Prometheus (registo em `AppModule`)

## Integração com o frontend (Weliv App)

- Variável Vite: `VITE_API_BASE_URL` (predefinição no código do app: `http://localhost:30100`)
- Login: `POST /auth/login` com corpo `{ "login": string, "password": string }`
- Resposta: `access_token`, `refresh_token`, `expires_in`, `token_type`
- O frontend decodifica o JWT e mapeia `SYSTEM_ADMIN` e `ADMIN` para o papel de UI `admin`

Detalhes em [docs/INTEGRACAO_FRONTEND.md](./docs/INTEGRACAO_FRONTEND.md).

## Licença e autor

Conforme `package.json` do projeto (`UNLICENSED`, autor indicado no manifest).
