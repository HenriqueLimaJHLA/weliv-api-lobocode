# 📋 ESCOPO: Companies (Multi-Tenancy)

**Versão:** 1.0  
**Data:** 2026-06-08  
**Status:** RASCUNHO

---

## 1. IDENTIFICAÇÃO

| Campo | Valor |
|-------|-------|
| Domínio | `companies` |
| Entidade | `Company` |
| Descrição | Entidade raiz de multi-tenancy. Cada empresa (tenant) tem seus próprios dados isolados. Todos os outros módulos pertencem a uma empresa. |
| Módulo pai | Nenhum (é a raiz) |
| Dependências | Nenhuma |

---

## 2. ENTIDADE PRINCIPAL

### 2.1 Campos

| Campo | Tipo | Obrigatório | Padrão | Descrição | Validações |
|-------|------|-------------|--------|-----------|------------|
| id | uuid | sim | auto | ID único | - |
| name | string | sim | - | Nome fantasia | minLength: 2, maxLength: 100 |
| tradeName | string | não | - | Nome comercial | maxLength: 100 |
| legalName | string | não | - | Razão social | maxLength: 150 |
| cnpj | string | não | - | CNPJ | único, máscara |
| stateRegistration | string | não | - | Inscrição estadual | - |
| municipalRegistration | string | não | - | Inscrição municipal | - |
| email | email | não | - | Email principal | - |
| phone | phone | não | - | Telefone | - |
| whatsapp | phone | não | - | WhatsApp | - |
| address | string | não | - | Endereço | maxLength: 200 |
| addressNumber | string | não | - | Número | - |
| addressComplement | string | não | - | Complemento | - |
| neighborhood | string | não | - | Bairro | - |
| city | string | não | - | Cidade | - |
| state | string | não | - | UF | maxLength: 2 |
| country | string | não | Brasil | País | - |
| zipCode | string | não | - | CEP | máscara |
| latitude | decimal | não | - | Latitude | - |
| longitude | decimal | não | - | Longitude | - |
| status | enum | sim | PENDING | Status | valores definidos |
| timezone | string | não | America/Sao_Paulo | Timezone | - |
| logo | string | não | - | URL do logo | - |
| favicon | string | não | - | URL do favicon | - |
| primaryColor | string | não | - | Cor primária | hex |
| secondaryColor | string | não | - | Cor secundária | hex |
| payoutPixKey | string | não | - | Chave PIX | - |
| payoutPixKeyType | enum | não | - | Tipo da chave PIX | valores definidos |
| payoutBankCode | string | não | - | Código do banco | - |
| payoutBankAgency | string | não | - | Agência | - |
| payoutBankAccount | string | não | - | Conta | - |
| payoutBankAccountDigit | string | não | - | Dígito | - |
| payoutBankOwnerName | string | não | - | Titular | - |
| settings | json | não | - | Configurações customizadas | - |
| openingHours | json | não | - | Horário de funcionamento | - |
| businessDays | json | não | - | Dias úteis | - |
| createdAt | datetime | sim | auto | Criação | - |
| updatedAt | datetime | sim | auto | Atualização | - |
| deletedAt | datetime | não | - | Exclusão | soft delete |

### 2.2 Enum(s)

```typescript
// Status da Empresa
enum CompanyStatus {
  PENDING = 'PENDING',           // Aguardando aprovação
  APPROVED = 'APPROVED',         // Aprovada (primeiro passo)
  ACTIVE = 'ACTIVE',             // Ativa e funcionando
  TRIAL = 'TRIAL',               // Em período de teste
  SUSPENDED = 'SUSPENDED',       // Suspensa temporariamente
  BLOCKED = 'BLOCKED',           // Bloqueada
  CANCELLED = 'CANCELLED',       // Cancelada
}

// Tipo de Chave PIX
enum PixKeyType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  RANDOM = 'RANDOM',
}
```

### 2.3 Relacionamentos

| Entidade | Tipo | Obrigatório | onDelete | Descrição |
|----------|------|-------------|----------|-----------|
| User | one-to-many | não | Cascade | Usuários da empresa |

