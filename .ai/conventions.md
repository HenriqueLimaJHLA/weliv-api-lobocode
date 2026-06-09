# 📝 Conventions - LOBO CODE AI SOFTWARE FACTORY v2.0

**Convenções de código do projeto. Obrigatório seguir.**

---

## 🏷️ Nomenclatura

### Entidades e Arquivos

| Elemento | Padrão | Exemplo |
|----------|--------|---------|
| Entidade (classe) | PascalCase | `Product`, `OrderItem` |
| Variável/método | camelCase | `productName`, `orderItems` |
| Arquivo | kebab-case | `product.service.ts` |
| Tabela DB | snake_case plural | `products`, `order_items` |
| Valor enum | UPPER_SNAKE | `ACTIVE`, `INACTIVE` |
| Constante | SCREAMING_SNAKE | `MAX_RETRY_COUNT` |

### Pastas

| Pasta | Conteúdo |
|-------|----------|
| `src/modules/` | Módulos de domínio |
| `src/shared/` | Código compartilhado |
| `src/shared/universal/` | 🚀 Motor universal (NÃO MODIFICAR) |
| `prisma/schema/` | Schemas Prisma modulares |
| `specs/` | Especificações YAML |

---

## 📁 Estrutura de Módulo

```
src/modules/<domain>/
├── user/
│   ├── user-<domain>.module.ts
│   ├── user-<domain>.service.ts
│   ├── user-<domain>.controller.ts
│   └── dto/
│       ├── create-<domain>.dto.ts
│       └── update-<domain>.dto.ts
└── administrator/
    ├── administrator-<domain>.module.ts
    ├── administrator-<domain>.service.ts
    ├── administrator-<domain>.controller.ts
    └── dto/
        ├── create-<domain>.dto.ts
        └── update-<domain>.dto.ts
```

### Para módulos COMPLEX, adicionar:

```
src/modules/<domain>/
├── user/
│   └── services/
│       └── user-<domain>-context.service.ts
└── administrator/
    └── services/
        ├── administrator-<domain>-context.service.ts
        └── administrator-<domain>-query.service.ts
```

---

## 🔧 Imports

### Ordem (obrigatória)

```typescript
// 1. @nestjs/common
import { Injectable, Inject, Optional, Scope } from '@nestjs/common';

// 2. Third-party
import { REQUEST } from '@nestjs/core';
import { Roles } from '@prisma/client';

// 3. Internal - @nestjs
import { UniversalService } from 'src/shared/universal';

// 4. Internal - modules
import { CreateProductDto } from './dto/create-product.dto';
```

### Aliases Comuns

```typescript
import { UniversalService } from 'src/shared/universal';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { NotificationHelper } from 'src/modules/infrastructure/notifications/notification.helper';
```

---

## 📝 Comments

### Classes e Métodos Públicos

```typescript
/**
 * Serviço de produtos do painel administrativo.
 * Fornece operações CRUD e métricas.
 *
 * @extends UniversalService
 */
@Injectable({ scope: Scope.REQUEST })
export class AdministratorProductService extends UniversalService<...> {}

/**
 * Busca produto por código único.
 * @param code - Código do produto
 * @returns Produto encontrado
 * @throws NotFoundError - Se não encontrado
 */
async buscarPorCodigo(code: string) {}
```

### Blocos de Código

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC METHODS
// ═══════════════════════════════════════════════════════════════════════════════
```

---

## 🎨 Código

### TypeScript

```typescript
// ✅ Usar const para injeção
constructor(
  private readonly repository: UniversalRepository<...>,
  private readonly queryService: UniversalQueryService,
) {}

// ✅ Early returns
async criar(data: CreateDto) {
  if (!data.name) {
    throw new BadRequestError('Nome é obrigatório');
  }
  return this.repository.criar(this.entityName, data);
}

// ✅ Async/await sempre
async buscarPorId(id: string) {
  return this.repository.buscarPrimeiro(this.entityName, { id });
}
```

### Decorators

```typescript
// ✅ ApiPropertyOptional para campos opcionais
@ApiPropertyOptional({ description: 'Status', default: 'ACTIVE' })
@IsEnum(ProductStatus)
@IsOptional()
status?: ProductStatus;

