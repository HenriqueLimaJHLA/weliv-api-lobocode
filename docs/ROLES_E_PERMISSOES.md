# Roles, JWT e permissões (CASL)

## Roles no banco (`Roles` — Prisma)

Valores persistidos em `User.role`:

- `SYSTEM_ADMIN`
- `ADMIN`
- `PATIENT`
- `PROFESSIONAL`

O seed (`prisma/seed.ts`) cria exemplos: um `SYSTEM_ADMIN`, um `PROFESSIONAL` e um `PATIENT` (este último sem `companyId`).

## Payload do access token (JWT)

Interface: `src/shared/auth/interfaces/token-payload.interface.ts`

Campos relevantes:

- `sub` — ID do utilizador (usado como `user.id` no frontend após decode)
- `name`, `email`
- `role` — valor do enum `Roles`

O frontend React (`weliv-app-lobocode`) decodifica o JWT no cliente e mapeia o papel para o modelo de UI em `src/app/lib/auth-token.ts`:

| `Roles` (API) | `UserRole` (app) |
|---------------|------------------|
| `SYSTEM_ADMIN` | `admin` |
| `ADMIN` | `admin` |
| `PROFESSIONAL` | `professional` |
| `PATIENT` | `patient` |

## Guardas e decoradores (auth)

- `AuthGuard` — rotas protegidas por Bearer token.
- `RefreshGuard` — renovação de sessão.
- `RateLimitGuard` — aplicado a login/refresh.
- `@Public()` — marca rotas públicas no controlador de auth.
- `@RequiredRoles(...)` — usado no `UniversalController` para endpoints administrativos (ex.: métricas).

## CASL (`CaslAbilityService`)

Ficheiro: `src/shared/casl/casl-ability/casl-ability.service.ts`

- Ability com ações: `manage`, `create`, `read`, `update`, `delete`, `cancel`, `approve`, `export`.
- Integração `@casl/prisma` para condições em queries alinhadas ao Prisma.

### Regras por role (resumo)

| Role | Comportamento principal |
|------|-------------------------|
| `SYSTEM_ADMIN` | `can('manage', 'all')` — acesso total |
| `ADMIN` | Leitura/escrita na empresa (`companyId`), gestão de `User` com role `ADMIN`, gestão de `Document`, `Appointment`, `Client`, `Notification` (conforme regras definidas no ficheiro) |
| `PROFESSIONAL` | Mapa vazio no `rolePermissionsMap` — **sem permissões CASL explícitas** no código atual |
| `PATIENT` | Idem — **sem permissões CASL explícitas** no código atual |

**Implicação:** até que `PROFESSIONAL` e `PATIENT` tenham regras, rotas que dependem apenas de `AuthGuard` (ex.: `FilesController`) podem ser utilizadas por qualquer utilizador autenticado, enquanto validações CASL/`UniversalPermissionService` ainda não restringem esses papéis nos controladores concretos.

### Inconsistência schema × CASL

As abilities mencionam `Appointment` e `Client`, que **não** estão no `schema.prisma`. Ao implementar novos endpoints, alinhe os sujeitos CASL com modelos reais ou introduza os modelos em Prisma.

## Multi-tenancy

Módulo `shared/tenant`: interceptors e decoradores injetam/restringem `companyId` em operações. Trabalha em conjunto com `UniversalQueryService` para filtrar dados por empresa quando aplicável.

## Frontend: área administrativa

`AdminRouteGuard` no app exige `user.role === 'admin'`, ou seja utilizadores com `SYSTEM_ADMIN` ou `ADMIN` após o mapeamento do JWT. Rotas `/admin/*` estão desacopladas de chamadas REST específicas no estado atual (muitas páginas usam mocks).