---

## 3. REGRAS DE NEGÓCIO

### 3.1 Validações

| # | Regra | Descrição | Prioridade |
|---|-------|-----------|------------|
| V1 | CNPJ único | CNPJ deve ser único se informado | ALTA |
| V2 | CNPJ válido | Se informado, deve ser um CNPJ válido | ALTA |
| V3 | Nome obrigatório | Nome fantasia é obrigatório | ALTA |
| V4 | UF válido | State deve ser UF brasileiro válido | MÉDIA |
| V5 | Email válido | Se informado, deve ser email válido | MÉDIA |
| V6 | Telefone formato | Telefone deve ter formato válido | MÉDIA |

### 3.2 Restrições

| # | Regra | Descrição | Tratamento |
|---|-------|-----------|------------|
| R1 | Não excluir com usuários | Se tiver usuários ativos, não pode excluir | Bloquear + mensagem |
| R2 | Não reverter de CANCELLED | Uma vez cancelada, não pode reativar | Bloquear |
| R3 | Super admin apenas para SYSTEM_ADMIN | Apenas SYSTEM_ADMIN pode criar empresa | Permissionamento |
| R4 | Máximo empresas por super admin | Limitar quantidade de empresas | Contagem + erro |

### 3.3 Automatizações

| # | Regra | Ação | Quando |
|---|-------|------|--------|
| A1 | Código empresa | Gerar código sequencial | Ao criar |
| A2 | Status automático | Mudar de PENDING para APPROVED | Após validação admin |
| A3 | Trial automático | Iniciar período trial ao ativar | Ao criar |
| A4 | Trial expira | Alertar admin quando trial está acabando | 3 dias antes |

### 3.4 Campos Calculados

| Campo | Cálculo | Exemplo |
|-------|---------|---------|
| isTrial | status == TRIAL && trialEnd > now() | true |
| trialDaysLeft | trialEnd - now() | 15 |
| isActive | status == ACTIVE | true |
| fullAddress | address + ', ' + number + ', ' + neighborhood + ', ' + city + ' - ' + state | - |

---

## 4. FLUXO DE STATUS

```
                    ┌──────────────┐
                    │   PENDING    │ ← inicial (criação)
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
        ┌──────────┐            ┌──────────┐
        │APPROVED  │            │CANCELLED │ ← rejeitada
        └────┬─────┘            └──────────┘
             │
             ▼
        ┌──────────┐
        │  TRIAL   │ ← período de teste
        └────┬─────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌────────┐      ┌──────────┐
│ ACTIVE │      │ BLOCKED  │
└───┬────┘      └──────────┘
    │                │
    │    ┌───────────┴───────────┐
    │    │                       │
    ▼    ▼                       ▼
┌──────────┐              ┌──────────┐
│SUSPENDED │              │CANCELLED │
└──────────┘              └──────────┘
```

### Transições Permitidas

| De | Para | Condição | Ação Automática |
|----|------|---------|-----------------|
| PENDING | APPROVED | Admin aprova | - |
| PENDING | CANCELLED | Admin rejeita | - |
| APPROVED | TRIAL | Iniciar trial | trialStart = now() |
| APPROVED | ACTIVE | Ativar direto | - |
| APPROVED | CANCELLED | Rejeitar | - |
| TRIAL | ACTIVE | Comprou | - |
| TRIAL | CANCELLED | Trial expirou | - |
| ACTIVE | SUSPENDED | Problema temporário | - |
| ACTIVE | BLOCKED | Violação grave | - |
| ACTIVE | CANCELLED | Cancelamento | - |
| SUSPENDED | ACTIVE | Reativar | - |
| BLOCKED | ACTIVE | Admin reativa | - |

---

## 5. FUNCIONALIDADES

### 5.1 CRUD

| Operação | SYSTEM_ADMIN | ADMIN | USER | Descrição |
|---------|-------------|-------|------|-----------|
| Criar | ✅ | ❌ | ❌ | Criar empresa |
| Ler | ✅ (todas) | ✅ (própria) | ❌ | Ver empresa |
| Atualizar | ✅ | ✅ (própria) | ❌ | Alterar dados |
| Excluir | ❌ | ❌ | ❌ | Soft delete (apenas SYSTEM_ADMIN via migrate) |
| Reativar | ✅ | ❌ | ❌ | Reativar empresa |

