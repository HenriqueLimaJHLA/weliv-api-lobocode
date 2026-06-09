# ⚙️ Module Generator v2.0

**Guia completo para geração de módulos NestJS usando o motor Universal.**

---

## 🎯 Princípios

1. **Sempre estender** `UniversalService` e `UniversalController`
2. **Nunca duplicar** lógica - usar hooks quando possível
3. **Validações no service** - não no controller
4. **companyId obrigatório** - multi-tenancy é inegociável
5. **Soft delete sempre** - nunca usar DELETE hard

---

## 📋 Template de Geração

###1. DTOs (Data Transfer Objects)

#### CreateDto Template

```typescript
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsDateString,
  IsUUID,
  IsEmail,
  IsPhoneNumber,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export enum {{EntityName}}Status {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class Create{{EntityName}}Dto {
  // ═══════════════════════════════════════════════════════════════════════════
  // CAMPOS OBRIGATÓRIOS
  // ═══════════════════════════════════════════════════════════════════════════
  
  @ApiProperty({ description: 'Nome do recurso', example: 'Meu Produto' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // CAMPOS OPCIONAIS
  // ═══════════════════════════════════════════════════════════════════════════
  
  @ApiPropertyOptional({ description: 'Descrição', example: 'Descrição detalhada' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Código único', example: 'SKU-001' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Matches(/^[A-Z0-9-]+$/, { message: 'Código deve conter apenas letras, números e hifens' })
  code?: string;

  @ApiPropertyOptional({ description: 'Status', enum: {{EntityName}}Status, default: {{EntityName}}Status.DRAFT })
  @IsEnum({{EntityName}}Status)
  @IsOptional()
  status?: {{EntityName}}Status;

  @ApiPropertyOptional({ description: 'Preço', example: 99.99 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Data', example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // RELACIONAMENTOS (apenas IDs)
  // ═══════════════════════════════════════════════════════════════════════════
  
  @ApiPropertyOptional({ description: 'ID da categoria' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // NÃO INCLUIR: id, companyId, createdAt, updatedAt, deletedAt
  // ═══════════════════════════════════════════════════════════════════════════
}
```

#### UpdateDto Template

```typescript
import { PartialType } from '@nestjs/swagger';
import { Create{{EntityName}}Dto } from './create-{{domain}}.dto';

export class Update{{EntityName}}Dto extends PartialType(Create{{EntityName}}Dto) {}
```

---

### 2. Service Template

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
import { ForbiddenError, ConflictError, NotFoundError } from 'src/shared/common/errors';
import { Create{{EntityName}}Dto, {{EntityName}}Status } from './dto/create-{{domain}}.dto';
import { Update{{EntityName}}Dto } from './dto/update-{{domain}}.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable({ scope: Scope.REQUEST })
export class Administrator{{EntityName}}Service extends UniversalService<
  Create{{EntityName}}Dto,
  Update{{EntityName}}Dto
