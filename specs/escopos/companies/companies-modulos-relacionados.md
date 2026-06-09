# 📦 MÓDULOS RELACIONADOS: Companies

**Escopo Pai:** `companies-escopo.md`  
**Versão:** 1.0  
**Data:** 2026-06-08

---

## VISÃO GERAL

O módulo **Companies** é a **entidade raiz** de multi-tenancy. Ele não depende de nenhum outro módulo, mas todos os outros módulos dependem dele através do `companyId`.

---

## 📋 RESUMO

| Módulo | Status | Prioridade | Dependências | Ordem |
|--------|--------|------------|--------------|-------|
| `companies` | 🔨 A criar | ALTA | Nenhuma | 1 |
| `users` | ✅ Existente | ALTA | `companies` | 2 |
| `settings` | 🔨 A criar | MÉDIA | `companies` | 3 |
| `billing` | 🔨 A criar | BAIXA | `companies` | 4 |

---

## 🔨 MÓDULOS A CRIAR

### ORDEM 1: COMPANIES (Este Escopo)

**Prioridade:** ALTA  
**Complexidade:** MÉDIA  
**Tempo estimado:** 6h

> Documentado em `companies-escopo.md`

```yaml
# specs/companies.yaml

domain: companies
entity: Company
description: Entidade raiz de multi-tenancy

fields:
  # ── Identificação ──
  - name: name
    type: string
    required: true
    minLength: 2
    maxLength: 100
    description: Nome fantasia

  - name: tradeName
    type: string
    required: false
    maxLength: 100
    description: Nome comercial

  - name: legalName
    type: string
    required: false
    maxLength: 150
    description: Razão social

  - name: cnpj
    type: string
    required: false
    unique: true
    mask: "##.###.###/####-##"
    description: CNPJ

  - name: stateRegistration
    type: string
    required: false
    description: Inscrição estadual

  - name: municipalRegistration
    type: string
    required: false
    description: Inscrição municipal

  # ── Contato ──
  - name: email
    type: email
    required: false
    description: Email principal

  - name: phone
    type: phone
    required: false
    description: Telefone

  - name: whatsapp
    type: phone
    required: false
    description: WhatsApp

  # ── Endereço ──
  - name: address
    type: string
    required: false
    maxLength: 200
    description: Endereço

  - name: addressNumber
    type: string
    required: false
    description: Número

  - name: addressComplement
    type: string
    required: false
    description: Complemento

  - name: neighborhood
    type: string
    required: false
    description: Bairro

  - name: city
    type: string
    required: false
    description: Cidade

  - name: state
    type: string
    required: false
    maxLength: 2
    description: UF

  - name: country
    type: string
    required: false
    default: "Brasil"
    description: País

  - name: zipCode
    type: string
    required: false
    mask: "#####-###"
    description: CEP

  - name: latitude
    type: decimal
    required: false
    description: Latitude

  - name: longitude
    type: decimal
    required: false
    description: Longitude

  # ── Status ──
  - name: status
    type: enum
    values: [PENDING, APPROVED, ACTIVE, TRIAL, SUSPENDED, BLOCKED, CANCELLED]
    required: true
    default: PENDING
    description: Status da empresa

  # ── Configurações ──
  - name: timezone
    type: string
    required: false
    default: "America/Sao_Paulo"
    description: Timezone

  - name: logo
    type: string
    required: false
    description: URL do logo

  - name: favicon
    type: string
    required: false
    description: URL do favicon

  - name: primaryColor
    type: string
    required: false
    description: Cor primária (hex)

  - name: secondaryColor
    type: string
    required: false
    description: Cor secundária (hex)

  # ── Dados Bancários ──
  - name: payoutPixKey
    type: string
    required: false
    description: Chave PIX

  - name: payoutPixKeyType
    type: enum
    values: [CPF, CNPJ, EMAIL, PHONE, RANDOM]
    required: false
    description: Tipo da chave PIX

  - name: payoutBankCode
    type: string
    required: false
    description: Código do banco

  - name: payoutBankAgency
    type: string
    required: false
    description: Agência

  - name: payoutBankAccount
    type: string
    required: false
    description: Conta

  - name: payoutBankAccountDigit
    type: string
    required: false
    description: Dígito

  - name: payoutBankOwnerName
    type: string
    required: false
    description: Titular

  # ── Configurações Extras ──
  - name: settings
    type: json
    required: false
    description: Configurações customizadas

  - name: openingHours
    type: json
    required: false
    description: Horário de funcionamento

  - name: businessDays
    type: json
    required: false
    description: Dias úteis

relationships:
  - type: one-to-many
    entity: User
    required: false
    onDelete: Cascade
    description: Usuários da empresa

features:
  - CRUD
  - by-cnpj
  - by-name
  - by-status
  - stats
  - approve
  - reject
  - activate
  - suspend
  - block
  - cancel
  - start-trial
  - restore

access:
  system_admin: full

layers:
  - administrator

layerMode: complex

notes: |
  - NÃO tem companyId (ele É a empresa raiz)
  - Todos os outros módulos referenciam companyId
  - Apenas SYSTEM_ADMIN pode gerenciar
```

---

### ORDEM 2: USERS (Atualizar/Estender)

**Prioridade:** ALTA  
**Complexidade:** BAIXA  
**Tempo estimado:** 2h

