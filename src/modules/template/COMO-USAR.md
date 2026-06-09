# COMO USAR O TEMPLATE

Guia prático para copiar os templates de módulo NestJS da LOBOCODE.  
Documentação técnica completa: [`GERADOR DE MÓDULOS PADRÃO LOBOCODE.md`](./GERADOR%20DE%20MÓDULOS%20PADRÃO%20LOBOCODE.md).

---

## 1. Escolher camada e audiência

### Camadas (complexidade)

| Camada | Quando usar | O que contém |
|--------|-------------|--------------|
| **MINIMAL** | CRUD puro, sem regras de negócio extras | Module + Service + Controller + DTOs |
| **STANDARD** | Hooks de ciclo de vida, rotas extras, notificações | MINIMAL + `antesDe*` / `depoisDe*` + rotas literais |
| **COMPLEX** | Sub-serviços, queries avançadas, integrações | STANDARD + `services/*.service.ts` dedicados |

### Audiências (quem acessa)

| Pasta | Role HTTP | Prefixo de rota | Responsabilidade |
|-------|-----------|-----------------|------------------|
| **`user/`** | `USER` (+ leitura compartilhada com ADMIN) | `user/<recurso>` | Dados do usuário autenticado, leitura filtrada por CASL |
| **`administrator/`** | `ADMIN`, `SYSTEM_ADMIN` | `admin/<recurso>` | Gestão completa, listagens, stats, operação administrativa |

> Em produção, **user** e **administrator** podem virar **dois controllers no mesmo módulo** ou **dois módulos separados**. Os templates ficam isolados para facilitar a cópia.

---

## 2. Estrutura de pastas

```
src/modules/template/
├── minimal/
│   ├── user/
│   │   ├── user-example.module.ts
│   │   ├── user-example.service.ts
│   │   ├── user-example.controller.ts      → @Controller('user/examples')
│   │   └── dto/
│   └── administrator/
│       ├── administrator-example.module.ts
│       ├── administrator-example.service.ts
│       ├── administrator-example.controller.ts  → @Controller('admin/examples')
│       └── dto/
│
├── standard/
│   ├── user/          ← hooks + GET /me, /by-code, /by-status
│   └── administrator/ ← hooks admin + GET /by-code, /by-status, /stats
│
└── complex/
    ├── user/
    │   ├── user-example.module.ts
    │   ├── user-example.service.ts
    │   ├── user-example.controller.ts
    │   ├── dto/
    │   └── services/
    │       └── user-example-context.service.ts
    └── administrator/
        ├── administrator-example.module.ts
        ├── administrator-example.service.ts
        ├── administrator-example.controller.ts
        ├── dto/
        └── services/
            ├── administrator-example-context.service.ts
            └── administrator-example-query.service.ts
```

### Qual pasta copiar?

| Cenário | Pasta |
|---------|-------|
| CRUD simples — usuário só lê | `minimal/user/` |
| CRUD simples — só admin gerencia | `minimal/administrator/` |
| Usuário vê/edita seus dados + hooks | `standard/user/` ou `complex/user/` |
| Painel admin com filtros e stats | `standard/administrator/` ou `complex/administrator/` |
| Sub-serviço de contexto + `GET/PUT /me` | `complex/user/` |
| Listagem admin enriquecida (paginação, summary) | `complex/administrator/` |

---

## 3. Endpoints por template

Rotas **herdadas** do `UniversalController` existem em todos os templates (salvo quando a role bloqueia o método HTTP).

### MINIMAL · user (`user/examples`)

| Método | Rota | Role |
|--------|------|------|
| GET | `/user/examples`, `/all`, `/:id`, `/search/*` | USER, ADMIN, SYSTEM_ADMIN |
| POST/PATCH/DELETE | CRUD universal | ADMIN, SYSTEM_ADMIN |

Sem hooks. CASL define o que o USER consegue ler.