### 5.2 Endpoints Customizados

| Endpoint | Método | Descrição | Roles |
|----------|--------|-----------|-------|
| `/by-cnpj` | GET | Busca por CNPJ | SYSTEM_ADMIN |
| `/by-name` | GET | Busca por nome | SYSTEM_ADMIN |
| `/by-status` | GET | Lista por status | SYSTEM_ADMIN |
| `/stats` | GET | Estatísticas | SYSTEM_ADMIN |
| `/:id/approve` | POST | Aprovar empresa | SYSTEM_ADMIN |
| `/:id/reject` | POST | Rejeitar empresa | SYSTEM_ADMIN |
| `/:id/activate` | POST | Ativar empresa | SYSTEM_ADMIN |
| `/:id/suspend` | POST | Suspender empresa | SYSTEM_ADMIN |
| `/:id/block` | POST | Bloquear empresa | SYSTEM_ADMIN |
| `/:id/cancel` | POST | Cancelar empresa | SYSTEM_ADMIN |
| `/:id/start-trial` | POST | Iniciar trial | SYSTEM_ADMIN |
| `/:id/settings` | GET/PUT | Configurações | ADMIN |

### 5.3 Notificações

| Evento | Destinatário | Canal | Template |
|--------|-------------|-------|----------|
| criação | Admin empresa | Email | `company_created` |
| aprovação | Admin empresa | Email | `company_approved` |
| rejeição | Admin empresa | Email | `company_rejected` |
| trial-start | Admin empresa | Email | `company_trial_started` |
| trial-ending | Admin empresa | Email | `company_trial_ending` |
| suspension | Admin empresa | Email | `company_suspended` |
| cancellation | Admin empresa | Email | `company_cancelled` |

---

## 6. MÓDULOS RELACIONADOS

### 6.1 Módulos Existentes

| Módulo | Status | Uso |
|--------|--------|-----|
| Nenhum | - | Este é o módulo raiz |

### 6.2 Módulos que Dependem

| Módulo | Prioridade | Descrição | Dependência |
|--------|------------|-----------|-------------|
| `users` | ALTA | Usuários da empresa | `companies` |
| `settings` | MÉDIA | Configurações da empresa | `companies` |
| `billing` | BAIXA | Faturamento | `companies` |

### 6.3 Diagrama de Dependências

```
                    ┌─────────────┐
                    │  COMPANIES   │ ← ESTE ESCOPO (raiz)
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │  USERS   │    │ SETTINGS │    │ BILLING  │
    │ (futuro) │    │ (futuro) │    │ (futuro) │
    └──────────┘    └──────────┘    └──────────┘
```

---

## 7. INTERFACES (UI)

