# TEMPLATE OFICIAL DE MÓDULOS — LOBOCODE API

**Versão:** 2.0  
**Status:** Documento Técnico Definitivo — Fonte Única da Verdade  
**Stack:** NestJS 11 · Prisma 6 · PostgreSQL · TypeScript 5.7

---

## ÍNDICE

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Regras Arquiteturais Obrigatórias](#2-regras-arquiteturais-obrigatórias)
3. [Classificação de Módulos](#3-classificação-de-módulos)
4. [Template Oficial de Cada Tipo](#4-template-oficial-de-cada-tipo)
5. [Templates de Código com Placeholders](#5-templates-de-código-com-placeholders)
6. [Convenções do Projeto](#6-convenções-do-projeto)
7. [Matriz de Reutilização](#7-matriz-de-reutilização)
8. [Checklist de Criação de Novo Módulo](#8-checklist-de-criação-de-novo-módulo)
9. [Prompt Oficial de Geração de Módulos](#9-prompt-oficial-de-geração-de-módulos)
10. [Especificações de Referência](#10-especificações-de-referência)

---

## 1. VISÃO GERAL DA ARQUITETURA

### 1.1 Universal Pattern

O projeto é um **monolito modular** com um padrão central denominado **Universal CRUD Pattern**. Este padrão fornece três classes abstratas genéricas que eliminam ~80% do boilerplate de qualquer módulo CRUD:

```
UniversalController<DtoCreate, DtoUpdate, Service>
UniversalService<DtoCreate, DtoUpdate>
UniversalRepository<DtoCreate, DtoUpdate>
```

O `UniversalModule` é declarado como `@Global()` e exporta todas as dependências do padrão. Todo módulo de feature precisa importar apenas `UniversalModule` — nunca importar `PrismaModule`, `CaslModule` ou `TenantModule` individualmente (já disponíveis via global).

O `UniversalRepository` opera dinamicamente via `prisma[entityName]` — funciona para qualquer entidade do schema Prisma sem necessidade de repository dedicado.

### 1.2 Fluxo Completo da Requisição

```
HTTP Request
  │
  ├─ RateLimitMiddleware                  ← app.module.ts (global)
  │
  ├─ TenantInterceptor                    ← UniversalController @UseInterceptors
  │    └─ Lê user do request
  │    └─ Seta contexto da empresa (companyId) no TenantService
  │    └─ SYSTEM_ADMIN pode assumir empresa temporária
  │
  ├─ AuthGuard                            ← @UseGuards no controller filho
  │    └─ Valida JWT (HS256)
  │    └─ Busca usuário no banco
  │    └─ Chama CaslAbilityService.createForUser()
  │    └─ Injeta user + ability no request
  │
  ├─ RoleByMethodGuard                    ← @UseGuards no controller filho
  │    └─ Valida role do user para o método HTTP
  │
  ├─ CaslInterceptor                      ← UniversalController @UseInterceptors
  │    └─ Validação granular de campos via @Casl() decorator
  │
  ├─ SoftDeleteInterceptor                ← app.module.ts (global)
  │    └─ Aplica deletedAt automático no DELETE
  │
  ├─ Controller.método()
  │    └─ Delega ao Service
  │
  ├─ Service.método()
  │    ├─ permissionService.validarAction(entityNameCasl, action)
  │    │    └─ Verifica CASL: ability.can(action, subject)
  │    │
  │    ├─ queryService.construirWhereClauseParaRead(entityNameCasl, extraWhere?)
  │    │    └─ Aplica filtros CASL + deletedAt: null + companyId do tenant
  │    │
  │    ├─ hook: antesDe*()                ← override na classe filha
  │    │    └─ Validações de negócio, injeção de campos computados
  │    │
  │    ├─ repository.método(entityName, data, include?)
  │    │    └─ Transforma *Id → { connect: { id } } automaticamente
  │    │    └─ Injeta companyId do tenant na criação
  │    │    └─ Executa query Prisma
  │    │
  │    ├─ hook: depoisDe*()               ← override na classe filha
  │    │    └─ Side-effects: notificações, e-mails, webhooks
  │    │
  │    └─ transformData(entity)
  │         └─ flatten: mapeia relações para campos planos
  │         └─ custom: transformação customizada
  │         └─ exclude: remove campos sensíveis
  │
  ├─ ExceptionFilter (global, por tipo)
  │    └─ PrismaErrorFilter, NotFoundErrorFilter, ForbiddenErrorFilter, etc.
  │
  └─ HTTP Response
```

### 1.3 Dependências entre Camadas

```
src/modules/<feature>/
  └─ depende de → src/shared/universal/     (Universal CRUD Pattern)
  └─ depende de → src/shared/common/errors  (Custom Errors)
  └─ pode depender de → outros módulos plugin (ex: NotificationModule)
  └─ NÃO depende de → src/shared/prisma     (acessado via UniversalRepository)
  └─ NÃO depende de → src/shared/casl       (acessado via UniversalPermissionService)
  └─ NÃO depende de → src/shared/tenant     (acessado via UniversalRepository internamente)

src/shared/universal/
  └─ depende de → src/shared/prisma
  └─ depende de → src/shared/tenant
  └─ depende de → src/shared/casl
  └─ depende de → src/shared/common

Core não pode depender de providers de Plugin.
Plugin pode depender de Plugin (ex: Bookings → NotificationModule).
```

### 1.4 Multi-Tenancy

O isolamento por empresa (`companyId`) é automático e transparente:

- **TenantService** (REQUEST scope): armazena o contexto da empresa corrente por requisição
- **TenantInterceptor**: executado em toda requisição via `UniversalController`. Resolve o `companyId` do usuário autenticado e seta no `TenantService`
- **UniversalRepository**: ao criar registros, injeta automaticamente `company: { connect: { id: companyId } }` nos dados
- **UniversalQueryService**: adiciona `companyId` no WHERE de todas as queries de leitura
- **SYSTEM_ADMIN**: pode operar como tenant global (sem filtro de empresa) ou assumir empresa temporária

**Entidades sem relação de empresa** (ex: `Reminder`) devem ser declaradas na lista `ENTIDADES_SEM_RELACAO_COMPANY` do `UniversalRepository`. Nestas entidades o `companyId` não é injetado na criação.

### 1.5 CASL (Autorização)

O projeto usa CASL 6 com `PrismaQuery` para autorização baseada em atributos (ABAC).

- `AppAbility = PureAbility<[PermActions, PermissionResource], PrismaQuery>`
- **PermActions:** `manage | create | read | update | delete | approve | export`
- **PermissionResource:** todos os nomes de entidade no formato PascalCase (`User`, `Company`, `Booking`, etc.)
- As permissões são definidas em `casl-role-permissions.config.ts` por role
- `UniversalPermissionService.validarAction(entityNameCasl, action)` valida automaticamente antes de cada operação
- `UniversalQueryService` constrói WHERE clauses filtradas pelas regras CASL do usuário autenticado

### 1.6 Soft Delete

Todas as entidades têm `deletedAt DateTime?` no schema Prisma.

- **DELETE** não remove fisicamente — marca `deletedAt: new Date()` via `SoftDeleteInterceptor` global
- **Queries** filtram `deletedAt: null` automaticamente via `UniversalQueryService`
- **Restore** via `POST /:id/restore` — usa `reativar()` que seta `deletedAt: null`
- O `UniversalRepository.desativar()` e `.reativar()` gerenciam o ciclo de vida

### 1.7 Métricas

`UniversalMetricsService` integra Prometheus automaticamente em todo service:

- Registra operações por entidade, ação e status (success/error)
- Registra duração das operações
- Controla operações concorrentes
- Endpoint `GET /metrics` disponível em todo controller via `UniversalController`
- Acesso restrito a `SYSTEM_ADMIN` e `ADMIN`

---

## 2. REGRAS ARQUITETURAIS OBRIGATÓRIAS

### 2.1 Services

✅ **OBRIGATÓRIO** — Todo service de feature DEVE herdar `UniversalService<DtoCreate, DtoUpdate>`  
✅ **OBRIGATÓRIO** — Todo service de feature DEVE usar `@Injectable({ scope: Scope.REQUEST })`  
✅ **OBRIGATÓRIO** — Todo service de feature DEVE declarar `private static readonly entityConfig = createEntityConfig('entityName')`  
✅ **OBRIGATÓRIO** — Todo service de feature DEVE chamar `this.setEntityConfig()` no constructor após `super()`  
✅ **OBRIGATÓRIO** — O constructor DEVE seguir a ordem: `repository, queryService, permissionService, metricsService, request, ...dependênciasExtras`  
✅ **OBRIGATÓRIO** — Campos computados nos hooks (`antesDeCriar`, `antesDeAtualizar`) DEVEM ser injetados como `(data as any).campo = valor`  
✅ **OBRIGATÓRIO** — Side-effects em `depoisDeCriar` e `depoisDeAtualizar` DEVEM ser envoltos em `try/catch` — o registro já foi persistido  
✅ **OBRIGATÓRIO** — Erros de negócio DEVEM usar os custom errors de `src/shared/common/errors.ts`  

❌ **PROIBIDO** — Usar `PrismaService` diretamente no service principal  
❌ **PROIBIDO** — Usar `scope: Scope.DEFAULT` (singleton) em services que herdam `UniversalService`  
❌ **PROIBIDO** — Criar repository customizado por entidade — o `UniversalRepository` é universal  
❌ **PROIBIDO** — Lançar exceções em `depoisDeCriar` / `depoisDeAtualizar` — apenas logar o erro  
❌ **PROIBIDO** — Usar `HttpException` diretamente — sempre usar os custom errors  
❌ **PROIBIDO** — Reimplementar paginação, soft-delete, multi-tenancy ou CASL — já providos pelo Universal Pattern  

### 2.2 Controllers

✅ **OBRIGATÓRIO** — Todo controller de feature DEVE herdar `UniversalController<DtoCreate, DtoUpdate, Service>`  
✅ **OBRIGATÓRIO** — Todo controller DEVE usar `@UseGuards(AuthGuard, RoleByMethodGuard)`  
✅ **OBRIGATÓRIO** — Todo controller DEVE usar `@RoleByMethod({ GET: [...], POST: [...], PATCH: [...], DELETE: [...] })`  
✅ **OBRIGATÓRIO** — Rotas com path literal (`/me`, `/admin/list`, `/by-code`) DEVEM ser declaradas ANTES das rotas herdadas com parâmetros (`/:id`)  
✅ **OBRIGATÓRIO** — Usar `@ApiTags('entity-name')` e `@ApiBearerAuth('JWT-auth')` para documentação Swagger  

❌ **PROIBIDO** — Usar `RoleGuard` com `@RequiredRoles()` em novos módulos — padrão substituído por `RoleByMethodGuard`  
❌ **PROIBIDO** — Aplicar `@UseInterceptors(TenantInterceptor)` ou `@UseInterceptors(CaslInterceptor)` no controller filho — já aplicados pelo `UniversalController`  
❌ **PROIBIDO** — Implementar lógica de negócio diretamente no controller — apenas delegar ao service  

### 2.3 Módulos

✅ **OBRIGATÓRIO** — Todo módulo DEVE importar `UniversalModule`  
✅ **OBRIGATÓRIO** — Todo módulo DEVE exportar o service principal  
✅ **OBRIGATÓRIO** — Registrar o módulo em `src/app.module.ts` na seção correspondente  

❌ **PROIBIDO** — Importar `PrismaModule`, `CaslModule`, `TenantModule` individualmente — já globais via `UniversalModule`  
❌ **PROIBIDO** — Declarar módulos como `@Global()` — apenas módulos de infraestrutura compartilhada são globais  

### 2.4 DTOs

✅ **OBRIGATÓRIO** — Usar `class-validator` e `class-transformer` em todos os DTOs  
✅ **OBRIGATÓRIO** — Documentar todos os campos com `@ApiProperty()` ou `@ApiPropertyOptional()`  
✅ **OBRIGATÓRIO** — `UpdateDto` DEVE herdar `PartialType(CreateDto)` via `@nestjs/swagger`  
✅ **OBRIGATÓRIO** — Campos opcionais DEVEM usar `@IsOptional()` + `@ApiPropertyOptional()`  

❌ **PROIBIDO** — Incluir `id`, `createdAt`, `updatedAt`, `deletedAt`, `companyId` nos DTOs — gerenciados automaticamente  
❌ **PROIBIDO** — Usar `PartialType` de `@nestjs/mapped-types` — usar exclusivamente `@nestjs/swagger`  

### 2.5 Schema Prisma

✅ **OBRIGATÓRIO** — Toda entidade DEVE ter: `id String @id @default(cuid())`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`, `deletedAt DateTime?`  
✅ **OBRIGATÓRIO** — Adicionar índice `@@index([deletedAt])` para performance nas queries de soft-delete  
✅ **OBRIGATÓRIO** — Entidades multi-tenant DEVEM ter `companyId String` com relação `company Company @relation(...)`  
✅ **OBRIGATÓRIO** — Registrar a entidade em `PROJECT_PLUGIN_ENTITY_MAPPING` e `PROJECT_PLUGIN_CASL_TO_MODEL_MAPPING` em `entities.config.ts`  
✅ **OBRIGATÓRIO** — Definir permissões em `casl-role-permissions.config.ts`  

### 2.6 Sub-Serviços (apenas COMPLEX)

✅ **OBRIGATÓRIO** — Sub-serviços DEVEM ser `@Injectable()` simples (singleton, sem REQUEST scope)  
✅ **OBRIGATÓRIO** — Sub-serviços PODEM injetar `PrismaService` diretamente  
✅ **OBRIGATÓRIO** — Sub-serviços DEVEM ter responsabilidade única, nomeada no arquivo  

❌ **PROIBIDO** — Sub-serviços herdarem `UniversalService`  
❌ **PROIBIDO** — Sub-serviços serem exportados pelo módulo (a menos que outros módulos precisem)  

---

## 3. CLASSIFICAÇÃO DE MÓDULOS

### Critérios Objetivos de Classificação

#### MODULE_TEMPLATE_MINIMAL

Preenche **TODOS** os seguintes critérios:

- [ ] CRUD puro — sem regras de negócio além da validação do DTO
- [ ] Nenhum hook implementado (`antesDeCriar`, `depoisDeCriar`, etc. permanecem vazios)
- [ ] Nenhum método extra além dos herdados do `UniversalController`
- [ ] Nenhum side-effect pós-persistência
- [ ] Nenhuma injeção de campo computado
- [ ] Nenhum cron job
- [ ] Nenhuma dependência de módulo externo além de `UniversalModule`

**Exemplos reais:** `Availabilities`, `AvailabilityExceptions`, `ProviderSettings`, `Favorites`, `Reviews`

**Arquivos:** 5 obrigatórios (module, service, controller, create.dto, update.dto)

---

#### MODULE_TEMPLATE_STANDARD

Preenche **pelo menos UM** dos seguintes critérios:

- [ ] Implementa pelo menos um hook (`antesDeCriar`, `depoisDeCriar`, `antesDeAtualizar`, `antesDeDesativar`, etc.)
- [ ] Injeta campos computados no payload antes de persistir (ex: `userId`, `code.toUpperCase()`)
- [ ] Possui pelo menos um método extra no service além dos herdados
- [ ] Possui pelo menos uma rota extra no controller além das herdadas
- [ ] Possui side-effects pós-persistência (notificações, e-mails)
- [ ] Possui cron job dedicado
- [ ] Necessita de validador de negócio dedicado

**MAS NÃO** possui dois ou mais dos critérios de COMPLEX.

**Exemplos reais:** `Reminders`, `Users`, `Coupons`, `TicketReplies`, `IncidentUpdates`

**Arquivos:** 5-7 (obrigatórios + opcionais conforme necessidade)

---

#### MODULE_TEMPLATE_COMPLEX

Preenche **DOIS ou mais** dos seguintes critérios:

- [ ] Integração com serviço externo (Asaas, geocoding, e-mail gateway)
- [ ] Múltiplos controllers (ex: controller principal + controller admin)
- [ ] Lógica de estado/workflow (status machine com transições)
- [ ] Queries Prisma diretas além do que o `UniversalRepository` provê (necessita sub-serviço)
- [ ] Três ou mais responsabilidades distintas no service principal
- [ ] Delegação explícita a sub-serviços em `services/`
- [ ] Endpoints especializados com lógica de negócio complexa (`/me`, `/admin/list`, `/balance`)

**Exemplos reais:** `Companies`, `Bookings`, `Payments`

**Arquivos:** 8-12+ (estrutura com `services/` obrigatória)

---

#### MODULE_TEMPLATE_CUSTOM

Preenche **TODOS** os seguintes critérios:

- [ ] Não representa uma entidade CRUD (sem operações create/read/update/delete padrão)
- [ ] É um serviço de agregação, relatório, cálculo ou adaptador
- [ ] Não herda `UniversalService` nem `UniversalController`
- [ ] Injeta `PrismaService` diretamente no service principal

**Exemplos reais:** `DashboardService`, serviços de cálculo financeiro, adaptadores de integração

**Arquivos:** 3-4 (module, service, controller — sem DTOs de CRUD)

---

## 4. TEMPLATE OFICIAL DE CADA TIPO

### 4.1 MODULE_TEMPLATE_MINIMAL — Estrutura

```
src/modules/<contexto>/<entity>/
├── <entity>.module.ts          [OBRIGATÓRIO] Declaração do módulo NestJS
├── <entity>.service.ts         [OBRIGATÓRIO] Service com entityConfig; sem hooks
├── <entity>.controller.ts      [OBRIGATÓRIO] Controller com guards; sem rotas extras
└── dto/
    ├── create-<entity>.dto.ts  [OBRIGATÓRIO] Campos de criação
    └── update-<entity>.dto.ts  [OBRIGATÓRIO] PartialType do create
```

**Responsabilidade de cada arquivo:**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `<entity>.module.ts` | Declarar module, importar UniversalModule, registrar providers e exports |
| `<entity>.service.ts` | Configurar entityConfig (includes + transforms); zero lógica de negócio |
| `<entity>.controller.ts` | Aplicar guards e roles; delegar tudo ao service herdado |
| `create-<entity>.dto.ts` | Definir campos aceitos na criação com validação e Swagger |
| `update-<entity>.dto.ts` | Herdar todos os campos como opcionais via PartialType |

---

### 4.2 MODULE_TEMPLATE_STANDARD — Estrutura

```
src/modules/<contexto>/<entity>/
├── <entity>.module.ts               [OBRIGATÓRIO]
├── <entity>.service.ts              [OBRIGATÓRIO] Hooks + métodos extras
├── <entity>.controller.ts           [OBRIGATÓRIO] Rotas extras possíveis
├── dto/
│   ├── create-<entity>.dto.ts       [OBRIGATÓRIO]
│   ├── update-<entity>.dto.ts       [OBRIGATÓRIO]
│   └── <action>-<entity>.dto.ts     [OPCIONAL] DTOs extras por operação
├── validators/
│   └── <entity>.validator.ts        [OPCIONAL] Validações de negócio isoladas
└── services/
    └── <entity>-<domain>-cron.service.ts  [OPCIONAL] Jobs agendados
```

**Responsabilidade de cada arquivo:**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `<entity>.service.ts` | Hooks do ciclo de vida + métodos extras de negócio |
| `<entity>.controller.ts` | Guards + rotas extras delegando ao service |
| `<action>-<entity>.dto.ts` | DTO para operações específicas (ex: `validate-coupon.dto.ts`) |
| `<entity>.validator.ts` | Validações de negócio reutilizáveis (unicidade, existência) |
| `<entity>-*-cron.service.ts` | Job agendado com `@Cron()` para processamento periódico |

---

### 4.3 MODULE_TEMPLATE_COMPLEX — Estrutura

```
src/modules/<contexto>/<entity>/
├── <entity>.module.ts                          [OBRIGATÓRIO]
├── <entity>.service.ts                         [OBRIGATÓRIO] Orquestrador
├── <entity>.controller.ts                      [OBRIGATÓRIO] Rotas principais
├── [<entity>-admin.controller.ts]              [OPCIONAL]  Rotas admin
├── dto/
│   ├── create-<entity>.dto.ts                  [OBRIGATÓRIO]
│   ├── update-<entity>.dto.ts                  [OBRIGATÓRIO]
│   └── [<action>-<entity>.dto.ts]              [OPCIONAL]
├── services/
│   ├── <entity>-<dominio-a>.service.ts         [OBRIGATÓRIO no COMPLEX]
│   ├── <entity>-<dominio-b>.service.ts         [OBRIGATÓRIO no COMPLEX]
│   └── [<entity>-<dominio-c>.service.ts]       [CONFORME NECESSIDADE]
└── [constants/]
    └── [<entity>-*.constants.ts]               [OPCIONAL]
```

**Responsabilidade de cada arquivo:**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `<entity>.service.ts` | Orquestrador: delega responsabilidades a sub-serviços via hooks e métodos |
| `services/<entity>-<dominio>.service.ts` | Responsabilidade única de domínio (validação, integração, query, notificação) |
| `<entity>-admin.controller.ts` | Rotas restritas a admins (`/admin/*`) separadas do controller principal |
| `constants/<entity>-*.constants.ts` | Constantes de negócio isoladas (limites, listas de campos, etc.) |

---

### 4.4 MODULE_TEMPLATE_CUSTOM — Estrutura

```
src/modules/<contexto>/<entity>/
├── <entity>.module.ts         [OBRIGATÓRIO]
├── <entity>.service.ts        [OBRIGATÓRIO] Sem herança Universal
├── <entity>.controller.ts     [OBRIGATÓRIO] Sem herança Universal
└── [interfaces/]
    └── [<entity>.interface.ts] [OPCIONAL]
```

---

## 5. TEMPLATES DE CÓDIGO COM PLACEHOLDERS

> **Legenda de Placeholders:**
> - `<Entity>` → PascalCase (ex: `Product`, `ServiceCategory`)
> - `<entity>` → camelCase (ex: `product`, `serviceCategory`)
> - `<entity-kebab>` → kebab-case (ex: `product`, `service-category`)
> - `<entities-kebab>` → plural kebab-case (ex: `products`, `service-categories`)
> - `<EntityModel>` → nome exato no Prisma/ENTITY_MAPPING (ex: `product`, `serviceCategory`)
> - `<EntityCasl>` → PascalCase no CASL (ex: `Product`, `ServiceCategory`)
> - `<CreateEntityDto>` → nome da classe CreateDto
> - `<UpdateEntityDto>` → nome da classe UpdateDto

---

### 5.1 Template: `<entity>.module.ts`

#### MINIMAL / STANDARD (sem dependências externas)

```typescript
import { Module } from '@nestjs/common';
import { <Entity>Service } from './<entity-kebab>.service';
import { <Entity>Controller } from './<entity-kebab>.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';

@Module({
  imports: [UniversalModule],
  controllers: [<Entity>Controller],
  providers: [<Entity>Service],
  exports: [<Entity>Service],
})
export class <Entity>Module {}
```

#### STANDARD com NotificationModule

```typescript
import { Module } from '@nestjs/common';
import { <Entity>Service } from './<entity-kebab>.service';
import { <Entity>Controller } from './<entity-kebab>.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';
import { NotificationModule } from 'src/modules/infrastructure/notifications/notification.module';

@Module({
  imports: [
    UniversalModule,
    NotificationModule,
  ],
  controllers: [<Entity>Controller],
  providers: [<Entity>Service],
  exports: [<Entity>Service],
})
export class <Entity>Module {}
```

#### COMPLEX

```typescript
import { Module } from '@nestjs/common';
import { <Entity>Service } from './<entity-kebab>.service';
import { <Entity>Controller } from './<entity-kebab>.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { NotificationModule } from 'src/modules/infrastructure/notifications/notification.module';
import { <Entity>DomainAService } from './services/<entity-kebab>-domain-a.service';
import { <Entity>DomainBService } from './services/<entity-kebab>-domain-b.service';

@Module({
  imports: [
    UniversalModule,
    PrismaModule,
    NotificationModule,
  ],
  controllers: [<Entity>Controller],
  providers: [
    <Entity>Service,
    <Entity>DomainAService,
    <Entity>DomainBService,
  ],
  exports: [<Entity>Service],
})
export class <Entity>Module {}
```

---

### 5.2 Template: `<entity>.controller.ts`

#### MINIMAL (zero rotas extras)

```typescript
import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '@prisma/client';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleByMethodGuard } from 'src/shared/auth/guards/role-by-method.guard';
import { RoleByMethod } from 'src/shared/auth/role-by-method.decorator';
import { UniversalController } from 'src/shared/universal';
import { <CreateEntityDto> } from './dto/create-<entity-kebab>.dto';
import { <UpdateEntityDto> } from './dto/update-<entity-kebab>.dto';
import { <Entity>Service } from './<entity-kebab>.service';

@ApiTags('<entities-kebab>')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({
  GET:    [Roles.SYSTEM_ADMIN, Roles.ADMIN, Roles.USER],
  POST:   [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  PATCH:  [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  DELETE: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
})
@Controller('<entities-kebab>')
export class <Entity>Controller extends UniversalController<
  <CreateEntityDto>,
  <UpdateEntityDto>,
  <Entity>Service
> {
  constructor(service: <Entity>Service) {
    super(service);
  }
}
```

#### STANDARD (com rotas extras)

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '@prisma/client';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleByMethodGuard } from 'src/shared/auth/guards/role-by-method.guard';
import { RoleByMethod } from 'src/shared/auth/role-by-method.decorator';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';
import { UniversalController } from 'src/shared/universal';
import { <CreateEntityDto> } from './dto/create-<entity-kebab>.dto';
import { <UpdateEntityDto> } from './dto/update-<entity-kebab>.dto';
import { <Entity>Service } from './<entity-kebab>.service';

@ApiTags('<entities-kebab>')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({
  GET:    [Roles.SYSTEM_ADMIN, Roles.ADMIN, Roles.USER],
  POST:   [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  PATCH:  [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  DELETE: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
})
@Controller('<entities-kebab>')
export class <Entity>Controller extends UniversalController<
  <CreateEntityDto>,
  <UpdateEntityDto>,
  <Entity>Service
> {
  constructor(service: <Entity>Service) {
    super(service);
  }

  // IMPORTANTE: Rotas com path literal DEVEM vir ANTES de /:id (herdado do UniversalController)

  @Get('me')
  obterMeu<Entity>() {
    return this.service.obterMeu<Entity>();
  }

  @Get('by-code')
  buscarPorCodigo(@Query('code') code: string) {
    return this.service.buscarPorCodigo(code);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN, Roles.USER)
  validar(@Body() dto: any) {
    return this.service.validar(dto);
  }
}
```

#### COMPLEX (com rotas admin separadas)

```typescript
import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '@prisma/client';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleByMethodGuard } from 'src/shared/auth/guards/role-by-method.guard';
import { RoleByMethod } from 'src/shared/auth/role-by-method.decorator';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';
import { UniversalController } from 'src/shared/universal';
import { <CreateEntityDto> } from './dto/create-<entity-kebab>.dto';
import { <UpdateEntityDto> } from './dto/update-<entity-kebab>.dto';
import { <Entity>Service } from './<entity-kebab>.service';

@ApiTags('<entities-kebab>')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({
  GET:    [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  POST:   [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  PATCH:  [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  DELETE: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
})
@Controller('<entities-kebab>')
export class <Entity>Controller extends UniversalController<
  <CreateEntityDto>,
  <UpdateEntityDto>,
  <Entity>Service
> {
  constructor(service: <Entity>Service) {
    super(service);
  }

  // Rotas com paths literais ANTES das rotas com parâmetros (:id)

  @Get('admin/list')
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  listarParaAdmin(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.listarParaAdmin(
      page != null ? Number(page) : 1,
      limit != null ? Number(limit) : 50,
    );
  }

  @Get('admin/detail/:id')
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  obterDetalhesParaAdmin(@Param('id') id: string) {
    return this.service.obterDetalhesParaAdmin(id);
  }

  @Get('me')
  obterMeu<Entity>() {
    return this.service.obterMeu<Entity>();
  }

  @Put('me')
  atualizarMeu<Entity>(@Body() data: <UpdateEntityDto>) {
    return this.service.atualizarMeu<Entity>(data);
  }
}
```

---

### 5.3 Template: `<entity>.service.ts`

#### MINIMAL (apenas entityConfig)

```typescript
import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import {
  UniversalService,
  UniversalRepository,
  UniversalMetricsService,
  UniversalQueryService,
  UniversalPermissionService,
  createEntityConfig,
} from 'src/shared/universal';
import { <CreateEntityDto> } from './dto/create-<entity-kebab>.dto';
import { <UpdateEntityDto> } from './dto/update-<entity-kebab>.dto';

@Injectable({ scope: Scope.REQUEST })
export class <Entity>Service extends UniversalService<
  <CreateEntityDto>,
  <UpdateEntityDto>
> {
  private static readonly entityConfig = createEntityConfig('<EntityModel>');

  constructor(
    repository: UniversalRepository<<CreateEntityDto>, <UpdateEntityDto>>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) request: any,
  ) {
    const { model, casl } = <Entity>Service.entityConfig;
    super(repository, queryService, permissionService, metricsService, request, model, casl);
    this.setEntityConfig();
  }

  private setEntityConfig() {
    this.entityConfig = {
      includes: {
        // relatedEntity: { select: { id: true, name: true } },
      },
      transform: {
        flatten: {
          // relatedEntity: { field: 'name', target: 'relatedEntityName' },
        },
        exclude: [],
      },
    };
  }
}
```

#### STANDARD (com hooks e métodos extras)

```typescript
import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import {
  UniversalService,
  UniversalRepository,
  UniversalMetricsService,
  UniversalQueryService,
  UniversalPermissionService,
  createEntityConfig,
} from 'src/shared/universal';
import { ForbiddenError, NotFoundError, ConflictError } from 'src/shared/common/errors';
import { NotificationHelper } from 'src/modules/infrastructure/notifications/notification.helper';
import { ENTITY_TYPES } from 'src/modules/infrastructure/notifications/shared/notification.types';
import { <CreateEntityDto> } from './dto/create-<entity-kebab>.dto';
import { <UpdateEntityDto> } from './dto/update-<entity-kebab>.dto';

@Injectable({ scope: Scope.REQUEST })
export class <Entity>Service extends UniversalService<
  <CreateEntityDto>,
  <UpdateEntityDto>
> {
  private static readonly entityConfig = createEntityConfig('<EntityModel>');

  constructor(
    repository: UniversalRepository<<CreateEntityDto>, <UpdateEntityDto>>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) request: any,
    private readonly notificationHelper: NotificationHelper,
  ) {
    const { model, casl } = <Entity>Service.entityConfig;
    super(repository, queryService, permissionService, metricsService, request, model, casl);
    this.setEntityConfig();
  }

  private setEntityConfig() {
    this.entityConfig = {
      includes: {
        relatedEntity: { select: { id: true, name: true } },
      },
      transform: {
        flatten: {
          relatedEntity: { field: 'name', target: 'relatedEntityName' },
        },
        exclude: ['sensitiveField'],
      },
    };
  }

  // ── HOOKS DO CICLO DE VIDA ─────────────────────────────────────────────────

  protected async antesDeCriar(data: <CreateEntityDto>): Promise<void> {
    const user = this.obterUsuarioLogado();
    if (!user?.id) {
      throw new ForbiddenError('Usuário não autenticado');
    }

    // Injetar campos computados
    (data as any).userId = user.id;

    // Normalização de dados
    if (data.code) {
      (data as any).code = data.code.trim().toUpperCase();
    }

    // Validação de unicidade
    const ehUnico = await this.validarSeEhUnico('code', (data as any).code);
    if (!ehUnico) {
      throw new ConflictError('<entity>', (data as any).code, 'code');
    }
  }

  protected async depoisDeCriar(entity: any): Promise<void> {
    // Side-effects: sempre em try/catch — o registro já foi persistido
    try {
      const userId = entity.userId || entity.user?.id;
      if (!userId) return;

      await this.notificationHelper.criar({
        title: '<Entity> criado',
        message: `${entity.name || entity.id} foi criado com sucesso.`,
        userId,
        entityType: ENTITY_TYPES.<ENTITY_UPPER>,
        entityId: entity.id,
        priority: 'NORMAL',
        recipients: [userId],
        allowSelfNotification: true,
      });
    } catch (err) {
      console.error('Erro ao criar notificação pós-criação de <entity>:', err);
    }
  }

  protected async antesDeAtualizar(id: string, data: <UpdateEntityDto>): Promise<void> {
    if (data.code) {
      (data as any).code = data.code.trim().toUpperCase();
      const ehUnico = await this.validarSeEhUnico('code', (data as any).code, id);
      if (!ehUnico) {
        throw new ConflictError('<entity>', (data as any).code, 'code');
      }
    }
  }

  protected async antesDeDesativar(id: string): Promise<void> {
    const user = this.obterUsuarioLogado();
    if (user?.id === id) {
      throw new ForbiddenError('Não é possível desativar o próprio registro.');
    }
  }

  // ── MÉTODOS EXTRAS ─────────────────────────────────────────────────────────

  async obterMeu<Entity>() {
    const user = this.obterUsuarioLogado();
    if (!user) throw new ForbiddenError('Usuário não autenticado');
    this.permissionService.validarAction(this.entityNameCasl, 'read');
    return this.buscarPorCampo('userId', user.id);
  }

  async buscarPorCodigo(code: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'read');
    return this.buscarPorCampo('code', code.toUpperCase());
  }
}
```

#### COMPLEX (orquestrador com sub-serviços)

```typescript
import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import {
  UniversalService,
  UniversalRepository,
  UniversalMetricsService,
  UniversalQueryService,
  UniversalPermissionService,
  createEntityConfig,
} from 'src/shared/universal';
import { ForbiddenError, NotFoundError, UnauthorizedError } from 'src/shared/common/errors';
import { <Entity>DomainAService } from './services/<entity-kebab>-domain-a.service';
import { <Entity>DomainBService } from './services/<entity-kebab>-domain-b.service';
import { <CreateEntityDto> } from './dto/create-<entity-kebab>.dto';
import { <UpdateEntityDto> } from './dto/update-<entity-kebab>.dto';

/**
 * Orquestra o CRUD Universal de '<entity>' e delega regras transversais
 * a serviços dedicados por domínio.
 */
@Injectable({ scope: Scope.REQUEST })
export class <Entity>Service extends UniversalService<
  <CreateEntityDto>,
  <UpdateEntityDto>
> {
  private static readonly entityConfig = createEntityConfig('<EntityModel>');

  constructor(
    repository: UniversalRepository<<CreateEntityDto>, <UpdateEntityDto>>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) request: any,
    private readonly domainA: <Entity>DomainAService,
    private readonly domainB: <Entity>DomainBService,
  ) {
    const { model, casl } = <Entity>Service.entityConfig;
    super(repository, queryService, permissionService, metricsService, request, model, casl);
    this.setEntityConfig();
  }

  private setEntityConfig() {
    this.entityConfig = {
      includes: {
        relatedA: { select: { id: true, name: true } },
        relatedB: { select: { id: true, status: true } },
      },
      transform: {
        flatten: {
          relatedA: { field: 'name', target: 'relatedAName' },
        },
        exclude: [],
      },
    };
  }

  // ── HOOKS DO CICLO DE VIDA ─────────────────────────────────────────────────

  protected async antesDeCriar(data: <CreateEntityDto>): Promise<void> {
    await this.domainA.validarParaCriacao(data);
    await this.domainB.prepararDadosDeCriacao(data);
  }

  protected async depoisDeCriar(entity: any): Promise<void> {
    try {
      await this.domainA.executarSideEffectsDeCriacao(entity);
    } catch (err) {
      console.error('Erro no side-effect de criação de <entity>:', err);
    }
  }

  protected async antesDeAtualizar(id: string, data: <UpdateEntityDto>): Promise<void> {
    await this.domainA.validarParaAtualizacao(id, data);
    await this.domainB.atualizarDadosDerivados(id, data);
  }

  // ── MÉTODOS DELEGADOS AO CONTROLLER ───────────────────────────────────────

  async obterMeu<Entity>() {
    const user = this.obterUsuarioLogado();
    if (!user) throw new UnauthorizedError('Usuário não autenticado');
    this.permissionService.validarAction(this.entityNameCasl, 'read');
    return this.domainA.resolverRegistroDoUsuario(user.id);
  }

  async atualizarMeu<Entity>(data: <UpdateEntityDto>) {
    const user = this.obterUsuarioLogado();
    if (!user) throw new UnauthorizedError('Usuário não autenticado');
    this.permissionService.validarAction(this.entityNameCasl, 'update');
    return this.domainA.atualizarRegistroDoUsuario(user.id, data);
  }

  async listarParaAdmin(page: number, limit: number) {
    return this.domainB.listarComEnriquecimento(page, limit);
  }

  async obterDetalhesParaAdmin(id: string) {
    return this.domainB.obterDetalhes(id);
  }
}
```

#### Sub-serviço de domínio (`services/<entity>-<domain>.service.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { NotFoundError } from 'src/shared/common/errors';

/**
 * Responsável pelas validações e regras de domínio A para <Entity>.
 * É um serviço singleton de suporte — não herda UniversalService.
 */
@Injectable()
export class <Entity>DomainAService {
  constructor(private readonly prisma: PrismaService) {}

  async validarParaCriacao(data: any): Promise<void> {
    // Validação de negócio isolada
  }

  async resolverRegistroDoUsuario(userId: string) {
    const entity = await this.prisma.<entity>.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!entity) throw new NotFoundError('<entity>', userId, 'userId');
    return { data: entity };
  }

  async atualizarRegistroDoUsuario(userId: string, data: any) {
    const entity = await this.prisma.<entity>.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!entity) throw new NotFoundError('<entity>', userId, 'userId');
    const updated = await this.prisma.<entity>.update({
      where: { id: entity.id },
      data,
    });
    return { data: updated };
  }

  async executarSideEffectsDeCriacao(entity: any): Promise<void> {
    // Side-effects: notificações, e-mails, webhooks
  }
}
```

---

### 5.4 Template: `dto/create-<entity>.dto.ts`

```typescript
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class <CreateEntityDto> {
  @ApiProperty({ description: 'Nome do(a) <entity>', example: 'Exemplo' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Descrição do(a) <entity>' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Indica se está ativo', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  // Campos de referência (IDs de relacionamentos) SÃO permitidos nos DTOs
  // O UniversalRepository os transforma automaticamente em { connect: { id } }

  @ApiPropertyOptional({ description: 'ID da entidade relacionada' })
  @IsString()
  @IsOptional()
  relatedEntityId?: string;

  // NÃO incluir: id, createdAt, updatedAt, deletedAt, companyId
}
```

---

### 5.5 Template: `dto/update-<entity>.dto.ts`

```typescript
import { PartialType } from '@nestjs/swagger';
import { <CreateEntityDto> } from './create-<entity-kebab>.dto';

export class <UpdateEntityDto> extends PartialType(<CreateEntityDto>) {}
```

---

### 5.6 Template: Schema Prisma

```prisma
model <Entity> {
  id          String    @id @default(cuid())
  name        String
  description String?
  active      Boolean   @default(true)

  // Campos de negócio específicos da entidade

  // Relacionamento multi-tenant (obrigatório para entidades tenant-aware)
  companyId   String
  company     Company   @relation(fields: [companyId], references: [id])

  // Relacionamento com usuário (quando aplicável)
  // userId   String
  // user     User      @relation(fields: [userId], references: [id])

  // Relacionamentos com outras entidades
  // relatedEntityId String
  // relatedEntity   RelatedEntity @relation(fields: [relatedEntityId], references: [id])

  // Metadados — obrigatórios em todas as entidades
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  @@index([companyId])
  @@index([deletedAt])
  @@map("<entities_snake_case>")
}
```

---

### 5.7 Registros de Configuração Obrigatórios

#### `src/shared/config/entities.config.ts` — adicionar à seção PLUGIN

```typescript
// Em PROJECT_PLUGIN_ENTITY_MAPPING
<EntityModel>: '<EntityCasl>',

// Em PROJECT_PLUGIN_CASL_TO_MODEL_MAPPING
<EntityCasl>: '<EntityModel>',
```

**Exemplo completo:**
```typescript
export const PROJECT_PLUGIN_ENTITY_MAPPING = {
  // ... entidades existentes ...
  product: 'Product',            // ← adicionar
} as const;

export const PROJECT_PLUGIN_CASL_TO_MODEL_MAPPING = {
  // ... entidades existentes ...
  Product: 'product',            // ← adicionar
} as const;
```

#### `src/shared/config/casl-role-permissions.config.ts` — adicionar permissões

```typescript
// Dentro do role correspondente:

USER: (user: User, { can }: any) => {
  // Permissões básicas do USER para a nova entidade
  can('read', '<EntityCasl>', { companyId: user.companyId });
  can('create', '<EntityCasl>', { userId: user.id });
  can('manage', '<EntityCasl>', { userId: user.id });
},

SERVICE_PROVIDER: (user: User, { can }: any) => {
  // Inclui permissões do USER
  // Permissões adicionais para SERVICE_PROVIDER
  can('manage', '<EntityCasl>', { companyId: user.companyId });
},

ADMIN: (user: User, { can }: any) => {
  can('manage', '<EntityCasl>', { companyId: user.companyId });
},

SYSTEM_ADMIN: (user: User, { can }: any) => {
  can('manage', '<EntityCasl>');  // Sem restrições
},
```

#### `src/app.module.ts` — adicionar import

```typescript
// Adicionar import no topo
import { <Entity>Module } from './modules/<contexto>/<entity-kebab>/<entity-kebab>.module';

// Adicionar na seção correta do array imports:
// --- Plugins: <categoria> ---
<Entity>Module,
```

---

## 6. CONVENÇÕES DO PROJETO

### 6.1 Idiomas

| Contexto | Idioma | Exemplos |
|----------|--------|---------|
| Nomes de entidades (Prisma, CASL, TypeScript) | Inglês | `User`, `Company`, `ServiceProvider`, `Booking` |
| Nomes de propriedades | Inglês | `id`, `name`, `email`, `companyId`, `createdAt` |
| Nomes de métodos | Português literal | `buscarPorId`, `antesDeCriar`, `validarSeEhUnico` |
| Comentários e docstrings | Português | `// Busca entidade por campo específico` |
| Mensagens de erro | Português | `'Usuário não autenticado'` |
| Variáveis locais | Inglês | `const user`, `const entity`, `const whereClause` |

### 6.2 Nomenclatura de Métodos por Categoria

```typescript
// BUSCA
buscarPorId(id: string)
buscarTodos()
buscarComPaginacao(page: number, limit: number)
buscarPorCampo(field: string, value: any)
buscarMuitosPorCampo(field: string, value: any)
buscarPorCampos(fields: Record<string, any>)
buscar<Entity>Por<Criterio>(criterio: string)

// CRIAÇÃO E ATUALIZAÇÃO
criar(data: CreateDto)
atualizar(id: string, data: UpdateDto)
criarOu<Algo>(data: any)  // ex: criarOuAtualizar

// DESATIVAÇÃO
desativar(id: string)
reativar(id: string)

// VALIDAÇÃO
validarSeEhUnico(field: string, value: any, excludeId?: string)
validarExistencia(id: string)
validarSePode<Acao>(id: string)
validarParaCriacao(data: any)
validarParaAtualizacao(id: string, data: any)

// HOOKS (nomenclatura fixa — não alterar)
antesDeCriar(data: CreateDto)
depoisDeCriar(entity: any)
antesDeAtualizar(id: string, data: UpdateDto)
depoisDeAtualizar(id: string, data: any)
antesDeDesativar(id: string)
depoisDeDesativar(id: string)
antesDeReativar(id: string)
depoisDeReativar(id: string)

// CONFIGURAÇÃO (nomenclatura fixa — não alterar)
setEntityConfig()
getEntityConfig()
getIncludeConfig()
getTransformConfig()

// UTILITÁRIOS PROTEGIDOS (disponíveis via herança)
obterUsuarioLogado()
obterUsuarioLogadoId()
obterCompanyId()
calcularInformacoesDePaginacao(page, limit, total)
transformData(data)
```

### 6.3 Nomenclatura de Arquivos

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Módulo | `<entity-kebab>.module.ts` | `service-category.module.ts` |
| Service | `<entity-kebab>.service.ts` | `service-category.service.ts` |
| Controller | `<entity-kebab>.controller.ts` | `service-category.controller.ts` |
| Create DTO | `create-<entity-kebab>.dto.ts` | `create-service-category.dto.ts` |
| Update DTO | `update-<entity-kebab>.dto.ts` | `update-service-category.dto.ts` |
| Extra DTO | `<action>-<entity-kebab>.dto.ts` | `validate-coupon.dto.ts` |
| Sub-serviço | `<entity-kebab>-<dominio>.service.ts` | `company-geocoding.service.ts` |
| Validator | `<entity-kebab>.validator.ts` | `user.validator.ts` |
| Cron | `<entity-kebab>-<job>-cron.service.ts` | `reminder-notification-cron.service.ts` |
| Constantes | `<entity-kebab>-*.constants.ts` | `company-payout.constants.ts` |

### 6.4 Organização de Pastas

```
src/modules/
├── <contexto>/          ← Domínio de negócio (commercial, compliance, marketplace, infrastructure)
│   └── <entity>/        ← Módulo da entidade
│       ├── dto/         ← Data Transfer Objects
│       ├── services/    ← Sub-serviços (apenas COMPLEX)
│       ├── validators/  ← Validators de negócio (opcional)
│       └── constants/   ← Constantes (opcional)
```

**Contextos existentes:**
- `commercial` — agenda, pagamentos, disponibilidade, cupons
- `compliance` — KYC, lembretes
- `marketplace` — catálogo, avaliações, favoritos
- `infrastructure` — notificações, tickets, webhooks, dashboard

### 6.5 EntityConfig — includes e transforms

```typescript
private setEntityConfig() {
  this.entityConfig = {
    // includes: define as relações Prisma a carregar em todas as queries
    includes: {
      // Relação simples com campos específicos (select)
      relatedEntity: { select: { id: true, name: true } },

      // Relação com include aninhado
      parentEntity: {
        select: { id: true, name: true },
        include: { nestedEntity: true },
      },
    },

    // transform: define como os dados são transformados antes de retornar
    transform: {
      // flatten: mapeia objeto de relação para campo plano no response
      flatten: {
        // Simples: move toda a relação para um novo campo
        relatedEntity: 'relatedEntityObject',

        // Específico: extrai um campo da relação para um campo plano
        relatedEntity: { field: 'name', target: 'relatedEntityName' },
      },

      // custom: transformação arbitrária aplicada a cada item
      custom: (data) => {
        // Modificar data e retornar
        return data;
      },

      // exclude: remove campos do response
      exclude: ['password', 'sensitiveField', 'internalField'],
    },
  };
}
```

### 6.6 Hooks — Regras de Uso

| Hook | Quando usar | O que é permitido |
|------|-------------|------------------|
| `antesDeCriar` | Validações de negócio antes de persistir | Lançar erros, modificar `data`, consultas de validação |
| `depoisDeCriar` | Side-effects após persistência | Notificações, e-mails, webhooks — sempre em try/catch |
| `antesDeAtualizar` | Validações antes do update | Lançar erros, modificar `data` |
| `depoisDeAtualizar` | Side-effects após update | Notificações, sincronizações — sempre em try/catch |
| `antesDeDesativar` | Impedir deleção em certas condições | Lançar erros |
| `depoisDeDesativar` | Side-effects após soft-delete | Notificações — sempre em try/catch |
| `antesDeReativar` | Validações antes do restore | Lançar erros |
| `depoisDeReativar` | Side-effects após restore | Notificações — sempre em try/catch |

### 6.7 Guards — Quando Usar Cada Um

| Guard | Uso | Onde aplicar |
|-------|-----|-------------|
| `AuthGuard` | Valida JWT — obrigatório em todo endpoint autenticado | `@UseGuards(AuthGuard, ...)` no controller |
| `RoleByMethodGuard` | Roles diferentes por método HTTP — **padrão obrigatório** | `@UseGuards(AuthGuard, RoleByMethodGuard)` |
| `RoleGuard` | **NÃO usar em novos módulos** — legado | — |
| `RateLimitGuard` | Limitar requisições em endpoints sensíveis | Endpoints de auth, operações críticas |
| `RefreshGuard` | Apenas no endpoint de refresh token | `src/shared/auth/auth.controller.ts` |

### 6.8 Decorators de Roles

```typescript
// PADRÃO OBRIGATÓRIO em novos módulos:
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({
  GET:    [Roles.SYSTEM_ADMIN, Roles.ADMIN, Roles.USER, Roles.SERVICE_PROVIDER],
  POST:   [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  PATCH:  [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  DELETE: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
})

// Para rotas extras que precisam de role diferente do padrão do método:
@Get('admin/list')
@RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
listarParaAdmin() { ... }

// Para endpoints públicos:
@Get('public-endpoint')
@Public()
endpointPublico() { ... }
```

### 6.9 Custom Errors — Quando Usar Cada Um

| Erro | Código HTTP | Quando usar |
|------|-------------|-------------|
| `NotFoundError(entity, value, field)` | 404 | Entidade não encontrada |
| `ForbiddenError(message)` | 403 | Sem permissão para a operação |
| `UnauthorizedError(message)` | 401 | Não autenticado |
| `ConflictError(entity, value, field)` | 409 | Conflito de dados únicos |
| `ValidationError(message)` | 422 | Dados inválidos |
| `RequiredFieldError(fieldName)` | 422 | Campo obrigatório ausente |
| `InvalidCredentialsError()` | 401 | Credenciais incorretas |

### 6.10 Validators Customizados — Quando Usar

| Decorator | Quando usar no DTO |
|-----------|-------------------|
| `@IsCPF()` | Campos de CPF |
| `@IsCNPJ()` | Campos de CNPJ |
| `@IsPhoneBR()` | Campos de telefone BR |
| `@IsStrongPassword()` | Campos de senha |
| `@IsUniqueCPF()` | CPF que deve ser único no banco |
| `@IsUniqueEmail()` | Email que deve ser único no banco |
| `@IsCuid()` | Campos de ID referenciando outra entidade |

### 6.11 Interceptors — Regras

| Interceptor | Onde está | Deve ser re-aplicado? |
|-------------|-----------|----------------------|
| `TenantInterceptor` | `UniversalController` via `@UseInterceptors` | **NÃO** — já aplicado automaticamente |
| `CaslInterceptor` | `UniversalController` via `@UseInterceptors` | **NÃO** — já aplicado automaticamente |
| `SoftDeleteInterceptor` | `app.module.ts` global | **NÃO** — global |
| `MetricsInterceptor` | `main.ts` global | **NÃO** — global |
| `AuthInterceptor` | `src/shared/auth/interceptors` | **NÃO** — via AuthModule global |

---

## 7. MATRIZ DE REUTILIZAÇÃO

### 7.1 Componentes do Universal Pattern

| Componente | Localização | Quando Usar | Como Usar |
|------------|-------------|-------------|-----------|
| `UniversalService` | `src/shared/universal/services/universal.service.ts` | Todo service de feature | `extends UniversalService<CreateDto, UpdateDto>` |
| `UniversalController` | `src/shared/universal/controllers/universal.controller.ts` | Todo controller de feature | `extends UniversalController<CreateDto, UpdateDto, Service>` |
| `UniversalRepository` | `src/shared/universal/repositories/universal.repository.ts` | Automático via DI | Disponível como `this.repository` no service |
| `UniversalQueryService` | `src/shared/universal/services/query.service.ts` | Automático via herança | Disponível como `this.queryService` no service |
| `UniversalPermissionService` | `src/shared/universal/services/permission.service.ts` | Automático via herança | Disponível como `this.permissionService` no service |
| `UniversalMetricsService` | `src/shared/universal/services/metrics.service.ts` | Automático via herança | Disponível como `this.metricsService` no service |
| `createEntityConfig()` | `src/shared/universal/types.ts` | Todo service de feature | `private static readonly entityConfig = createEntityConfig('entityName')` |

### 7.2 Métodos do UniversalQueryService

| Método | Quando Usar |
|--------|-------------|
| `construirWhereClauseParaRead(entityNameCasl, extraWhere?)` | Queries de leitura com CASL + companyId + deletedAt |
| `construirWhereClauseParaUpdate(entityNameCasl, id)` | WHERE para update (CASL + id) |
| `construirWhereClauseParaDelete(entityNameCasl, id)` | WHERE para soft-delete (CASL + id) |
| `construirWhereClauseSomenteEmpresa(entityNameCasl, extra?)` | WHERE somente por empresa (sem CASL do usuário) |

### 7.3 Métodos do UniversalRepository

| Método | Quando Usar no Sub-Serviço (COMPLEX) |
|--------|--------------------------------------|
| `buscarMuitos(entityName, where?, options?, include?)` | Lista com filtros e ordenação |
| `buscarComPaginacao(entityName, where?, page, limit, orderBy?, include?)` | Lista paginada |
| `buscarUnico(entityName, where, include?)` | Busca por campo único (id) |
| `buscarPrimeiro(entityName, where, include?, select?)` | Busca o primeiro que atende critério |
| `criar(entityName, data, include?)` | Cria registro (com companyId automático) |
| `atualizar(entityName, where, data, include?)` | Atualiza registro |
| `desativar(entityName, where)` | Soft delete (seta deletedAt) |
| `reativar(entityName, where)` | Restaura soft delete |
| `contarTodos(entityName, where?)` | Conta registros |
| `existe(entityName, where)` | Verifica existência |
| `upsert(entityName, where, create, update, include?)` | Criar ou atualizar |
| `deletarMuitos(entityName, where)` | Delete em batch |

### 7.4 Guards e Decorators

| Componente | Importar de | Quando Usar |
|------------|-------------|-------------|
| `AuthGuard` | `src/shared/auth/guards/auth.guard` | Todo endpoint autenticado |
| `RoleByMethodGuard` | `src/shared/auth/guards/role-by-method.guard` | Todo controller de feature |
| `@RoleByMethod()` | `src/shared/auth/role-by-method.decorator` | Todo controller de feature |
| `@RequiredRoles()` | `src/shared/auth/required-roles.decorator` | Rotas extras com role específico |
| `@Public()` | `src/shared/auth/decorators/public.decorator` | Endpoints sem autenticação |
| `@CurrentUser()` | `src/shared/auth/decorators/current-user.decorator` | Parâmetro com `request.user` |

### 7.5 Validators de DTO

| Validator | Importar de | Quando Usar |
|-----------|-------------|-------------|
| `@IsCPF()` | `src/shared/validators/cpf.validator` | Campo CPF |
| `@IsCNPJ()` | `src/shared/validators/cnpj.validator` | Campo CNPJ |
| `@IsPhoneBR()` | `src/shared/validators/phone-br.validator` | Campo telefone BR |
| `@IsStrongPassword()` | `src/shared/validators/strong-password.validator` | Campo senha |
| `@IsUniqueEmail()` | `src/shared/validators/unique-email.validator` | Email único assíncrono |
| `@IsUniqueCPF()` | `src/shared/validators/unique-cpf.validator` | CPF único assíncrono |
| `@IsCuid()` | `src/shared/validators/is-cuid.validator` | Campo ID em formato CUID |

### 7.6 Custom Errors

| Classe | Importar de | HTTP Status |
|--------|-------------|-------------|
| `NotFoundError` | `src/shared/common/errors` | 404 |
| `ForbiddenError` | `src/shared/common/errors` | 403 |
| `UnauthorizedError` | `src/shared/common/errors` | 401 |
| `ConflictError` | `src/shared/common/errors` | 409 |
| `ValidationError` | `src/shared/common/errors` | 422 |
| `RequiredFieldError` | `src/shared/common/errors` | 422 |
| `InvalidCredentialsError` | `src/shared/common/errors` | 401 |

### 7.7 Utilitários

| Utilitário | Importar de | Quando Usar |
|------------|-------------|-------------|
| `withDateFields(data, keys)` | `src/shared/common/utils/date-fields.util` | Converter strings ISO para `Date` antes de persistir |
| `NotificationHelper` | `src/modules/infrastructure/notifications/notification.helper` | Criar notificações em hooks `depoisDe*` |
| `ENTITY_TYPES` | `src/modules/infrastructure/notifications/shared/notification.types` | Tipos de entidade para notificações |
| `PartialType` | `@nestjs/swagger` | `UpdateDto extends PartialType(CreateDto)` |

### 7.8 O Que Nunca Recriar

Os seguintes comportamentos estão implementados globalmente e **não devem ser reimplementados** em nenhum módulo:

| Comportamento | Provido por |
|---------------|-------------|
| Validação de JWT e usuário | `AuthGuard` global |
| Filtros de exceção por tipo | `app.module.ts` — todos os `*Filter` |
| ValidationPipe com whitelist | `app.module.ts` — `APP_PIPE` |
| Soft delete automático | `SoftDeleteInterceptor` global |
| Métricas Prometheus | `MetricsInterceptor` global + `UniversalMetricsService` |
| Paginação | `UniversalService.buscarComPaginacao()` |
| WHERE com filtro de empresa | `UniversalQueryService` automático |
| WHERE com soft-delete | `UniversalQueryService` — `deletedAt: null` automático |
| Injeção de companyId na criação | `UniversalRepository.criar()` automático |
| Transformação `*Id → connect` | `UniversalRepository.transformarDadosParaPrisma()` automático |

---

## 8. CHECKLIST DE CRIAÇÃO DE NOVO MÓDULO

### FASE 1 — Pré-Implementação

```
[ ] 1. Classificar o módulo (MINIMAL / STANDARD / COMPLEX / CUSTOM)
        usando os critérios da Seção 3

[ ] 2. Definir o schema Prisma em prisma/schema/<contexto>.prisma
        - id String @id @default(cuid())
        - createdAt DateTime @default(now())
        - updatedAt DateTime @updatedAt
        - deletedAt DateTime?
        - companyId String + relação (se multi-tenant)
        - @@index([companyId])
        - @@index([deletedAt])

[ ] 3. Executar: npx prisma migrate dev --name "add-<entity>"
        - Verificar se a migration foi criada corretamente

[ ] 4. Registrar a entidade em src/shared/config/entities.config.ts
        - PROJECT_PLUGIN_ENTITY_MAPPING: { <entity>: '<Entity>' }
        - PROJECT_PLUGIN_CASL_TO_MODEL_MAPPING: { '<Entity>': '<entity>' }

[ ] 5. Definir permissões CASL em casl-role-permissions.config.ts
        - Permissões por role: USER, SERVICE_PROVIDER, ADMIN, SYSTEM_ADMIN
        - Restrições por atributo (companyId, userId, etc.)
```

### FASE 2 — Implementação

```
[ ] 6. Criar a pasta: src/modules/<contexto>/<entity-kebab>/

[ ] 7. Criar dto/create-<entity-kebab>.dto.ts
        - Campos com @ApiProperty() / @ApiPropertyOptional()
        - Validadores class-validator
        - SEM: id, createdAt, updatedAt, deletedAt, companyId

[ ] 8. Criar dto/update-<entity-kebab>.dto.ts
        - export class <UpdateEntityDto> extends PartialType(<CreateEntityDto>) {}

[ ] 9. Criar <entity-kebab>.service.ts
        - @Injectable({ scope: Scope.REQUEST })
        - extends UniversalService<<CreateEntityDto>, <UpdateEntityDto>>
        - private static readonly entityConfig = createEntityConfig('<entity>')
        - Constructor: repository, queryService, permissionService, metricsService, request, ...extras
        - super(repository, queryService, permissionService, metricsService, request, model, casl)
        - this.setEntityConfig() após super()
        - setEntityConfig() com includes e transforms
        - Hooks implementados conforme complexidade (MINIMAL: nenhum)

[ ] 10. Criar <entity-kebab>.controller.ts
         - extends UniversalController<<CreateEntityDto>, <UpdateEntityDto>, <Entity>Service>
         - @UseGuards(AuthGuard, RoleByMethodGuard)
         - @RoleByMethod({ GET: [...], POST: [...], PATCH: [...], DELETE: [...] })
         - @Controller('<entities-kebab>')
         - @ApiTags('<entities-kebab>') + @ApiBearerAuth('JWT-auth')
         - Rotas extras com paths literais ANTES das rotas com :id

[ ] 11. Criar <entity-kebab>.module.ts
         - imports: [UniversalModule, ...dependênciasExtras]
         - controllers: [<Entity>Controller]
         - providers: [<Entity>Service, ...subServicos]
         - exports: [<Entity>Service]

[ ] 12. [COMPLEX] Criar services/<entity-kebab>-<dominio>.service.ts
         - @Injectable() (singleton — sem REQUEST scope)
         - PrismaService injetado diretamente
         - Responsabilidade única por arquivo
```

### FASE 3 — Registro

```
[ ] 13. Adicionar import em src/app.module.ts
         - Import do módulo no topo do arquivo
         - Adicionar na seção correta do array imports

[ ] 14. Verificar: npm run start:dev
         - Sem erros de DI (Nest Dependency Injection)
         - Sem erros de compilação TypeScript
```

### FASE 4 — Validação

```
[ ] 15. Testar todos os endpoints herdados do UniversalController:
         GET  /<entities>?page=1&limit=10       → buscarComPaginacao
         GET  /<entities>/all                   → buscarTodos
         GET  /<entities>/:id                   → buscarPorId
         GET  /<entities>/search/name?name=X    → buscarPorNome
         GET  /<entities>/search/field?field=X&value=Y → buscarPorCampo
         POST /<entities>                       → criar
         PATCH /<entities>/:id                  → atualizar
         DELETE /<entities>/:id                 → desativar (soft delete)
         POST /<entities>/:id/restore           → reativar

[ ] 16. Verificar multi-tenancy:
         - Criar registro e confirmar que companyId está preenchido automaticamente
         - Listar registros e confirmar que retorna apenas da empresa do usuário
         - Testar com SYSTEM_ADMIN (deve ver todos, ou empresa específica)

[ ] 17. Verificar soft-delete:
         - DELETE retorna { message: "..." } e seta deletedAt
         - GET não retorna registros com deletedAt preenchido
         - POST /:id/restore limpa deletedAt

[ ] 18. Verificar CASL:
         - Testar com role USER: deve ver apenas seus registros
         - Testar com role ADMIN: deve ver registros da empresa
         - Testar com role SYSTEM_ADMIN: deve ver todos

[ ] 19. [STANDARD/COMPLEX] Testar rotas extras
         - Verificar que rotas com path literal respondem antes de :id

[ ] 20. Verificar Swagger:
         - Acessar /docs e confirmar que o módulo aparece na tag correta
         - Confirmar que os DTOs estão documentados
```

---

## 9. PROMPT OFICIAL DE GERAÇÃO DE MÓDULOS

> Este é o prompt mestre para solicitar a criação de novos módulos seguindo o padrão oficial do projeto.

---

```
Você é um Arquiteto de Software Sênior especialista em NestJS 11, Prisma, PostgreSQL e arquitetura modular baseada em Universal CRUD Pattern.

Sua função é gerar módulos completos seguindo EXATAMENTE a arquitetura definida neste documento.

══════════════════════════════════════════════════════
REGRAS ABSOLUTAS — NÃO NEGOCIÁVEIS
══════════════════════════════════════════════════════

1. Este documento é a FONTE ÚNICA DA VERDADE.
2. NÃO invente arquiteturas.
3. NÃO utilize Clean Architecture, DDD, CQRS, Repository Pattern próprio.
4. NÃO crie Services adicionais sem justificativa nos critérios de COMPLEX.
5. NÃO altere nomenclaturas, idiomas ou convenções.
6. NÃO simplifique os templates — gere tudo completo.
7. NÃO sugira melhorias à arquitetura existente.
8. Gere APENAS código pronto para produção — zero pseudo-código.

══════════════════════════════════════════════════════
PROCESSO OBRIGATÓRIO ANTES DE GERAR CÓDIGO
══════════════════════════════════════════════════════

PASSO 1 — CLASSIFICAÇÃO AUTOMÁTICA

Analise a entidade solicitada e classifique usando os critérios da Seção 3:

MINIMAL → CRUD puro, sem hooks, sem side-effects, sem métodos extras
STANDARD → Tem hooks OU métodos extras OU side-effects OU cron
COMPLEX → Tem 2+ de: integração externa, múltiplos controllers, estado/workflow,
           sub-serviços dedicados, 3+ responsabilidades no service
CUSTOM → Sem CRUD padrão: agregação, relatório, adaptador

Apresente a classificação e a justificativa antes de qualquer código.

PASSO 2 — DEFINIÇÃO DA ESTRUTURA

Liste a árvore de pastas completa com todos os arquivos que serão gerados.

PASSO 3 — GERAÇÃO DOS ARQUIVOS

Gere TODOS os arquivos na ordem:
1. Schema Prisma (modelo completo)
2. create-<entity>.dto.ts
3. update-<entity>.dto.ts
4. [DTOs extras se STANDARD/COMPLEX]
5. <entity>.service.ts
6. [Sub-serviços se COMPLEX]
7. <entity>.controller.ts
8. <entity>.module.ts

══════════════════════════════════════════════════════
REGRAS DE IMPLEMENTAÇÃO
══════════════════════════════════════════════════════

SERVICE — Obrigatório:
• @Injectable({ scope: Scope.REQUEST })
• extends UniversalService<CreateDto, UpdateDto>
• private static readonly entityConfig = createEntityConfig('<entity>')
• Constructor: repository, queryService, permissionService, metricsService, request, ...extras
• super(repository, queryService, permissionService, metricsService, request, model, casl)
• this.setEntityConfig() após super()
• setEntityConfig() definindo includes e transforms
• Hooks implementados conforme a classificação
• NUNCA usar PrismaService diretamente no service principal
• PrismaService SOMENTE em sub-serviços de COMPLEX

CONTROLLER — Obrigatório:
• extends UniversalController<CreateDto, UpdateDto, Service>
• @UseGuards(AuthGuard, RoleByMethodGuard)
• @RoleByMethod({ GET: [...], POST: [...], PATCH: [...], DELETE: [...] })
• @Controller('<entities-kebab>')
• @ApiTags('<entities-kebab>') + @ApiBearerAuth('JWT-auth')
• Rotas com paths literais ANTES de rotas com :id
• NUNCA aplicar TenantInterceptor ou CaslInterceptor — já no UniversalController

MODULE — Obrigatório:
• imports: [UniversalModule, ...dependênciasExtras]
• exports: [<Entity>Service]
• NUNCA importar PrismaModule, CaslModule, TenantModule individualmente

DTOs — Obrigatório:
• class-validator + @nestjs/swagger em todos os campos
• UpdateDto extends PartialType(CreateDto) de @nestjs/swagger
• NUNCA incluir: id, createdAt, updatedAt, deletedAt, companyId

══════════════════════════════════════════════════════
REGISTROS DE CONFIGURAÇÃO — SEMPRE AO FINAL
══════════════════════════════════════════════════════

Ao final de cada geração, mostre obrigatoriamente:

1. Trecho para entities.config.ts:
   - PROJECT_PLUGIN_ENTITY_MAPPING
   - PROJECT_PLUGIN_CASL_TO_MODEL_MAPPING

2. Sugestão completa para casl-role-permissions.config.ts:
   - Permissões para USER, SERVICE_PROVIDER, ADMIN, SYSTEM_ADMIN

3. Trecho para app.module.ts:
   - Import statement
   - Linha no array imports

══════════════════════════════════════════════════════
CHECKLIST FINAL — SEMPRE AO FINAL
══════════════════════════════════════════════════════

Ao final sempre apresentar:

✅ Arquivos Gerados:
  • <entity>.module.ts
  • <entity>.service.ts
  • <entity>.controller.ts
  • dto/create-<entity>.dto.ts
  • dto/update-<entity>.dto.ts
  • [arquivos extras]

✅ Registros Necessários:
  • entities.config.ts — trechos
  • casl-role-permissions.config.ts — permissões
  • app.module.ts — import e registro

✅ Endpoints Disponíveis (herdados do UniversalController):
  • GET  /<entities>?page=1&limit=10
  • GET  /<entities>/all
  • GET  /<entities>/:id
  • GET  /<entities>/search/name?name=X
  • GET  /<entities>/search/field?field=X&value=Y
  • POST /<entities>
  • PATCH /<entities>/:id
  • DELETE /<entities>/:id
  • POST /<entities>/:id/restore
  • GET  /<entities>/metrics (ADMIN+)
  • [endpoints extras gerados]

✅ Próximos Passos:
  • npx prisma migrate dev --name "add-<entity>"
  • Registrar na entities.config.ts
  • Registrar nas permissões CASL
  • Registrar no app.module.ts
  • npm run start:dev e testar todos os endpoints

══════════════════════════════════════════════════════
FORMATO DE SAÍDA — SEMPRE NESTA ORDEM
══════════════════════════════════════════════════════

1. Classificação do módulo + justificativa
2. Estrutura de pastas (árvore completa)
3. Schema Prisma
4. Código completo de cada arquivo (sem omissões)
5. Registros de configuração
6. Checklist final

Aguardando a entidade para gerar o módulo.
```

---

## 10. ESPECIFICAÇÕES DE REFERÊNCIA

Esta seção reúne **especificações funcionais de domínio** para orientar classificação, modelagem Prisma, divisão user/administrator e geração de código. Use em conjunto com a [Seção 3](#3-classificação-de-módulos) e o [`COMO-USAR.md`](./COMO-USAR.md).

---

### 10.1 MÓDULO: COMPANIES

Especificação funcional e arquitetura vivem **na pasta do módulo** (não duplicar aqui):

| Documento | Conteúdo |
|-----------|----------|
| [`../companies/SPEC.md`](../companies/SPEC.md) | Requisitos de negócio (passo 0) |
| [`../companies/ARCHITECTURE.md`](../companies/ARCHITECTURE.md) | Classificação COMPLEX, estrutura, Prisma, endpoints (passos 1–2) |

**Status:** passos 0–2 concluídos — próximo passo é **PASSO 3** (geração de código conforme ordem em `ARCHITECTURE.md`).

---

*Documento técnico definitivo — Versão 2.0 — Lobocode API*
