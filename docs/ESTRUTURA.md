# Estrutura do projeto (Weliv API)

## Visão geral de pastas

```
weliv-api-lobocode/
├── prisma/
│   ├── schema.prisma      # Modelo de dados e enums
│   └── seed.ts            # Dados iniciais (empresa + utilizadores de exemplo)
├── src/
│   ├── main.ts            # Bootstrap: CORS, WebSocket, seed, porta, métricas globais
│   ├── app.module.ts      # Módulo raiz: pipes, filtros, interceptors, imports
│   ├── app.controller.ts  # Rotas raiz: GET /, GET /health, POST /test
│   └── shared/            # Código transversal (auth, prisma, tenant, casl, ficheiros, etc.)
├── docker/                # Compose e notas (README próprio)
└── nginx/                 # Configuração de proxy (README próprio)
```

## Módulos NestJS registados em `AppModule`

| Módulo | Ficheiro | Função |
|--------|----------|--------|
| `ConfigModule` | `@nestjs/config` | Variáveis de ambiente globais (`.env`) |
| `LoggerModule` | `shared/common/logger` | Logging (Winston) |
| `MessagesModule` | `shared/common/messages` | Mensagens centralizadas de erro/sucesso |
| `PrismaModule` | `shared/prisma` | Cliente Prisma injectável |
| `CaslModule` | `shared/casl` | Ability factory por utilizador (autorização) |
| `TenantModule` | `shared/tenant` | Multi-tenancy (`companyId` em query/body) |
| `UniversalModule` | `shared/universal` | Repositório/serviços genéricos de CRUD + métricas de entidade |
| `PrometheusModule` | `@willsoto/nestjs-prometheus` | Métricas HTTP |
| `AuthModule` | `shared/auth` | JWT, login, refresh, reset de password, métricas de auth |
| `FilesModule` | `shared/files` | Upload/listagem/remoção com MinIO + Prisma |

## Camadas transversais relevantes

### Validação e erros

- `ValidationPipe` global em `app.module.ts` e reforço em `main.ts` (HTTP 422 em `main.ts` para o pipe global criado no factory).
- Filtros de exceção em `shared/common/filters` (Prisma, HTTP, auth, validação, etc.).

### Soft delete

- `SoftDeleteInterceptor` registado como `APP_INTERCEPTOR`.
- `UniversalService` assume soft delete para entidades com `deletedAt` no schema (lista de exceções interna atualmente vazia).

### Segurança e limitação

- `RateLimitMiddleware` aplicado a `*` em `AppModule.configure`.
- `MetricsInterceptor` global em `main.ts`.

### WebSockets

- `IoAdapter` do Socket.IO configurado no bootstrap para gateways futuros (notificações em tempo real, etc.).

## Camada “Universal” (sem controladores concretos no estado atual)

O projeto inclui:

- `UniversalController` (abstract) com rotas CRUD, busca e métricas Prometheus por entidade.
- `UniversalService`, `UniversalRepository`, `UniversalQueryService`, `UniversalPermissionService`, `UniversalMetricsService`.

**Estado atual:** não existe nenhuma classe `extends UniversalController` no `src/`, pelo que **não há rotas REST geradas automaticamente para `User`, `Company`, etc.** A infraestrutura está pronta para novos módulos de domínio que a instanciem com DTOs e serviços concretos.

## Relação com o frontend

O repositório irmão **`weliv-app-lobocode`** consome principalmente `POST /auth/login` e está preparado para `Authorization: Bearer` em chamadas futuras. A estrutura de pastas do app está documentada em [INTEGRACAO_FRONTEND.md](./INTEGRACAO_FRONTEND.md).