### MINIMAL · administrator (`admin/examples`)

| Método | Rota | Role |
|--------|------|------|
| GET/POST/PATCH/DELETE | CRUD universal completo | ADMIN, SYSTEM_ADMIN |
| GET | `/admin/examples/metrics` | ADMIN, SYSTEM_ADMIN |

### STANDARD · user

Rotas extras (declarar **antes** de `/:id`):

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/user/examples/me` | Registros do usuário autenticado |
| GET | `/user/examples/by-code?code=` | Busca por código |
| GET | `/user/examples/by-status?status=` | Busca por status |

Hooks: `antesDeCriar`, `depoisDeCriar`, `antesDeAtualizar` (valida ownership).  
Dependência extra: `NotificationModule` (side-effects pós-criação).

### STANDARD · administrator

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/examples/by-code?code=` | Busca por código |
| GET | `/admin/examples/by-status?status=` | Busca por status |
| GET | `/admin/examples/stats` | Resumo de estatísticas da empresa |

Hooks: unicidade de código, regras de desativação, notificações admin.

### COMPLEX · user

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/user/examples/me` | Registro do usuário autenticado |
| PUT | `/user/examples/me` | Atualização do próprio registro |

Sub-serviço: `UserExampleContextService` (validação, resolução de contexto, update `/me`).

### COMPLEX · administrator

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/examples/list` | Lista paginada com filtros e summary |
| GET | `/admin/examples/detail/:id` | Detalhe enriquecido |
| GET | `/admin/examples/stats` | Estatísticas por status/tipo |

Sub-serviços:

- `AdministratorExampleContextService` — validação e preparação de payload
- `AdministratorExampleQueryService` — queries complexas e enriquecimento admin

---

## 4. Passo a passo para copiar

### 4.1 Copiar arquivos

```bash
# Exemplo: Product com user + admin na camada STANDARD
cp -R src/modules/template/standard/user \
      src/modules/products/user-product

cp -R src/modules/template/standard/administrator \
      src/modules/products/administrator-product
```

### 4.2 Renomear arquivos

| De | Para (exemplo Product) |
|----|------------------------|
| `user-example.module.ts` | `user-product.module.ts` |
| `user-example.controller.ts` | `user-product.controller.ts` |
| `user-example.service.ts` | `user-product.service.ts` |
| `administrator-example.*` | `administrator-product.*` |
| `create-example.dto.ts` | `create-product.dto.ts` |
| `update-example.dto.ts` | `update-product.dto.ts` |

### 4.3 Substituir placeholders

Ordem recomendada (evita substituições parciais):

1. `AdministratorExampleQueryService` → `AdministratorProductQueryService`
2. `AdministratorExampleContextService` → `AdministratorProductContextService`
3. `UserExampleContextService` → `UserProductContextService`
4. `AdministratorExample` → `AdministratorProduct`
5. `UserExample` → `UserProduct`
6. `CreateExampleDto` → `CreateProductDto`
7. `UpdateExampleDto` → `UpdateProductDto`
8. `ExampleStatus` / `ExampleType` → enums reais
9. `admin/examples` → `admin/products`
10. `user/examples` → `user/products`
11. `examples` → `products` (rotas, tags Swagger)
12. `example` → `product` (camelCase, Prisma, entity config)
13. `Example` → `Product` (PascalCase, CASL)
14. `'example' as any` → `'product'` (após registrar em `entities.config.ts`)

| Placeholder | Substituir por | Exemplo |
|-------------|----------------|---------|
| `Example` | Entidade PascalCase | `Product` |
| `example` | Entidade camelCase | `product` |
| `examples` | Plural kebab-case (HTTP) | `products` |
| `UserExample` | Prefixo user + entidade | `UserProduct` |
| `AdministratorExample` | Prefixo admin + entidade | `AdministratorProduct` |
| `user/examples` | Rota do controller user | `user/products` |
| `admin/examples` | Rota do controller admin | `admin/products` |
| `'example' as any` | Chave em `entities.config.ts` | `'product'` |

