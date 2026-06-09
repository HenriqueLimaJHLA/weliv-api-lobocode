# 💾 Database Generator v2.0

**Guia completo para geração de schemas Prisma com melhores práticas.**

---

## 🎯 Princípios

1. **Sempre incluir campos obrigatórios** (companyId, timestamps, soft delete)
2. **Índices otimizados** para queries frequentes
3. **Nomenclatura consistente** (snake_case plural para tabelas)
4. **Relacionamentos bem definidos** (onDelete, onUpdate)
5. **Decimal para valores monetários** (nunca Float)
6. **UUID para IDs** (serial é proibido)

---

## 📋 Template de Schema

```prisma
// ═══════════════════════════════════════════════════════════════════════════════
// {{EntityName}} - {{description}}
// ═══════════════════════════════════════════════════════════════════════════════

model {{EntityName}} {
  // ═══════════════════════════════════════════════════════════════════════════
  // CAMPOS DA ENTIDADE
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Identificador
  id String @id @default(cuid())

  // Campos específicos...
  name String
  code String? @unique
  price Decimal @db.Decimal(10, 2)
  status String @default("DRAFT")
  
  // Campos texto longo
  description String? @db.Text
  
  // Campos JSON (dados estruturados)
  metadata Json?
  
  // Campos booleanos
  isActive Boolean @default(true)
  
  // Campos numéricos
  sortOrder Int @default(0)
  
  // Campos de data
  dueDate DateTime?
  completedAt DateTime?

  // ═══════════════════════════════════════════════════════════════════════════
  // RELACIONAMENTOS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Many-to-One (N:1) - Many entidades apontam para One
  categoryId String
  category Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  
  // Many-to-One reverso (User como responsável)
  userId String?
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  // ═══════════════════════════════════════════════════════════════════════════
  // CAMPOS OBRIGATÓRIOS (MULTI-TENANCY)
  // ═══════════════════════════════════════════════════════════════════════════
  
  companyId String
  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)

  // ═══════════════════════════════════════════════════════════════════════════
  // CAMPOS OBRIGATÓRIOS (AUDITORIA)
  // ═══════════════════════════════════════════════════════════════════════════
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // ═══════════════════════════════════════════════════════════════════════════
  // CAMPOS OBRIGATÓRIOS (SOFT DELETE)
  // ═══════════════════════════════════════════════════════════════════════════
  
  deletedAt DateTime?

  // ═══════════════════════════════════════════════════════════════════════════
  // ÍNDICES
  // ═══════════════════════════════════════════════════════════════════════════
  
  @@index([companyId])
  @@index([deletedAt])
  @@index([status])
  @@index([createdAt])
  @@index([categoryId])
  @@index([userId])
  
  // Para campos únicos (garante performance)
  @@index([code], unique: true, where: "code IS NOT NULL")

  // ═══════════════════════════════════════════════════════════════════════════
  // MAPEAMENTO
  // ═══════════════════════════════════════════════════════════════════════════
  
  @@map("{{plural_snake_case}}")
}
```

---

## 🔧 Mapeamento de Tipos

### Tipos YAML → Prisma

| YAML Type | Prisma Type | Notas |
|-----------|------------|-------|
| `string` | `String` | Default |
| `text` | `String` @db.Text | Texto longo |
| `int` | `Int` | Números inteiros |
| `decimal` | `Decimal` @db.Decimal(10,2) | Valores monetários |
| `decimal(p,s)` | `Decimal` @db.Decimal(p,s) | Precisão customizada |
| `boolean` | `Boolean` | true/false |
| `datetime` | `DateTime` | Data e hora |
| `date` | `DateTime` | Apenas data |
| `uuid` | `String` | UUID (ou @db.Uuid) |
| `email` | `String` | Email |
| `phone` | `String` | Telefone |
| `cpf` | `String` | CPF |
| `cnpj` | `String` | CNPJ |
| `enum` | `String` | Valores pré-definidos |
| `json` | `Json` | Dados estruturados |
| `array` | `String[]` | Array de strings |

### Constraints