> {
  // Configuração da entidade (usar 'as any' até registrar em entities.config.ts)
  private static readonly entityConfig = createEntityConfig('{{domain}}' as any);

  constructor(
    private readonly repository: UniversalRepository<Create{{EntityName}}Dto, Update{{EntityName}}Dto>,
    private readonly queryService: UniversalQueryService,
    private readonly permissionService: UniversalPermissionService,
    private readonly metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) private readonly request: any,
  ) {
    const { model, casl } = Administrator{{EntityName}}Service.entityConfig;
    super(
      repository,
      queryService,
      permissionService,
      metricsService,
      request,
      model,
      casl,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HOOKS DE CICLO DE VIDA
  // ═══════════════════════════════════════════════════════════════════════════════

  protected async antesDeCriar(data: Create{{EntityName}}Dto): Promise<void> {
    const user = this.obterUsuarioLogado();
    
    //1. Validar autenticação
    if (!user?.id) {
      throw new ForbiddenError('Usuário não autenticado');
    }

    // 2. Validar unicidade de código
    if (data.code) {
      const normalizedCode = data.code.trim().toUpperCase();
      const whereUnicidade = this.queryService.construirWhereClauseParaRead(
        this.entityNameCasl,
        { code: normalizedCode },
      );
      const existe = await this.repository.buscarPrimeiro(this.entityName, whereUnicidade);
      
      if (existe) {
        throw new ConflictError(`Já existe um registro com o código ${normalizedCode}`);
      }
      
      (data as any).code = normalizedCode;
    }

    // 3. Normalizar outros campos se necessário
    if (data.name) {
      (data as any).name = data.name.trim();
    }
  }

  protected async depoisDeCriar(entity: any): Promise<void> {
    // Log de auditoria
    console.log(`[AUDIT] {{EntityName}} criado: ${entity.id} por ${this.obterUsuarioLogado()?.id}`);
  }

  protected async antesDeAtualizar(id: string, data: Update{{EntityName}}Dto): Promise<void> {
    // 1. Validar unicidade de código (excluindo o registro atual)
    if (data.code) {
      const normalizedCode = data.code.trim().toUpperCase();
      const whereUnicidade = this.queryService.construirWhereClauseParaRead(
        this.entityNameCasl,
        { code: normalizedCode },
      );
      const existe = await this.repository.buscarPrimeiro(this.entityName, {
        ...whereUnicidade,
        id: { not: id },
      });
      
      if (existe) {
        throw new ConflictError(`Já existe outro registro com o código ${normalizedCode}`);
      }
      
      (data as any).code = normalizedCode;
    }
  }

  protected async antesDeDesativar(id: string): Promise<void> {
    // Validar regras de negócio antes de desativar
    const entity = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });
    
    if (!entity) {
      throw new NotFoundError(this.entityName, id, 'id');
    }

    // Exemplo: não permitir desativar se tiver relacionamentos ativos
    // if (entity.childCount > 0) {
    //   throw new ForbiddenError('Não é possível desativar: existem filhos ativos');
    // }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MÉTODOS CUSTOMIZADOS
  // ═══════════════════════════════════════════════════════════════════════════════

  async buscarPorCodigo(code: string) {
    if (!code?.trim()) {
      throw new ConflictError('O parâmetro code é obrigatório');
    }
    
    this.permissionService.validarAction(this.entityNameCasl, 'read');
    return this.buscarPorCampo('code', code.trim().toUpperCase());
  }

  async buscarPorStatus(status: {{EntityName}}Status) {
    this.permissionService.validarAction(this.entityNameCasl, 'read');
    return this.buscarMuitosPorCampo('status', status);
  }

  async obterResumoEstatisticas() {
    const companyId = this.obterCompanyId();
    if (!companyId) {
      throw new ForbiddenError('Contexto de empresa não disponível');
    }
    
    this.permissionService.validarAction(this.entityNameCasl, 'read');
    const where = this.queryService.construirWhereClauseParaRead(this.entityNameCasl, {});

    const [total, ativos, inativos] = await Promise.all([
      this.repository.contarTodos(this.entityName, where),
      this.repository.contarTodos(this.entityName, { ...where, status: {{EntityName}}Status.ACTIVE }),
      this.repository.contarTodos(this.entityName, { ...where, status: {{EntityName}}Status.INACTIVE }),
    ]);

    return {
      data: { total, ativos, inativos },
    };
  }
}
```

---

### 3. Controller Template

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '@prisma/client';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleByMethodGuard } from 'src/shared/auth/guards/role-by-method.guard';
import { RoleByMethod } from 'src/shared/auth/role-by-method.decorator';
import { UniversalController } from 'src/shared/universal';
import { Create{{EntityName}}Dto, {{EntityName}}Status } from './dto/create-{{domain}}.dto';
import { Update{{EntityName}}Dto } from './dto/update-{{domain}}.dto';
import { Administrator{{EntityName}}Service } from './administrator-{{domain}}.service';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════

@ApiTags('admin/{{domains}}')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({
  GET: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  POST: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  PATCH: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  DELETE: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
})
@Controller('admin/{{domains}}')
export class Administrator{{EntityName}}Controller extends UniversalController<
  Create{{EntityName}}Dto,
  Update{{EntityName}}Dto,
  Administrator{{EntityName}}Service
> {
  constructor(service: Administrator{{EntityName}}Service) {
    super(service);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ENDPOINTS CUSTOMIZADOS (devem vir ANTES de /:id)
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas do módulo' })
  obterEstatisticas() {
    return this.service.obterResumoEstatisticas();
  }

  @Get('by-code')
  @ApiOperation({ summary: 'Busca por código único' })
  @ApiQuery({ name: 'code', required: true, description: 'Código do registro' })
  buscarPorCodigo(@Query('code') code: string) {
    if (!code?.trim()) {
      throw new BadRequestException('O parâmetro code é obrigatório');
    }
    return this.service.buscarPorCodigo(code);
  }

  @Get('by-status')
  @ApiOperation({ summary: 'Busca por status' })
  @ApiQuery({ name: 'status', required: true, enum: {{EntityName}}Status })
  buscarPorStatus(@Query('status') status: {{EntityName}}Status) {
    if (!Object.values({{EntityName}}Status).includes(status)) {
      throw new BadRequestException(
        `Status inválido. Use: ${Object.values({{EntityName}}Status).join(', ')}`,
      );
    }
    return this.service.buscarPorStatus(status);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ROTAS HERDADAS DO UniversalController:
  // GET /           → buscarComPaginacao
  // GET /all       → buscarTodos
  // GET /:id       → buscarPorId
  // POST /         → criar
  // PATCH /:id     → atualizar
  // DELETE /:id    → desativar
  // POST /:id/restore → reativar
  // ═══════════════════════════════════════════════════════════════════════════════
}
```

