# 🔍 Audit do Repositório - LOBO CODE AI SOFTWARE FACTORY

**Data:** 2026-06-09  
**Analista:** Claude (AI Software Factory)  
**Versão:** 3.0

---

## 1. Stack Tecnológica

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| NestJS | 11+ | Framework backend |
| Prisma | 6+ | ORM |
| PostgreSQL | - | Banco de dados |
| TypeScript | 5+ | Linguagem |
| Redis | - | Cache/Sessions |
| MinIO | - | Storage (arquivos) |
| JWT | - | Autenticação |
| CASL | 6+ | Autorização/Permissões |
| class-validator | 0.14+ | Validação |
| Swagger | 11+ | Documentação API |
| Jest | 29+ | Testes |
| Docker | - | Containerização |

---

## 2. Estrutura de Diretórios

```
src/
├── main.ts                          # Bootstrap
├── app.module.ts                    # Módulo raiz
├── app.controller.ts
├── app.service.ts
├── config/
│   └── setup-swagger.ts
├── modules/
│   ├── users/                      # Módulo Usuários
│   │   ├── administrator/
│   │   └── user/
│   ├── companies/ # Módulo Empresas
│   │   └── administrator/
│   ├── settings/                    # Módulo Configurações
│   │   └── administrator/
│   ├── notifications/              # Módulo Notificações
│   │   ├── channels/
│   │   │   ├── email/
│   │   │   ├── push/
│   │   │   ├── sms/
│   │   │   ├── whatsapp/
│   │   │   └── in-app/
│   │   └── notifications/
│   └── template/                   # 📋 TEMPLATES DE REFERÊNCIA
│       ├── minimal/                # CRUD puro
│       ├── standard/                # Com hooks
│       └── complex/                 # Com sub-serviços
└── shared/
    ├── universal/                  # 🚀 MOTOR DO SISTEMA
    │   ├── controllers/
    │   │   └── universal.controller.ts
    │   ├── repositories/
    │   │   └── universal.repository.ts
    │   ├── services/
    │   │   ├── universal.service.ts
    │   │   ├── query.service.ts
    │   │   ├── permission.service.ts
    │   │   └── metrics.service.ts
    │   ├── types.ts
    │   └── universal.module.ts
    ├── auth/                        # JWT, CASL, Guards
    ├── prisma/                      # PrismaService
    ├── casl/ # Permissões
    ├── tenant/                      # Multi-tenancy
    ├── files/                       # Upload MinIO
    ├── config/                      # Configurações
    │   ├── entities.config.ts
    │   ├── casl-role-permissions.config.ts
    │   └── messages.config.ts
    ├── validators/                  # Validadores custom
    ├── email/                       # Email service
    ├── geocoding/                  # Geocoding
    ├── asaas/                       # Integração Asaas
    └── ...

prisma/
├── schema/
│   ├── base.prisma                 # Configuração base
│   ├── user.prisma                 # User
│   ├── company.prisma               # Company
│   ├── files.prisma                 # File
│   ├── notifications.prisma        # Notifications
│   └── settings.prisma             # Settings
└── seed.ts
```

---

## 3. Padrões Arquiteturais

### 3.1 UniversalController

**Local:** `src/shared/universal/controllers/universal.controller.ts`

**Rotas herdadas:**
- `GET /` → `buscarComPaginacao`
- `GET /all` → `buscarTodos`
- `GET /:id` → `buscarPorId`
- `POST /` → `criar`
- `PATCH /:id` → `atualizar`
- `DELETE /:id` → `desativar`
- `POST /:id/restore` → `reativar`
- `GET /search/name` → `buscarPorNome`
- `GET /search/field` → `buscarPorCampo`
- `GET /metrics` → Métricas Prometheus

**Interceptors:** `TenantInterceptor`, `CaslInterceptor`

### 3.2 UniversalService

**Local:** `src/shared/universal/services/universal.service.ts`

