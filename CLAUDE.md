# 🤖 AI Development Rules - LOBO CODE AI SOFTWARE FACTORY v3.0

**Regras obrigatórias para desenvolvimento neste projeto.**

---

## 📚 Contexto Obrigatório

Antes de qualquer tarefa, leia na ordem:

1. **`.ai/execution-skill.md`** → Protocolo de execução (OBRIGATÓRIO)
2. **`.ai/README.md`** → Visão geral da fábrica
3. **`.ai/audit.md`** → Padrões do projeto (fonte de verdade)
4. **`.ai/conventions.md`** → Convenções de código
5. **`.ai/module-generator.md`** → Como gerar módulos
6. **`.ai/database-generator.md`** → Como gerar schemas
7. **`.ai/notebook/`** → Conhecimento acumulado (verificar antes de iniciar)

---

## ⚡ Ciclo de Execução (Obrigatório)

Para TODAS as tarefas de desenvolvimento, seguir:

```
BRIEFING → RECON → PLAN → EXECUTE → VERIFY → DEBRIEF
```

**Não sabe como?** → Leia `.ai/execution-skill.md`

**Encontrou algo novo?** → Documente em `.ai/notebook/`

**Convenção não clara?** → Verifique em `.ai/conventions.md`

---

## 🎯 Princípios Fundamentais

### 0. REGRA DE OURO: Copiar Template (NÃO CRIAR DO ZERO)
```
╔═══════════════════════════════════════════════════════════════════════════╗
║  NUNCA criar código do zero. SEMPRE copiar estrutura do template.       ║
║  src/modules/template/ → copiar → adaptar lógica de negócio            ║
╚═══════════════════════════════════════════════════════════════════════════╝
```
**Como fazer:** Leia `src/modules/template/COMO-USAR.md`

### 1. Consistência > Criatividade
- Sempre seguir padrões existentes
- Não criar novas arquiteturas
- Priorizar reutilização

### 2. Motor Universal (NÃO MODIFICAR)
- `src/shared/universal/` é o motor do sistema
- Todos os módulos estendem `UniversalService` e `UniversalController`
- **Não alterar** arquivos em `src/shared/universal/`

### 3. Multi-Tenancy Sempre
- Todo registro pertence a uma `company`
- Sempre filtrar por `companyId`
- companyId vem do contexto da requisição (TenantInterceptor)

### 4. Soft Delete Sempre
- Nunca usar DELETE hard
- Usar `deletedAt` para marcar exclusão
- Queries devem filtrar `deletedAt: null`

---

## 🚀 Como Gerar Módulo

### Entrada (Texto Livre ou YAML)

```
"Gere módulo Tasks com:
- title (string, required)
- description (text)
- priority (enum: LOW, MEDIUM, HIGH, URGENT)
- status (enum: TODO, IN_PROGRESS, DONE)
- dueDate (datetime, optional)
- Features: CRUD, stats, by-status
- Layers: user, administrator
"
```

### Saída Esperada

```
src/modules/tasks/
├── user/
│   ├── user-task.module.ts
│   ├── user-task.service.ts
│   ├── user-task.controller.ts
│   └── dto/
│       ├── create-task.dto.ts
│       └── update-task.dto.ts
└── administrator/
    ├── administrator-task.module.ts
    ├── administrator-task.service.ts
    ├── administrator-task.controller.ts
    └── dto/
        ├── create-task.dto.ts
        └── update-task.dts.ts

prisma/schema/tasks.prisma

Registros atualizados:
- src/shared/config/entities.config.ts
- src/shared/config/casl-role-permissions.config.ts
- src/app.module.ts
```

### Checklist de Geração

- [ ] Schema Prisma em `prisma/schema/<domain>.prisma`
- [ ] DTOs com validações (class-validator + Swagger)
- [ ] Service estende `UniversalService`
- [ ] Controller estende `UniversalController`
- [ ] Roles definidas (`@RoleByMethod`)
- [ ] Registrado em `entities.config.ts`
- [ ] Permissões CASL em `casl-role-permissions.config.ts`
- [ ] Importado em `app.module.ts`
- [ ] Migration gerada

---

## 📋 Estrutura de Módulos

```
src/modules/<domain>/
├── user/                    # Camada USER (leitura)
│   ├── user-<domain>.module.ts
│   ├── user-<domain>.service.ts
│   ├── user-<domain>.controller.ts
│   └── dto/
│       ├── create-<domain>.dto.ts
│       └── update-<domain>.dto.ts
└── administrator/           # Camada ADMIN (completo)
    ├── administrator-<domain>.module.ts
    ├── administrator-<domain>.service.ts
    ├── administrator-<domain>.controller.ts
    └── dto/
        ├── create-<domain>.dto.ts
        └── update-<domain>.dto.ts
```

### Camadas Disponíveis

