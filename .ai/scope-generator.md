# 🎯 SCOPE GENERATOR v3.0

**Gerador de Escopo em2 Estágios: Documento → Análise → Código**

---

## 🔄 Fluxo em2 Estágios

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        ESTÁGIO 1: ESCOPO (DOCUMENTO)                         ║
║                                                                 ║
║  🎯 Perguntas → 📝 Documento de Regra de Negócio → 👀 Análise                ║
║ ║
╚══════════════════════════════════════════════════════════════════════════════╝
                                    ↓
                                    ✓ (Escopo aprovado)
                                    ↓
╔══════════════════════════════════════════════════════════════════════════════╗
║                        ESTÁGIO 2: GERADOR (CÓDIGO)                          ║
║                                                                              ║
║  📝 Escopo validado → ⚙️ Gerar Código → ✅ Módulo Production-Ready            ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 📋 ESTÁGIO 1: DOCUMENTO DE ESCOPO

### O que é gerado

```
📄 specs/
├── [domain]-escopo.md                   ← Entidade principal
└── subs/
    ├── [domain]-[sub1]-sub.md            ← Sub 1
    ├── [domain]-[sub2]-sub.md            ← Sub 2
    └── [domain]-[subN]-sub.md            ← Sub N (quantos precisar)
```

> **Uma sub-entidade = Um arquivo.** Se tiver 2 ou 20 subs, cada um tem seu arquivo separado em `subs/`.

### Documento Principal: `[domain]-escopo.md`

```markdown
# 📋 ESCOPO: [Nome do Domínio]

**Versão:** 1.0  
**Data:** YYYY-MM-DD  
**Status:** RASCUNHO | EM_ANALISE | APROVADO | EM_IMPLANTACAO | PRODUCAO

---

## 1. IDENTIFICAÇÃO

| Campo | Valor |
|-------|-------|
| Domínio | [ex: appointments] |
| Entidade | [ex: Appointment] |
| Descrição | [descrição em 1-2 frases] |
| Módulo pai | [se existir] |
| Dependências | [lista de módulos que depende] |

---

## 2. ENTIDADE PRINCIPAL

### 2.1 Campos

| Campo | Tipo | Obrigatório | Padrão | Descrição | Validações |
|-------|------|-------------|--------|-----------|------------|
| id | uuid | sim | auto | ID único | - |
| date | datetime | sim | - | Data/hora | deve ser futura |
| status | enum | sim | PENDING | Status | valores definidos |
| ... | ... | ... | ... | ... | ... |

### 2.2 Enum(s)

```typescript
// Status
enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED', // Agendado
  CONFIRMED = 'CONFIRMED',    // Confirmado
  IN_PROGRESS = 'IN_PROGRESS', // Em atendimento
  COMPLETED = 'COMPLETED',    // Finalizado
  CANCELLED = 'CANCELLED',    // Cancelado
  NO_SHOW = 'NO_SHOW',        // Não compareceu
}
```

### 2.3 Relacionamentos

| Entidade | Tipo | Obrigatório | onDelete | Descrição |
|----------|------|-------------|----------|-----------|
| Company | many-to-one | sim | Cascade | Empresa |
| Patient | many-to-one | sim | Restrict | Paciente |
| Doctor | many-to-one | sim | Restrict | Médico |
| Specialty | many-to-one | não | SetNull | Especialidade |

---

## 3. REGRAS DE NEGÓCIO

### 3.1 Validações

| # | Regra | Descrição | Prioridade |
|---|-------|-----------|------------|
| V1 | Data futura | A data deve ser futura | ALTA |
| V2 | Horário disponível | Não pode conflituar com outro agendamento do mesmo médico | ALTA |
| V3 | Duração mínima | Mínimo 15 minutos | MÉDIA |
| V4 | Paciente ativo | Paciente deve ter status ACTIVE | ALTA |

### 3.2 Restrições

| # | Regra | Descrição | Tratamento |
|---|-------|-----------|------------|
| R1 | Não cancelar se em andamento | Não pode cancelar consulta já iniciada | Bloquear ação |
| R2 | Não excluir com filhos | Se tiver relatório, não pode excluir | Bloquear exclusão |
| R3 | Tempo de cancelamento | Só pode cancelar até 24h antes | Alertar usuário |

### 3.3 Automatizações

| # | Regra | Ação | Quando |
|---|-------|------|--------|
| A1 | Código automático | Gerar código sequencial | Ao criar |
| A2 | Status automático | Mudar para COMPLETED | Ao finalizar |
| A3 | NO_SHOW automático | Marcar como NO_SHOW | Se passar30min da hora |

### 3.4 Campos Calculados

| Campo | Cálculo | Exemplo |
|-------|---------|---------|
| isOverdue | date< now() && status == SCHEDULED | true |
| daysUntil | diferença em dias | 3 |

---

## 4. FLUXO DE STATUS

```
                    ┌──────────────┐
                    │  SCHEDULED   │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │CONFIRMED │ │CANCELLED │ │ NO_SHOW  │
        └────┬─────┘ └──────────┘ └──────────┘
             │
             ▼
        ┌──────────────┐
        │ IN_PROGRESS  │
        └──────┬───────┘
               │
               ▼
        ┌──────────┐
        │ COMPLETED │
        └──────────┘