| Constraint | Prisma | Uso |
|------------|--------|-----|
| `required` | Sem `?` | Campo obrigatório |
| `optional` | `?` | Campo opcional |
| `unique` | `@unique` | Valor único |
| `default: value` | `@default(value)` | Valor padrão |
| `primary key` | `@id` | Chave primária |

---

## 🔗 Relacionamentos

### Many-to-One (N:1)

**Uso:** Quando múltiplos registros apontam para um único registro.

```yaml
relationships:
  - type: many-to-one
    entity: Category
    required: true
    onDelete: Restrict  # ou Cascade, SetNull
```

**Prisma:**
```prisma
categoryId String
category Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)

@@index([categoryId])
```

### One-to-Many (1:N)

**Uso:** Quando um registro tem múltiplos filhos.

```yaml
relationships:
  - type: one-to-many
    entity: ProductImage
```

**Prisma (no pai):**
```prisma
// Não precisa adicionar nada no modelo pai
```

**Prisma (no filho - ProductImage):**
```prisma
productId String
product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

@@index([productId])
```

### Many-to-Many (N:N)

**Uso:** Quando múltiplos registros podem ter múltiplos relacionamentos.

```yaml
relationships:
  - type: many-to-many
    entity: Tag
```

**Prisma:**
```prisma
// Gera automaticamente uma tabela de junção
// products_tags (order matters)
// Ex: products_tags[] = Tag[]
```

### onDelete Options

| Opção | Quando usar |
|-------|-------------|
| `Cascade` | Filho deve ser excluído junto (ex: User + Sessions) |
| `Restrict` | Bloqueia exclusão se houver filhos (ex: Category + Products) |
| `SetNull` | Define FK como null (ex: Product.userId) |
| `NoAction` | Similar a Restrict mas não é verificado imediatamente |

---

## 📋 Estrutura Obrigatória

Todo schema **DEVE** conter:

```prisma
model {{EntityName}} {
  //1. ID primária
  id String @id @default(cuid())

  // 2. Campos específicos do domínio
  name String
  // ...

  // 3. Relacionamentos (se houver)
  categoryId String
  category Category @relation(...)
  // ...

  // 4. Multi-tenancy (OBRIGATÓRIO)
  companyId String
  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)

  // 5. Auditoria (OBRIGATÓRIO)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 6. Soft delete (OBRIGATÓRIO)
  deletedAt DateTime?

  // 7. Índices (OBRIGATÓRIO)
  @@index([companyId])
  @@index([deletedAt])
  @@index([status])
  @@index([createdAt])

  // 8. Mapeamento (OBRIGATÓRIO)
  @@map("plural_snake_case")
}
```

---

## 🚀 Comandos Prisma

```bash
# Criar migration
npx prisma migrate dev --name "add-{{domain}}"

# Resetar banco (DEV ONLY)
npx prisma migrate reset

# Gerar client
npx prisma generate

# Verificar migrations pendentes
npx prisma migrate status

# Deploy migrations (produção)
npx prisma migrate deploy

# Validar schema
npx prisma validate

# Format schema
npx prisma format

# Studio (GUI)
npx prisma studio
```

---

## 🔄 Algoritmo de Geração