### 7.1 Lista de Empresas (Super Admin)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  EMPRESAS                              [+ Nova Empresa]  [Filtros ▼]         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ Filtros ─────────────────────────────────────────────────────────────┐  │
│  │ Status: [Todos ▼]  Cidade: [Todos ▼]  [Buscar CNPJ/Nome...]  [Limpar]   │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ │ Empresa          │ CNPJ           │ Cidade/UF │ Status   │ Ações     ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ │ Clínica São Lucas│ 12.345.678/0001-56 │ São Paulo/SP │ 🟢 Ativa │ 👁️ 📝 ││
│  │ │ Consultório Dra │ 98.765.432/0001-12 │ Rio de Janei│ 🟡 Trial  │ 👁️ 📝 ││
│  │ │ Centro Médico   │ 11.222.333/0001-44 │ BH/MG       │ 🔵 Penden │ 👁️ 📝 ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  Legenda: 🟢 Ativa  🟡 Trial  🔵 Pendente  🟠 Suspensa  🔴 Bloqueada         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Formulário de Empresa

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DADOS DA EMPRESA                                              [× Fechar]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ Identificação ───────────────────────────────────────────────────────┐  │
│  │ * Nome Fantasia    [_______________________________________________] │  │
│  │   Nome Comercial   [_______________________________________________] │  │
│  │   Razão Social     [_______________________________________________] │  │
│  │   CNPJ             [__.___.___/____-__] 🔍                            │  │
│  │   IE               [________________________]                         │  │
│  │   IM               [________________________]                         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ Contato ─────────────────────────────────────────────────────────────┐  │
│  │   Email            [________________________]                         │  │
│  │   Telefone         [(___) ____-____]                                 │  │
│  │   WhatsApp         [(___) ____-____]                                 │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ Endereço ────────────────────────────────────────────────────────────┐  │
│  │   CEP              [_____-__] 🔍                                       │  │
│  │   Endereço         [_______________________________________________] │  │
│  │   Número           [__________]  Complemento [__________________]   │  │
│  │   Bairro           [________________________]                         │  │
│  │   Cidade          [________________________]                         │  │
│  │   UF              [SP ▼]                                             │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ Configurações ──────────────────────────────────────────────────────┐  │
│  │   Timezone         [America/Sao_Paulo ▼]                              │  │
│  │   Cor Primária     [____] (hex)  Cor Secundária [____] (hex)        │  │
│  │   Logo             [Selecionar arquivo...]                           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ Dados Bancários (PIX) ──────────────────────────────────────────────┐  │
│  │   Chave PIX        [________________________]                         │  │
│  │   Tipo             [CPF ▼]  Banco [____-_]  Agência [______]         │  │
│  │   Conta            [__________]-[_]  Titular [____________________]  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                        [Cancelar]  [Salvar]                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Configurações da Empresa (Admin)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CONFIGURAÇÕES DA EMPRESA                                        [× Fechar]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ Horário de Funcionamento ─────────────────────────────────────────────┐  │
│  │   ┌─────────┬──────────┬──────────┬──────────┐                         │  │
│  │   │         │  Abertura │ Fechamento│ Ativo  │                         │  │
│  │   ├─────────┼──────────┼──────────┼──────────┤                         │  │
│  │   │ Seg     │ [08:00]  │ [18:00]  │   ☑     │                         │  │
│  │   │ Ter     │ [08:00]  │ [18:00]  │   ☑     │                         │  │
│  │   │ Qua     │ [08:00]  │ [18:00]  │   ☑     │                         │  │
│  │   │ Qui     │ [08:00]  │ [18:00]  │   ☑     │                         │  │
│  │   │ Sex     │ [08:00]  │ [17:00]  │   ☑     │                         │  │
│  │   │ Sáb     │ [09:00]  │ [13:00]  │   ☐     │                         │  │
│  │   │ Dom     │ [____]   │ [____]   │   ☐     │                         │  │
│  │   └─────────┴──────────┴──────────┴──────────┘                         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ Configurações Gerais ─────────────────────────────────────────────────┐  │
│  │   ☐ Ativar lembretes automáticos                                       │  │
│  │   ☐ Ativar confirmações por email                                      │  │
│  │   ☐ Ativar notificações push                                           │  │
│  │   Tempo mínimo de antecedência: [2] horas                             │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                        [Cancelar]  [Salvar]                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. PENDÊNCIAS / DÚVIDAS

| # | Pergunta | Status | Resposta |
|---|----------|--------|----------|
| P1 | Precisa módulo de billing/pagamento? | ABERTA | - |
| P2 | CNPJ é obrigatório? | ABERTA | - |
| P3 | Precisa integração com nota fiscal? | ABERTA | - |
| P4 | Qual tempo padrão de trial? | ABERTA | 14 dias |

---

## 9. HISTÓRICO DE ALTERAÇÕES

| Versão | Data | Alteração | Autor |
|--------|------|-----------|-------|
| 1.0 | 2026-06-08 | Criação inicial | Claude (AI) |

---

## 10. APROVAÇÃO

| Papel | Nome | Data | Assinatura |
|-------|------|------|------------|
| Product Owner | | | |
| Tech Lead | | | |
| UX/UI | | | |

---

**FIM DO ESCOPO**