```

---

## 5. FUNCIONALIDADES

### 5.1 CRUD

| Operação | User | Admin | Descrição |
|---------|------|-------|-----------|
| Criar | ✅ | ✅ | Criar novo agendamento |
| Ler | ✅ (próprio) | ✅ (todos) | Ver agendamento |
| Atualizar | ❌ | ✅ | Alterar dados |
| Excluir | ❌ | ✅ | Soft delete |

### 5.2 Endpoints Customizados

| Endpoint | Descrição | Roles |
|----------|-----------|-------|
| GET /by-status | Busca por status | ADMIN |
| GET /by-date | Busca por data | ADMIN |
| GET /by-doctor | Busca por médico | USER, ADMIN |
| GET /stats | Estatísticas | ADMIN |
| POST /:id/confirm | Confirmar | USER, ADMIN |
| POST /:id/cancel | Cancelar | USER, ADMIN |
| POST /:id/start | Iniciar atendimento | ADMIN |
| POST /:id/complete | Finalizar | ADMIN |

### 5.3 Notificações

| Evento | Destinatário | Canal | Template |
|--------|-------------|-------|----------|
| Criação | Paciente | Email/SMS | appointment_created |
| Confirmação | Paciente | Email/SMS | appointment_confirmed |
| Lembrete | Paciente | Email/SMS | appointment_reminder |
| Cancelamento | Paciente, Médico | Email/SMS | appointment_cancelled |
| NO_SHOW | Admin | Email | appointment_no_show |

---

## 6. MÓDULOS RELACIONADOS

> ⚠️ Estes módulos podem já existir ou precisar ser criados. Cada sub-entidade tem seu arquivo em `subs/`

### 6.1 Módulos Existentes

| Módulo | Status | Uso |
|--------|--------|-----|
| company | ✅ Existente | Multi-tenancy |
| user | ✅ Existente | Paciente/Médico |

### 6.2 Módulos a Criar

| Módulo | Prioridade | Sub-arquivo | Descrição |
|--------|------------|-------------|-----------|
| patients | ALTA | `subs/[domain]-patients-sub.md` | Cadastro de pacientes |
| doctors | ALTA | `subs/[domain]-doctors-sub.md` | Cadastro de médicos |
| specialties | MÉDIA | `subs/[domain]-specialties-sub.md` | Especialidades médicas |
| medical-records | BAIXA | `subs/[domain]-medical-records-sub.md` | Prontuário do paciente |

### 6.3 Diagrama de Dependências

```
                    ┌─────────────┐
                    │   COMPANY    │ ← existente
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌────────────┐
        │ PATIENTS │ │ DOCTORS  │ │SPECIALTIES │ ← a criar
        └────┬─────┘ └────┬─────┘ └────────────┘
             │            │
             └──────┬─────┘
                    │
                    ▼
             ┌──────────────┐
             │ APPOINTMENTS │ ← este escopo
             └──────┬──────┘
                    │
                    ▼
             ┌───────────────┐
             │MEDICAL_RECORDS│ ← a criar (futuro)
             └───────────────┘
```

---

## 7. TELA / UI (Opcional)

### 7.1 Lista

| Campo | Descrição |
|-------|-----------|
| Código | Código do agendamento |
| Paciente | Nome do paciente |
| Médico | Nome do médico |
| Data | Data e hora |
| Status | Badge colorido |
| Ações | Ver, Editar, Cancelar |

### 7.2 Formulário

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Paciente | Select | Sim |
| Médico | Select | Sim |
| Data/Hora | DateTime | Sim |
| Duração | Select | Sim |
| Especialidade | Select | Não |
| Observações | Textarea | Não |

---

## 8. HISTÓRICO DE ALTERAÇÕES

| Versão | Data | Alteração | Autor |
|--------|------|-----------|-------|
| 1.0 | YYYY-MM-DD | Criação | Nome |
```

---

### Documento Secundário: `subs/[domain]-[sub-name]-sub.md` (um por sub-entidade)

Cada sub-entidade tem seu próprio arquivo em `subs/`:

```yaml
# 📦 SUB: [Nome da Sub-Entidade]
domain: [sub-domain]
entity: [EntityName]
description: [descrição]
priority: ALTA|MEDIA|BAIXA
dependency: [módulo que depende]

## Campos
fields:
  - name: [fieldName]
    type: uuid|string|int|datetime|enum|boolean|text
    required: true|false
    unique: true
    default: [valor]
    description: [descrição]

## Relacionamentos
relationships:
  - type: many-to-one|one-to-many|many-to-many
    entity: [EntityName]
    required: true|false
    onDelete: Cascade|Restrict|SetNull

## Funcionalidades
features:
  - CRUD
  - by-[field]
  - stats

## Acesso
access:
  admin: full
  user: read|write|none

## Camada
layers:
  - administrator|client|api
```

---

## Estrutura de Arquivos Gerados

```
📄 specs/
├── [domain]-escopo.md                    ← Documento principal (entidade principal)
└── subs/
    ├── [domain]-[sub1]-sub.md            ← Sub-entidade 1
    ├── [domain]-[sub2]-sub.md            ← Sub-entidade 2
    └── [domain]-[sub3]-sub.md            ← Sub-entidade 3
```

---

## 🚀 Como Usar

### Iniciar Escopo

```
"scope:generate"
```

Responda as perguntas → Gerar documento `[domain]-escopo.md`

### Analisar Escopo

```
"scope:review"
```

Revisar documento, validar regras, identificar módulos faltantes

### Gerar Código

```
"scope:build"
```

Gerar código a partir do escopo aprovado

---

## 📋 Checklist de Validação do Escopo

- [ ] Entidade principal definida
- [ ] Campos documentados com tipos
- [ ] Enum(s) definidos
- [ ] Relacionamentos mapeados
- [ ] Regras de negócio documentadas
- [ ] Fluxo de status definido
- [ ] Funcionalidades listadas
- [ ] Módulos existentes identificados
- [ ] Módulos a criar listados (um arquivo por sub em `subs/`)
- [ ] Validações cruzadas documentadas
- [ ] Escopo aprovado pelo cliente/equipe

---

**Versão:** 3.0  
**Scope Generator - Two-Stage Document Generator**