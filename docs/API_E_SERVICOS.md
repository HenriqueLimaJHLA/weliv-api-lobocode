# API HTTP, serviços e funções principais

Porta predefinida: **30100** (`PORT` no ambiente). Prefixo global: nenhum (controladores usam caminhos absolutos como `auth`, `files`).

## Aplicação raiz (`AppController`)

| Método | Caminho | Autenticação | Descrição |
|--------|---------|--------------|-----------|
| GET | `/` | — | Mensagem hello |
| GET | `/health` | — | `status`, `timestamp`, `uptime`, `environment` |
| POST | `/test` | — | Echo de body (uso de debug; evitar em produção sem proteção) |

## Autenticação (`AuthController` — prefixo `auth`)

Rotas **públicas** (marcadas com `@Public()`):

| Método | Caminho | Descrição |
|--------|---------|-----------|
| POST | `/auth/login` | Credenciais `LoginDto` (`login`, `password`); resposta `IAuthResponse` |
| POST | `/auth/refresh` | Corpo com `refreshToken`; novo par de tokens |
| POST | `/auth/forgot-password` | Solicita reset |
| POST | `/auth/validate-reset-token` | Valida token de reset |
| POST | `/auth/reset-password` | Define nova password |

Rotas **protegidas** (`AuthGuard`):

| Método | Caminho | Descrição |
|--------|---------|-----------|
| POST | `/auth/logout` | Revoga refresh token (204) |
| POST | `/auth/logout-all` | Revoga todos os refresh tokens do utilizador |
| GET | `/auth/metrics` | Métricas de autenticação (intervalo opcional) |
| GET | `/auth/security-metrics` | Métricas de segurança |
| GET | `/auth/real-time-metrics` | Métricas em tempo real |
| GET | `/auth/security-alerts` | Alertas de segurança |
| GET | `/auth/top-active-users` | Utilizadores mais ativos |
| GET | `/auth/export-metrics` | Exportação JSON/CSV |

Serviços envolvidos: `AuthService`, `LoginService`, `RefreshTokenService`, `PasswordResetService`, `AuditService`, `MetricsService` (auth), `AuthValidator`.

**JWT:** configurado em `AuthModule` com `JWT_SECRET`, `JWT_EXPIRES_IN`. Refresh usa `JWT_REFRESH_SECRET` ou fallback para `JWT_SECRET`.

## Ficheiros (`FilesController` — prefixo `files`)

Todas as rotas com `AuthGuard`.

| Método | Caminho | Descrição |
|--------|---------|-----------|
| POST | `/files/upload` | Multipart campo `file`; query `type`, opcional `description` |
| GET | `/files` | Lista paginada; filtro por `companyId` do utilizador |
| GET | `/files/:id` | Metadados |
| DELETE | `/files/:id` | Remoção lógica/de serviço conforme `FilesService` |

**`FilesService`:** cliente MinIO (`bucket` `weliv-files`), criação de registo `File` no Prisma. Variáveis: `MINIO_HOST`, `MINIO_PORT`, `MINIO_ENDPOINT`, `MINIO_USE_SSL`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` (ver implementação para derivação de host/porta).

## Camada Universal (serviços — sem rotas ativas)

### `UniversalService<DtoCreate, DtoUpdate>` (abstract)

Métodos públicos principais (todos passam por `UniversalPermissionService` e, onde aplicável, métricas):

| Método | Função |
|--------|--------|
| `buscarPorId` | Leitura por ID com include/transform |
| `buscarTodos` | Lista sem paginação |
| `buscarComPaginacao` | Lista com `page`, `limit` |
| `buscarPorCampo` / `buscarMuitosPorCampo` | Filtro dinâmico |
| `buscarPorCampos` / `buscarMuitosPorCampos` | Múltiplos campos |
| `criar` | Criação com hooks `antesDeCriar` / `depoisDeCriar` |
| `atualizar` | Atualização com hooks |
| `desativar` | Soft delete |
| `reativar` | Restauro |
| `validarExistencia` | Verificação de existência |

Hooks protegidos para sub-classes: `antesDeCriar`, `depoisDeCriar`, `antesDeAtualizar`, etc.

### `UniversalController` (abstract)

Define rotas REST padrão (GET listagem, GET `:id`, POST, PATCH, DELETE, restore, buscas, métricas). **Não há implementações registadas** no `AppModule` — ver [ESTRUTURA.md](./ESTRUTURA.md).

## Outros serviços transversais

- **`UniversalQueryService`:** constrói `where` com tenant e CASL para leitura/atualização/delete.
- **`UniversalPermissionService`:** valida ação contra ability do utilizador.
- **`UniversalMetricsService`:** contadores/histogramas quando `ENABLE_PROMETHEUS_METRICS=true`.
- **`TenantService` / interceptors:** propaga `companyId`.
- **`PrismaService`:** acesso à base de dados.
- **`MessagesService`:** textos de erro/sucesso padronizados.

## CORS (relevante para o frontend)

Em `main.ts`, origens permitidas incluem `http://localhost:5173`, `127.0.0.1` em qualquer porta local, e hosts listados explicitamente. Métodos: GET, POST, PUT, DELETE, PATCH, OPTIONS. Headers: `Content-Type`, `Authorization`.

## Seed

`prisma/seed.ts`: cria empresa “Weliv” se não existir e três utilizadores de teste (passwords hasheadas com bcrypt). Chamado também no `bootstrap` de `main.ts`.
