# ⚠️ Armadilhas e Como Evitá-las - LOBO CODE

**O que são gotchas?**
Erros comuns, armadilhas e pegadinhas que já aconteceram. Documentadas para não repetir.

**Como adicionar:** Ver `.ai/notebook/INDEX.md` para formato.

---

## Gotchas do Projeto

[ESPAÇO RESERVADO - gotchas serão adicionadas conforme descobertas]

---

## Gotchas Comuns NestJS

### Não fazer commit de .env

**Problema:** Credenciais expostas no repositório
**Consequência:** Segurança comprometida, chaves vazadas
**Solução:** NUNCA commitar .env. Usar `.env.example` com variáveis vazias

**Prevenção:**
```bash
# .gitignore já deve conter
.env
.env.*
!.env.example
```

---

### Circular Dependency

**Problema:** ModuleA importa ModuleB e ModuleB importa ModuleA
**Consequência:** Runtime error, aplicação não inicia
**Solução:** Usar `forwardRef()` apenas quando inevitável, ou reorganizar módulos

**Detecção:**
```bash
grep -r "from.*'\.\." src/modules/ | sort | uniq
```

**Exemplo de solução:**
```typescript
// ❌ ERRADO
@Module({ imports: [OtherModule] })
export class ModuleA {}

@Module({ imports: [ModuleA] })  
export class ModuleB {}

// ✅ CORRETO - reorganizar dependência
@Module({ exports: [ServiceA] })
export class ModuleA {}

@Module({ imports: [ModuleA] })
export class ModuleB {}
```

---

### ID sequencial em URLs públicas

**Problema:** Usar AUTO_INCREMENT como ID exposto
**Consequência:** Enumeração de recursos, segurança comprometida
**Solução:** Usar UUID `@id @default(cuid())`

**Prisma correto:**
```prisma
model Product {
  id String @id @default(cuid())  // ✅ UUID
  // ...
}
```

---

### Validação em DTO sem class-validator

**Problema:** Dados inválidos chegam ao service
**Consequência:** Erros em tempo de execução, comportamento inesperado
**Solução:** Usar class-validator + class-transformer + ValidationPipe

**Setup correto:**
```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

---

### Escapar companyId

**Problema:** Filtrar por companyId esquecido em queries
**Consequência:** Vazamento de dados entre tenants
**Solução:** companyId SEMPRE presente, verificado em TODO service

**Exemplo de proteção:**
```typescript
protected async antesDeCriar(data: CreateDto): Promise<void> {
  const user = this.obterUsuarioLogado();
  if (!user?.companyId) {
    throw new ForbiddenError('Empresa não disponível');
  }
  (data as any).companyId = user.companyId;
}
```

---

### Soft Delete não filtrado

**Problema:** Query sem filtrar `deletedAt: null`
**Consequência:** Retornar registros "excluídos"
**Solução:** SEMPRE incluir deletedAt nos WHERE clauses

**Exemplo:**
```typescript
// ❌ ERRADO
const products = await this.repository.buscarMuitos('Product', {});

// ✅ CORRETO
const products = await this.repository.buscarMuitos('Product', { deletedAt: null });
```

---

### Decimal para dinheiro

**Problema:** Usar Float/Double para valores monetários
**Consequência:** Erros de arredondamento (0.1 + 0.2 = 0.30000000000000004)
**Solução:** Usar Decimal com precisão fixa

**Prisma correto:**
```prisma
model Product {
  price Decimal @db.Decimal(10, 2)  // ✅ 10 dígitos, 2 casas decimais
}
```

---

## Guidelines para Adicionar

1. Nome descritivo do problema
2. Contexto (quando acontece)
3. Consequência clara (impacto)
4. Solução prática (código se possível)
5. Como detectar/prevenir
6. Data de adição