// ❌ Não usar @IsOptional() sem ?
@ApiPropertyOptional()
@IsEnum(ProductStatus)
status: ProductStatus;
```

---

## 🗄️ Prisma

### Schema

```prisma
model Product {
  // ID
  id String @id @default(cuid())

  // Campos específicos
  name String
  price Decimal @db.Decimal(10, 2)

  // Relacionamentos
  categoryId String
  category Category @relation(fields: [categoryId], references: [id])

  // Multi-tenancy (OBRIGATÓRIO)
  companyId String
  company Company @relation(fields: [companyId], references: [id])

  // Auditoria (OBRIGATÓRIO)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Soft delete (OBRIGATÓRIO)
  deletedAt DateTime?

  // Índices (OBRIGATÓRIO)
  @@index([companyId])
  @@index([deletedAt])
  @@index([status])

  @@map("products")
}
```

### Regras

| Regra | Por quê |
|-------|---------|
| `Decimal` para dinheiro | Precisão exata |
| `@db.Text` para textos longos | Otimização |
| `companyId` obrigatório | Multi-tenancy |
| `deletedAt?` para soft delete | Recuperação de dados |
| Índices em FKs | Performance |

---

## 🌐 API

### Rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/<domain>` | Lista com paginação |
| GET | `/admin/<domain>/all` | Lista todos |
| GET | `/admin/<domain>/:id` | Busca por ID |
| GET | `/admin/<domain>/stats` | Estatísticas |
| GET | `/admin/<domain>/by-code?code=` | Busca por código |
| GET | `/admin/<domain>/by-status?status=` | Busca por status |
| POST | `/admin/<domain>` | Criar |
| PATCH | `/admin/<domain>/:id` | Atualizar |
| DELETE | `/admin/<domain>/:id` | Desativar (soft delete) |
| POST | `/admin/<domain>/:id/restore` | Reativar |

### Prefixos

| Layer | Prefixo | Roles |
|-------|---------|-------|
| user | `user/` | USER, ADMIN, SYSTEM_ADMIN |
| administrator | `admin/` | ADMIN, SYSTEM_ADMIN |

### Response

```typescript
// Sucesso com dados
{ "data": { ... } }

// Sucesso com paginação
{
  "data": [...],
  "pagination": { page, limit, total, totalPages, hasNextPage, hasPreviousPage }
}

// Sucesso (sem dados)
{ "message": "Operação realizada" }

// Erro
{ "statusCode": 404, "message": "Não encontrado", "error": "Not Found" }
```

---

## 🛡️ Segurança

### Obrigatório

```typescript
// ✅ Sempre validar companyId
protected async antesDeCriar(data: CreateDto) {
  const user = this.obterUsuarioLogado();
  if (!user?.companyId) {
    throw new ForbiddenError('Empresa não disponível');
  }
}

// ✅ Sempre verificar ownership
protected async antesDeAtualizar(id: string, data: UpdateDto) {
  const entity = await this.repository.buscarPrimeiro(this.entityName, { id });
  if (entity.companyId !== user.companyId) {
    throw new ForbiddenError('Acesso negado');
  }
}

// ✅ Sempre filtrar deletedAt
const entities = await this.repository.buscarMuitos(
  this.entityName,
  { ...where, deletedAt: null },
);
```

### Nunca

```typescript
// ❌ Endpoint sem autenticação (exceto @Public)
@Post()
criar(@Body() data: CreateDto) { ... }

// ❌ Query sem filtrar companyId
const products = await this.repository.buscarMuitos(this.entityName, {});

// ❌ Query sem filtrar deletedAt
const products = await this.repository.buscarMuitos(this.entityName, { companyId });
```

---

## ✅ Checklist

Antes de commitar:

- [ ] Nomenclatura correta
- [ ] Imports em ordem
- [ ] JSDoc em classes/métodos públicos
- [ ] Schema com campos obrigatórios
- [ ] Índices definidos
- [ ] Soft delete implementado
- [ ] Multi-tenancy verificada
- [ ] CASL configurado
- [ ] Testado

---

**Versão:** 2.0  
**Atualizado:** 2026-06-08