| Camada | Roles | Uso |
|--------|-------|-----|
| `user` | USER, ADMIN, SYSTEM_ADMIN | Dados do usuário, leitura |
| `administrator` | ADMIN, SYSTEM_ADMIN | Gestão completa |

### Modos de Camada

| Modo | Descrição | Uso |
|------|-----------|-----|
| `minimal` | CRUD puro | Configurações, dados simples |
| `standard` | CRUD + hooks + custom endpoints | Maioria dos módulos |
| `complex` | STANDARD + sub-serviços | Módulos com lógica complexa |

---

## 💾 Schema Prisma

### Campos Obrigatórios

```prisma
model {{EntityName}} {
  // ID
  id String @id @default(cuid())

  // Campos específicos...

  // Multi-tenancy (OBRIGATÓRIO)
  companyId String
  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)

  // Auditoria (OBRIGATÓRIO)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Soft delete (OBRIGATÓRIO)
  deletedAt DateTime?

  // Índices (OBRIGATÓRIO)
  @@index([companyId])
  @@index([deletedAt])
  @@index([status])
  @@index([createdAt])

  @@map("plural_snake_case")
}
```

### Mapeamento de Tipos

| YAML | Prisma | Uso |
|------|--------|-----|
| `string` | `String` | Textos |
| `text` | `String` @db.Text | Textos longos |
| `int` | `Int` | Números inteiros |
| `decimal` | `Decimal` @db.Decimal(10,2) | Dinheiro |
| `boolean` | `Boolean` | true/false |
| `datetime` | `DateTime` | Data/hora |
| `enum` | `String` @default | Valores fixos |
| `json` | `Json` | Dados estruturados |

---

## 🛡️ Segurança

### Sempre Fazer
- ✅ Validar `companyId` em todas operações
- ✅ Usar `TenantInterceptor`
- ✅ Usar `CaslInterceptor`
- ✅ Filtrar `deletedAt: null` em queries
- ✅ Validar permissões CASL

### Nunca Fazer
- ❌ Criar endpoint sem autenticação
- ❌ Ignorar `companyId`
- ❌ Fazer query sem filtrar `deletedAt`
- ❌ Expor dados de outras empresas
- ❌ Modificar `UniversalModule`

---

## 🔄 Fluxo de Desenvolvimento

```
1. RECEBER especificação (texto ou YAML)
   ↓
2. PARSEAR domínio, entity, fields, features
   ↓
3. GERAR schema Prisma (prisma/schema/<domain>.prisma)
   ↓
4. GERAR DTOs (create-<domain>.dto.ts, update-<domain>.dto.ts)
   ↓
5. GERAR Service (extend UniversalService + hooks)
   ↓
6. GERAR Controller (extend UniversalController + roles)
   ↓
7. GERAR Module (imports + controllers + providers)
   ↓
8. REGISTRAR (entities.config + CASL + app.module)
   ↓
9. GERAR migration (npx prisma migrate dev)
   ↓
10. VALIDAR endpoints
```

---

## 📝 Comandos Úteis

```bash
# Gerar módulo completo
npm run generate:module -- --domain products

# Gerar migration
npx prisma migrate dev --name "add-products"

# Resetar banco (DEV)
npx prisma migrate reset

# Gerar client
npx prisma generate

# Ver status
npx prisma migrate status
```

---

## ❓ Em Caso de Dúvida

**Pergunte ao usuário** ao invés de assumir.

Exemplos:
- "O campo X deve ser único globalmente ou por empresa?"
- "Qual role deve acessar o endpoint Y?"
- "Precisa de validação customizada no campo Z?"

---

## 📓 Persistência de Conhecimento

Quando descobrir algo novo durante uma tarefa:

1. **Pattern descoberto?** → `.ai/notebook/patterns.md`
2. **Armadilha encontrada?** → `.ai/notebook/gotchas.md`
3. **Nota sobre domínio?** → `.ai/notebook/[tema]-notes.md`
4. **Atualizar INDEX** → `.ai/notebook/INDEX.md`

**Regra:** Conhecimento confirmado (não hipóteses) que economizaria tempo no futuro.

---

## 🔗 Referências Rápidas

| Tarefa | Referência |
|--------|-----------|
| Como executar tarefas | `.ai/execution-skill.md` |
| Como copiar template | `src/modules/template/COMO-USAR.md` |
| Convenções de código | `.ai/conventions.md` |
| Como gerar módulos | `.ai/module-generator.md` |
| Como gerar banco | `.ai/database-generator.md` |
| Patterns do projeto | `.ai/notebook/patterns.md` |
| Armadilhas conhecidas | `.ai/notebook/gotchas.md` |

---

**Versão:** 3.0  
**Atualizado:** 2026-06-09  
**Manutenção:** LOBO CODE AI SOFTWARE FACTORY