```
┌─────────────────────────────────────────────────────────────────┐
│                    INPUT: Especificação                          │
│                                                                  │
│  domain: products │
│  entity: Product                                                 │
│  fields: [name, price, sku, status]                             │
│  relationships: [Category (many-to-one)] │
└─────────────────────────────────────────────────────────────────┘
 ↓
┌─────────────────────────────────────────────────────────────────┐
│ 1. PARSEAR SPEC │
│     - domain → plural_snake_case (products)                    │
│     - entity → PascalCase (Product)                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. GERAR ID │
│     id String @id @default(cuid())                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. GERAR CAMPOS │
│     - Para cada field: mapear tipo Prisma                     │
│     - Aplicar constraints (unique, default, etc.)              │
│     - Adicionar @db.* se necessário (Text, Decimal, etc.)      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. GERAR RELACIONAMENTOS                                       │
│     - many-to-one: adicionar FK + @relation                   │
│     - one-to-many: referenciar no filho │
│     - many-to-many: gerar implicitamente │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  5. ADICIONAR CAMPOS OBRIGATÓRIOS                              │
│     - companyId + Company @relation                            │
│     - createdAt + @default(now())                            │
│     - updatedAt + @updatedAt                                 │
│     - deletedAt? (soft delete)                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  6. GERAR ÍNDICES                                              │
│     - @@index([companyId])                                     │
│     - @@index([deletedAt])                                    │
│     - @@index([status])                                       │
│     - @@index([createdAt])                                    │
│     - @@index([FKs])                                          │
│     - @@index([unique fields], unique: true)                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  7. GERAR @@map │
│     @@map("plural_snake_case")                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  8. GERAR MIGRATION                                            │
│     npx prisma migrate dev --name "add-{{domain}}"             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Checklist de Schema

### Obrigatório
- [ ] `@id @default(cuid())`
- [ ] `companyId` + `Company @relation`
- [ ] `createdAt` + `@default(now())`
- [ ] `updatedAt` + `@updatedAt`
- [ ] `deletedAt DateTime?` (soft delete)
- [ ] `@@index([companyId])`
- [ ] `@@index([deletedAt])`
- [ ] `@@map("plural_snake_case")`

### Campos
- [ ] Decimal para valores monetários (nunca Float/Double)
- [ ] @db.Text para textos longos
- [ ] @db.Decimal(p,s) para precisão específica
- [ ] Enum como String com @default

### Relacionamentos
- [ ] FK com tipo correto (String para cuuid)
- [ ] @relation com onDelete definido
- [ ] @@index nas FKs

### Índices
- [ ] Índice em companyId (sempre)
- [ ] Índice em deletedAt (sempre)
- [ ] Índice em campos de busca (status, code, name)
- [ ] Índice único para campos unique
- [ ] Índice em FKs

---

## ⚠️ Erros Comuns

### 1. Float para valores monetários
```prisma
// ❌ ERRADO
price Float

// ✅ CORRETO
price Decimal @db.Decimal(10, 2)
```

### 2. Esquecer multi-tenancy
```prisma
// ❌ ERRADO
model Product {
  id String @id @default(cuid())
  name String
}

// ✅ CORRETO
model Product {
  id String @id @default(cuid())
  name String
  companyId String
  company Company @relation(fields: [companyId], references: [id])
  @@index([companyId])
}
```

### 3. Nome de tabela no singular
```prisma
// ❌ ERRADO
@@map("product")

// ✅ CORRETO
@@map("products")
```

### 4. Índices duplicados
```prisma
// ❌ ERRADO
@@index([companyId])
@@index([companyId])
@@index([companyId])

// ✅ CORRETO
@@index([companyId])
```

### 5. onDelete não definido
```prisma
// ❌ ERRADO
categoryId String
category Category @relation(fields: [categoryId], references: [id])

// ✅ CORRETO
categoryId String
category Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)
```

---

## 🔍 Exemplo Completo

### Input:
```yaml
domain: bookings
entity: Booking
fields:
  - name: customerName
    type: string
    required: true
  - name: date
    type: datetime
    required: true
  - name: status
    type: enum
    values: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
    default: PENDING
  - name: totalAmount
    type: decimal
    required: true
  - name: notes
    type: text
    required: false
relationships:
  - type: many-to-one
    entity: Service
    required: true
  - type: many-to-one
    entity: Customer
    required: true
```

### Output: `prisma/schema/bookings.prisma`

```prisma
// ═══════════════════════════════════════════════════════════════════════════════
// Booking - Agendamentos de serviços
// ═══════════════════════════════════════════════════════════════════════════════

model Booking {
  // Identificador
  id String @id @default(cuid())

  // Campos específicos
  customerName String
  date DateTime
  status String @default("PENDING")
  totalAmount Decimal @db.Decimal(10, 2)
  notes String? @db.Text

  // Relacionamentos
  serviceId String
  service Service @relation(fields: [serviceId], references: [id], onDelete: Restrict)
  
  customerId String
  customer Customer @relation(fields: [customerId], references: [id], onDelete: Restrict)

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
  @@index([status])
  @@index([date])
  @@index([serviceId])
  @@index([customerId])
  @@index([createdAt])

  @@map("bookings")
}
```