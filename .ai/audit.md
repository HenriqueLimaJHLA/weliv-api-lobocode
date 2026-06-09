# 🔍 Audit do Repositório - LOBO CODE AI SOFTWARE FACTORY

**Data:** 2026-06-08  
**Analista:** Claude (AI Software Factory)  
**Versão:** 2.0

---

## 1. Stack Tecnológica

| Tecnologia | Uso |
|------------|-----|
| NestJS 10+ | Framework backend |
| Prisma 5+ | ORM |
| PostgreSQL | Banco de dados |
| TypeScript 5+ | Linguagem |
| CASL | Autorização |
| class-validator | Validação |
| Swagger | Documentação API |
| Jest | Testes |

---

## 2. Estrutura de Diretórios

```
src/
├── main.ts                          # Bootstrap
├── app.module.ts                    # Módulo raiz
├── config/                          # Configurações
│   └── setup-swagger.ts
├── modules/                         # Módulos de domínio
│   ├── companies/
│   └── template/                   # Templates de referência
│       ├── minimal/               # CRUD puro
│       ├── standard/              # Com hooks
│       └── complex/               # Com sub-serviços
└── shared/                          # Código compartilhado
    ├── universal/                  # 🚀 MOTOR
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
    ├── auth/ # JWT, CASL
    ├── prisma/                     # PrismaService
    ├── casl/                       # Permissões
    ├── tenant/                     # Multi-tenancy
    ├── config/                     # Configurações
    │   ├── entities.config.ts
    │   ├── casl-role-permissions.config.ts
    │   └── messages.config.ts
    └── ...

prisma/
├── schema/
│   ├── base.prisma                # Configuração base
│   ├── company-user.prisma        # User, Company
│   └── *.prisma                   # Schemas modulares
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

## 4. Entidades Core

###4.1 User

```prisma
model User {
  id String @id @default(cuid())
  name String
  email String @unique
  password String
  role Roles @default(USER)
  status UserStatus @default(ACTIVE)
  companyId String?
  company Company? @relation(...)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
}
```

### 4.2 Company

```prisma
model Company {
  id String @id @default(cuid())
  name String
  cnpj String? @unique
  status CompanyStatus @default(PENDING)
  users User[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
}
```

### 4.3 Roles

```prisma
enum Roles {
  USER
  ADMIN
  SYSTEM_ADMIN
}
```

---

## 5. Mapeamento Prisma ↔ CASL

**Arquivo:** `src/shared/config/entities.config.ts`

```typescript
export const PROJECT_ENTITY_MAPPING = {
  // Core
  user: 'User',
  company: 'Company',
  file: 'File',
  notification: 'Notification',
  // Plugins
  product: 'Product',
  booking: 'Booking',
  // ...
} as const;
```

---

## 6. Templates de Referência

| Camada | Local | Uso |
|--------|-------|-----|
| MINIMAL | `src/modules/template/minimal/` | CRUD puro |
| STANDARD | `src/modules/template/standard/` | Com hooks |
| COMPLEX | `src/modules/template/complex/` | Com sub-serviços |

---

## 7. Campos Obrigatórios (Schema)

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

## 8. Checklist de Validação

Ao criar novo módulo:

- [ ] Schema Prisma em `prisma/schema/<domain>.prisma`
- [ ] Campos obrigatórios (companyId, timestamps, soft delete)
- [ ] Índices definidos
- [ ] DTOs com validações
- [ ] Service estende `UniversalService`
- [ ] Controller estende `UniversalController`
- [ ] Roles definidas (`@RoleByMethod`)
- [ ] Registrado em `entities.config.ts`
- [ ] Permissões CASL em `casl-role-permissions.config.ts`
- [ ] Importado em `app.module.ts`
- [ ] Migration gerada

---

**Audit gerado pela AI Software Factory v2.0**