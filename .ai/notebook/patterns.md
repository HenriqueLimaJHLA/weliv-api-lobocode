# 🎯 Patterns Descobertos - LOBO CODE

**O que são patterns?**
Soluções testadas e aprovadas para problemas recorrentes. Usar quando identificado o contexto apropriado.

**Como adicionar:** Ver `.ai/notebook/INDEX.md` para formato.

---

## Patterns do Projeto

[ESPAÇO RESERVADO - patterns serão adicionados conforme descobertas]

---

## Patterns Externos (Boas Práticas)

### Repository Pattern com Generic

**Contexto:** Quando precisa de operações CRUD genéricas
**Solução:** Usar `UniversalRepository` com entityName dinâmico
**Exemplo:**
```typescript
// src/shared/universal/repositories/universal.repository.ts
async buscarMuitos(entityName: string, where: any, orderBy?: any, skip?: number, take?: number) {
  return this.prisma[entityName].findMany({ where, orderBy, skip, take });
}
```

### Hooks Pattern

**Contexto:** Quando precisa de lógica customizada no ciclo de vida CRUD
**Solução:** Sobrescrever hooks do UniversalService
**Exemplo:**
```typescript
// Service estende UniversalService
protected async antesDeCriar(data: CreateDto): Promise<void> {
  // Validações antes de criar
  const user = this.obterUsuarioLogado();
  if (!user?.companyId) {
    throw new ForbiddenError('Empresa não disponível');
  }
}
```

### Multi-Tenancy via Request Scope

**Contexto:** Quando precisa do companyId em qualquer service
**Solução:** Obter do contexto da requisição (Request Scope)
**Exemplo:**
```typescript
@Injectable({ scope: Scope.REQUEST })
export class MyService extends UniversalService {
  protected obterCompanyId(): string | null {
    const user = this.obterUsuarioLogado();
    return user?.companyId;
  }
}
```

### Soft Delete Pattern

**Contexto:** Quando entidade pode ser recuperada
**Solução:** Usar deletedAt DateTime? ao invés de DELETE
**Exemplo:**
```typescript
// Repository
async desativar(entityName: string, where: any) {
  return this.prisma[entityName].update({
    where,
    data: { deletedAt: new Date() }
  });
}
```

### Validation via DTO

**Contexto:** Quando precisa validar entrada de dados
**Solução:** Usar class-validator com decorators
**Exemplo:**
```typescript
export class CreateProductDto {
  @ApiProperty({ description: 'Nome', example: 'Produto X' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
}
```

---

## Guidelines para Adicionar

1. Nome descritivo e único
2. Contexto claro (quando usar)
3. Exemplo funcional com código real
4. Referência ao arquivo fonte
5. Data de adição