---

### 4. Module Template

```typescript
import { Module } from '@nestjs/common';
import { UniversalModule } from 'src/shared/universal';
import { NotificationModule } from 'src/modules/infrastructure/notifications/notification.module';
import { Administrator{{EntityName}}Service } from './administrator-{{domain}}.service';
import { Administrator{{EntityName}}Controller } from './administrator-{{domain}}.controller';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [
    UniversalModule,
    // NotificationModule, // Descomentar se usar notificações
  ],
  controllers: [Administrator{{EntityName}}Controller],
  providers: [Administrator{{EntityName}}Service],
  exports: [Administrator{{EntityName}}Service],
})
export class Administrator{{EntityName}}Module {}
```

---

## 🔄 Algoritmo de Geração

```
┌─────────────────────────────────────────────────────────────────┐
│                    INPUT: Especificação                          │
│                                                                  │
│  domain: products │
│  entity: Product                                                 │
│  fields: [name, price, sku, status] │
│  features: [CRUD, stats, by-code]                              │
└─────────────────────────────────────────────────────────────────┘
 ↓
┌─────────────────────────────────────────────────────────────────┐
│1. PARSEAR SPEC │
│     - Extrair domain, entity, fields                              │
│     - Mapear tipos (string → @IsString()) │
│     - Identificar enums                                          │
│     - Identificar relacionamentos                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. GERAR DTOs                                                   │
│     - Create{{EntityName}}Dto com validações                     │
│     - Update{{EntityName}}Dto (PartialType) │
│     - Enum se necessário                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. GERAR SERVICE │
│     - extend UniversalService                                    │
│     - createEntityConfig(domain)                                 │
│     - Hooks por features │
│     - Métodos customizados                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. GERAR CONTROLLER                                             │
│     - extend UniversalController                                │
│     - @RoleByMethod com roles corretas                          │
│     - Endpoints customizados                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  5. GERAR MODULE                                                 │
│     - imports: [UniversalModule]                                 │
│     - controllers, providers, exports                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  6. REGISTRAR                                                    │
│     - entities.config.ts (domain → Entity)                       │
│     - casl-role-permissions.config.ts (permissions)             │
│     - app.module.ts (import) │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Checklist de Geração

### DTOs
- [ ] Todos os campos com `@ApiProperty` / `@ApiPropertyOptional`
- [ ] Validadores corretos (`@IsString`, `@IsNumber`, etc.)
- [ ] Constraints (`@MinLength`, `@Max`, etc.)
- [ ] Enum exportado
- [ ] NÃO incluir campos de sistema (id, companyId, timestamps)

### Service
- [ ] Estende `UniversalService`
- [ ] `createEntityConfig(domain)`
- [ ] `Scope.REQUEST`
- [ ] Hooks implementados (`antesDeCriar`, etc.)
- [ ] Validações de negócio
- [ ] Métodos customizados

### Controller
- [ ] Estende `UniversalController`
- [ ] `@ApiTags`, `@ApiBearerAuth`
- [ ] `@UseGuards(AuthGuard, RoleByMethodGuard)`
- [ ] `@RoleByMethod` com roles corretas
- [ ] `@Controller('admin/...')` ou `@Controller('user/...')`
- [ ] Endpoints customizados ANTES de `/:id`

### Module
- [ ] Importa `UniversalModule`
- [ ] Registra controller e service
- [ ] Exporta service

### Registro
- [ ] Adicionado em `entities.config.ts`
- [ ] Adicionado em `casl-role-permissions.config.ts`
- [ ] Importado em `app.module.ts`

---

## ⚡ Gerar Módulo Rápido

Para gerar um módulo, basta fornecer:

```yaml
domain: products
entity: Product
fields:
  - name: string (required)
  - price: decimal (required)
  - sku: string (unique)
  - status: enum [DRAFT, ACTIVE, INACTIVE]
features:
  - CRUD
  - stats
  - by-code
layers:
  - administrator
```

O sistema gerará automaticamente todos os arquivos necessários.