> O módulo `users` já existe no template. Precisamos:
> 1. Garantir que `companyId` seja optional (para SYSTEM_ADMIN)
> 2. Adicionar novos campos se necessário
> 3. Configurar regras de acesso

```yaml
# specs/users.yaml (atualização)

domain: users
entity: User
description: Usuários do sistema (atualização)

# Campos adicionais necessários:
fields:
  # ── Vinculação Empresa ──
  - name: companyId
    type: uuid
    required: false # null para SYSTEM_ADMIN
    description: Empresa (null = super admin)
```

**Verificações:**
- [ ] `companyId` é optional
- [ ] `company` relation está Cascade
- [ ] Roles configuradas (USER, ADMIN, SYSTEM_ADMIN)
- [ ] Access control para companyId

---

### ORDEM 3: SETTINGS (Configurações da Empresa)

**Prioridade:** MÉDIA  
**Complexidade:** BAIXA  
**Tempo estimado:** 3h

```yaml
# specs/settings.yaml

domain: settings
entity: Setting
description: Configurações específicas da empresa

fields:
  - name: key
    type: string
    required: true
    unique: true
    description: Chave da configuração

  - name: value
    type: json
    required: true
    description: Valor da configuração

  - name: description
    type: string
    required: false
    description: Descrição

  - name: isEncrypted
    type: boolean
    required: true
    default: false
    description: Se o valor é criptografado

  - name: isPublic
    type: boolean
    required: true
    default: false
    description: Se é visível para todos

relationships:
  - type: many-to-one
    entity: Company
    required: true
    onDelete: Cascade

features:
  - CRUD
  - by-key
  - get-public
  - set
  - get

access:
  admin: full

layers:
  - administrator

layerMode: minimal

notes: |
  - Configurações padrão:
 - appointmentDuration: 30
    - reminderHours:24
    - cancellationDeadlineHours: 2
    - maxAdvanceBookingDays: 30
```

---

### ORDEM 4: BILLING (Faturamento)

**Prioridade:** BAIXA  
**Complexidade:** ALTA  
**Tempo estimado:** 8h  
**Status:** PLANEJADO

```yaml
# specs/billing.yaml

domain: billing
entity: Invoice
description: Faturas e controle de pagamento

fields:
  - name: number
    type: string
    required: true
    unique: true
    description: Número da fatura

  - name: amount
    type: decimal
    required: true
    description: Valor total

  - name: status
    type: enum
    values: [DRAFT, PENDING, PAID, OVERDUE, CANCELLED]
    required: true
    default: DRAFT

  - name: dueDate
    type: date
    required: true
    description: Data de vencimento

  - name: paidAt
    type: datetime
    required: false
    description: Data do pagamento

  - name: paymentMethod
    type: enum
    values: [PIX, CREDIT_CARD, BOLETO, TRANSFER]
    required: false

 - name: paymentProof
    type: string
    required: false
    description: Comprovante

relationships:
  - type: many-to-one
    entity: Company
    required: true
    onDelete: Cascade

 - type: many-to-one
    entity: Subscription
    required: false
    onDelete: SetNull

features:
  - CRUD
  - by-status
  - by-date
  - stats
  - generate
  - pay
 - cancel
  - sendReminder

access:
  admin: full

layers:
  - administrator

layerMode: complex
```

---

## 📊 DIAGRAMA DE DEPENDÊNCIAS

```
                    ┌─────────────────────────────────┐
                    │           COMPANIES             │ ← RAIZ (este escopo)
                    │ (multi-tenancy)          │
                    └───────────────┬─────────────────┘
                                    │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
           ▼                       ▼                       ▼
    ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
    │ USERS     │        │  SETTINGS    │        │   BILLING    │
    │ (existente)  │        │   (criar)    │        │  (planejado) │
    └──────────────┘        └──────────────┘        └──────────────┘
           │
           ▼
    ┌──────────────────────────────────────────────────────────────┐
    │                    TODOS OS OUTROS MÓDULOS │
    │     (patients, doctors, appointments, products, etc.)          │
    └──────────────────────────────────────────────────────────────┘
```

---

## 🚀 ORDEM DE IMPLEMENTAÇÃO

```
SEMANA 1
├── Dia 1-2: Companies (módulo raiz)
├── Dia 3: Verificar/ajustar Users
└── Dia 4-5: Settings

SEMANA 2 (futuro)
├── Billing (se necessário)
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Companies
- [ ] Schema Prisma com todos os campos
- [ ] DTOs com validações (CNPJ, email, etc.)
- [ ] Service com regras de negócio
- [ ] Controller com endpoints customizados
- [ ] Status flow implementado
- [ ] Notificações configuradas
- [ ] Migrations executadas

### Users (verificação)
- [ ] companyId é optional
- [ ] Relation Cascade configurada
- [ ] Roles funcionando

### Settings
- [ ] Schema criado
- [ ] CRUD básico
- [ ] Método get/set

---

## 📝 PENDÊNCIAS

| # | Pergunta | Status |
|---|----------|--------|
| P1 | Users precisa de novos campos? | ABERTA |
| P2 | Settings deve ser separado ou dentro de Company? | ABERTA |
| P3 | Billing necessário agora? | NÃO |

---

**FIM DOS MÓDULOS RELACIONADOS**