### 4.4 Unificar em um módulo (opcional)

Se preferir **um módulo** com dois controllers:

```typescript
@Module({
  imports: [UniversalModule, NotificationModule],
  controllers: [UserProductController, AdministratorProductController],
  providers: [UserProductService, AdministratorProductService, /* sub-serviços */],
  exports: [UserProductService, AdministratorProductService],
})
export class ProductModule {}
```

---

## 5. Registros obrigatórios após copiar

### 5.1 `prisma/schema/<contexto>.prisma`

```prisma
model Product {
  id          String    @id @default(cuid())
  name        String
  // ... campos do domínio ...
  companyId   String
  company     Company   @relation(fields: [companyId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  @@index([companyId])
  @@index([deletedAt])
  @@map("products")
}
```

```bash
npx prisma migrate dev --name "add-product"
```

### 5.2 `src/shared/config/entities.config.ts`

```typescript
export const PROJECT_PLUGIN_ENTITY_MAPPING = {
  product: 'Product',
} as const;

export const PROJECT_PLUGIN_CASL_TO_MODEL_MAPPING = {
  Product: 'product',
} as const;
```

### 5.3 `src/shared/config/casl-role-permissions.config.ts`

```typescript
USER: (user: User, { can }: any) => {
  can('read', 'Product', { companyId: user.companyId });
  // can('update', 'Product', { ownerId: user.id }); // se aplicável
},

ADMIN: (user: User, { can }: any) => {
  can('manage', 'Product', { companyId: user.companyId });
},
```

Ajuste `ownerId`, `userId` ou condições conforme o domínio.

### 5.4 `src/app.module.ts`

```typescript
import { UserProductModule } from './modules/products/user-product/user-product.module';
import { AdministratorProductModule } from './modules/products/administrator-product/administrator-product.module';

@Module({
  imports: [
    // ...
    UserProductModule,
    AdministratorProductModule,
    // ou ProductModule unificado
  ],
})
export class AppModule {}
```

### 5.5 Remover `as any` do `createEntityConfig`

```typescript
// Template (antes de registrar):
private static readonly entityConfig = createEntityConfig('example' as any);

// Produção (após entities.config.ts):
private static readonly entityConfig = createEntityConfig('product');
```

---

## 6. Regras importantes

- **Rotas literais antes de `/:id`**: `/me`, `/list`, `/stats` devem ser declaradas no controller **antes** das rotas dinâmicas herdadas do `UniversalController`.
- **Não duplicar interceptors**: `TenantInterceptor` e `CaslInterceptor` já vêm do `UniversalController`.
- **STANDARD/COMPLEX com notificações**: manter `NotificationModule` no `imports` ou remover `NotificationHelper` do service.
- **Sub-serviços COMPLEX**: singletons com `PrismaService` — **não** estendem `UniversalService`.
- **DTOs**: nunca incluir `id`, `companyId`, `createdAt`, `updatedAt`, `deletedAt` — `companyId` é injetado pelo Universal.

---

## 7. Checklist rápido

```
[ ] Escolhi camada (MINIMAL / STANDARD / COMPLEX)
[ ] Escolhi audiência (user / administrator) — ou copiei ambas
[ ] Copiei para src/modules/<contexto>/
[ ] Renomeei pastas e arquivos (*-example → *-<entidade>)
[ ] Substituí placeholders na ordem recomendada (§ 4.3)
[ ] Ajustei rotas HTTP (user/... e admin/...)
[ ] Adicionei modelo Prisma + migrate
[ ] Registrei em entities.config.ts
[ ] Defini permissões CASL (USER read / ADMIN manage)
[ ] Registrei em app.module.ts
[ ] Removi 'as any' do createEntityConfig
[ ] Testei endpoints user e admin (npm run start:dev)
```