**Métodos base:**
- `buscarPorId(id)`
- `buscarTodos()`
- `buscarComPaginacao(page, limit)`
- `buscarPorCampo(field, value)`
- `buscarMuitosPorCampo(field, value)`
- `criar(data)`
- `atualizar(id, data)`
- `desativar(id)` (soft delete)
- `reativar(id)`

**Hooks (sobrescrever):**
- `antesDeCriar(data)`
- `depoisDeCriar(entity)`
- `antesDeAtualizar(id, data)`
- `depoisDeAtualizar(id, data)`
- `antesDeDesativar(id)`
- `depoisDeDesativar(id)`
- `antesDeReativar(id)`
- `depoisDeReativar(id)`

**Helpers:**
- `obterUsuarioLogado()`
- `obterCompanyId()`
- `validarSeEhUnico(field, value)`

### 3.3 UniversalRepository

**Local:** `src/shared/universal/repositories/universal.repository.ts`

**Métodos:**
- `buscarPrimeiro(where, include)`
- `buscarMuitos(where, orderBy, skip, take, include)`
- `criar(entityName, data, include)`
- `atualizar(entityName, where, data, include)`
- `desativar(entityName, where)`
- `reativar(entityName, where)`
- `contarTodos(entityName, where)`

---

## 4. Módulos Existentes

| Módulo | Camada | Schema |
|--------|--------|--------|
| users | administrator, user | user.prisma |
| companies | administrator | company.prisma |
| settings | administrator | settings.prisma |
| notifications | channels | notifications.prisma |
| files (shared) | - | files.prisma |

---

## 5. Templates de Referência

| Camada | Local | Uso |
|--------|-------|-----|
| MINIMAL | `src/modules/template/minimal/` | CRUD puro, sem lógica custom |
| STANDARD | `src/modules/template/standard/` | Com hooks, validações |
| COMPLEX | `src/modules/template/complex/` | Com sub-serviços, lógica complexa |

**Como usar:** Copiar template e substituir placeholders (`Example` → `Product`)

---

## 6. Campos Obrigatórios (Schema)

Todo schema **DEVE** conter:

```prisma
model {{EntityName}} {
  id String @id @default(cuid())
  
  // Campos específicos...
  
  // Multi-tenancy
  companyId String
  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  // Auditoria
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Soft delete
  deletedAt DateTime?
  
  // Índices
  @@index([companyId])
  @@index([deletedAt])
  
  @@map("plural_snake_case")
}
```

---

## 7. Checklist de Validação

Ao criar novo módulo:

- [ ] Escolher template (minimal/standard/complex)
- [ ] Copiar estrutura do template
- [ ] Substituir placeholders na ordem correta
- [ ] Schema Prisma em `prisma/schema/<domain>.prisma`
- [ ] Campos obrigatórios (companyId, timestamps, soft delete)
- [ ] Índices definidos
- [ ] DTOs com validações (class-validator)
- [ ] DTOs com ApiProperty (Swagger)
- [ ] Service estende `UniversalService`
- [ ] Controller estende `UniversalController`
- [ ] Roles definidas (`@RoleByMethod`)
- [ ] Registrado em `entities.config.ts`
- [ ] Permissões CASL em `casl-role-permissions.config.ts`
- [ ] Importado em `app.module.ts`
- [ ] `npx prisma generate` executado
- [ ] Compilação verificada (`npx tsc --noEmit`)

---

## 8. Referências

| Arquivo | Descrição |
|---------|-----------|
| `.ai/SCOPE-MODULE-GUIDE.md` | Como pedir para IA construir módulos |
| `.ai/execution-skill.md` | Protocolo de execução da IA |
| `.ai/conventions.md` | Convenções de código |
| `src/modules/template/COMO-USAR.md` | Como usar templates |
| `CLAUDE.md` | Regras para IA |

---

**Audit gerado pela AI Software Factory v3.0**
