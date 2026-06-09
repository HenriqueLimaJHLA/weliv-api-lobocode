# 📦 MÓDULOS RELACIONADOS: Appointments

**Escopo Pai:** `appointments-escopo.md`  
**Versão:** 1.0  
**Data:** 2026-06-08

---

## VISÃO GERAL

Para implementar o sistema de Agendamentos de Consultas Médicas, precisamos criar os seguintes módulos. Alguns já existem no template, outros precisam ser criados.

---

## 📋 RESUMO

| Módulo | Status | Prioridade | Dependências | Ordem |
|--------|--------|------------|--------------|-------|
| `companies` | ✅ Existente | - | - | - |
| `users` | ✅ Existente | - | - | - |
| `specialties` | 🔨 A criar | MÉDIA | nenhuma | 1 |
| `patients` | 🔨 A criar | ALTA | `users` | 2 |
| `doctors` | 🔨 A criar | ALTA | `users`, `specialties` | 3 |
| `appointments` | 🔨 A criar | ALTA | `patients`, `doctors` | 4 |
| `medical-records` | 🔨 A criar | BAIXA | `patients`, `appointments` | 5 (futuro) |

---

## 🔨 MÓDULOS A CRIAR

### ORDEM 1: SPECIALTIES (Especialidades)

**Prioridade:** MÉDIA  
**Complexidade:** BAIXA  
**Tempo estimado:** 2h

```yaml
# specs/specialties.yaml

domain: specialties
entity: Specialty
description: Especialidades médicas (Cardiologia, Dermatologia, etc.)

fields:
  - name: name
    type: string
    required: true
    unique: true
    minLength: 3
    maxLength: 100
    description: Nome da especialidade

  - name: code
    type: string
    required: true
    unique: true
    maxLength: 10
    description: Código CBO (Classificação Brasileira de Ocupações)

  - name: description
    type: text
    required: false
    description: Descrição da especialidade

  - name: isActive
    type: boolean
    required: true
    default: true
    description: Se está ativa para novos agendamentos

  - name: defaultDuration
    type: int
    required: false
    default: 30
    min: 15
    max: 120
    description: Duração padrão da consulta (minutos)

features:
  - CRUD
  - by-name
  - list-active
  - by-code

access:
  admin: full

layers:
  - administrator

layerMode: minimal
```

**Dependências:** Nenhuma  
**Módulos que dependem dele:** `doctors`

---

### ORDEM 2: PATIENTS (Pacientes)

**Prioridade:** ALTA  
**Complexidade:** MÉDIA  
**Tempo estimado:** 4h

```yaml
# specs/patients.yaml

domain: patients
entity: Patient
description: Cadastro estendido de pacientes (User + dados médicos)

fields:
  # ── Vinculação User ──
  - name: userId
    type: uuid
    required: true
    unique: true
    description: ID do usuário vinculado

  # ── Identificação ──
  - name: medicalRecordNumber
    type: string
    required: false
    unique: true
    description: Número do prontuário

  - name: birthDate
    type: date
    required: true
    description: Data de nascimento

  - name: gender
    type: enum
    values: [MALE, FEMALE, OTHER]
    required: false
    description: Gênero

  # ── Dados Médicos ──
  - name: bloodType
    type: enum
    values: [A_POSITIVE, A_NEGATIVE, B_POSITIVE, B_NEGATIVE, AB_POSITIVE, AB_NEGATIVE, O_POSITIVE, O_NEGATIVE]
    required: false
    description: Tipo sanguíneo

  - name: allergies
    type: text
    required: false
    description: Lista de alergias (separadas por vírgula)

  - name: chronicConditions
    type: text
    required: false
    description: Condições crônicas

  - name: medications
    type: text
    required: false
    description: Medicamentos em uso

  - name: emergencyContact
    type: string
    required: false
    maxLength: 100
    description: Contato de emergência

  - name: emergencyPhone
    type: phone
    required: false
    description: Telefone de emergência

  # ── Observações ──
  - name: observations
    type: text
    required: false
    description: Observações gerais

  - name: isActive
    type: boolean
    required: true
    default: true
    description: Se está ativo para agendamentos

relationships:
  - type: many-to-one
    entity: User
    required: true
    onDelete: Cascade
    description: Usuário vinculado

features:
  - CRUD
  - by-mrn
  - by-user
  - search
  - stats

access:
  user:
    read: true
    update: true (próprio)
  admin: full

layers:
  - user
  - administrator

layerMode:
  user: standard
  administrator: standard
```

**Dependências:** `users` (existente)  
**Módulos que dependem dele:** `appointments`

---

### ORDEM 3: DOCTORS (Médicos)

**Prioridade:** ALTA  
**Complexidade:** MÉDIA  
**Tempo estimado:** 4h

```yaml
# specs/doctors.yaml

domain: doctors
entity: Doctor
description: Cadastro estendido de médicos (User + dados profissionais)

fields:
  # ── Vinculação User ──
  - name: userId
    type: uuid
    required: true
    unique: true
    description: ID do usuário vinculado

  # ── Dados Profissionais ──
  - name: crm
    type: string
    required: true
    unique: true
    maxLength: 20
    description: Número do CRM

  - name: crmState
    type: string
    required: true
    maxLength: 2
    description: UF do CRM

  # ── Horários ──
  - name: scheduleStart
    type: string
    required: false
    description: Início do expediente (formato HH:mm)

  - name: scheduleEnd
    type: string
    required: false
    description: Fim do expediente (formato HH:mm)

  - name: slotDuration
    type: int
    required: false
    default: 30
    min: 15
    max: 120
    description: Duração de cada consulta (minutos)

  # ── Configurações ──
  - name: maxDailyAppointments
    type: int
    required: false
    default: 20
    min: 1
    max: 50
    description: Máximo de agendamentos por dia

  - name: requiresConfirmation
    type: boolean
    required: false
    default: true
    description: Se exige confirmação manual

  - name: allowOnlineScheduling
    type: boolean
    required: false
    default: true
    description: Se permite agendamento online

  - name: cancellationDeadlineHours
    type: int
    required: false
    default: 2
    min: 0
    max: 24
    description: Horas mínimas para cancelamento

  # ── Status ──
  - name: isActive
    type: boolean
    required: true
    default: true
    description: Se está ativo para agendamentos

  # ── Observações ──
  - name: observations
    type: text
    required: false
    description: Observações

relationships:
  - type: many-to-one
    entity: User
    required: true
    onDelete: Cascade
    description: Usuário vinculado

  - type: many-to-many
    entity: Specialty
    required: false
    description: Especialidades do médico

features:
  - CRUD
  - by-crm
  - by-user
  - by-specialty
  - available-slots
  - stats

access:
  user:
    read: true (próprio)
    update: true (próprio)
  admin: full

layers:
  - user
  - administrator

layerMode:
  user: standard
  administrator: complex
```

**Dependências:** `users` (existente), `specialties` (criado anteriormente)  
**Módulos que dependem dele:** `appointments`

---

### ORDEM 4: APPOINTMENTS (Agendamentos)

**Prioridade:** ALTA  
**Complexidade:** ALTA  
**Tempo estimado:** 8h

> Este é o escopo principal documentado em `appointments-escopo.md`

```yaml
# specs/appointments.yaml

domain: appointments
entity: Appointment
description: Sistema de agendamento de consultas médicas

fields:
  # ── Identificação ──
  - name: code
    type: string
    required: false
    unique: true
    description: Código sequencial (gerado)

  # ── Data/Hora ──
  - name: date
    type: datetime
    required: true
    description: Data e hora da consulta

  - name: endDate
    type: datetime
    required: false
    description: Data/hora de fim (calculado)

  - name: duration
    type: int
    required: true
    default: 30
    min: 15
    max: 240
    description: Duração em minutos

  # ── Status ──
  - name: status
    type: enum
    values: [SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW]
    required: true
    default: SCHEDULED

  # ── Dados ──
  - name: reason
    type: string
    required: true
    maxLength: 200
    description: Motivo da consulta

  - name: notes
    type: text
    required: false
    description: Observações internas

  # ── Pagamento ──
  - name: isPaid
    type: boolean
    required: true
    default: false

  - name: paidAt
    type: datetime
    required: false

  # ── Confirmação ──
  - name: confirmedAt
    type: datetime
    required: false

  - name: confirmedBy
    type: uuid
    required: false

  # ── Cancelamento ──
  - name: cancelledAt
    type: datetime
    required: false

  - name: cancelledBy
    type: uuid
    required: false

  - name: cancellationReason
    type: text
    required: false

relationships:
  - type: many-to-one
    entity: Company
    required: true
    onDelete: Cascade

  - type: many-to-one
    entity: Patient
    required: true
    onDelete: Restrict

  - type: many-to-one
    entity: Doctor
    required: true
    onDelete: Restrict

  - type: many-to-one
    entity: Specialty
    required: false
    onDelete: SetNull

features:
  - CRUD
  - by-code
  - by-status
  - by-date
  - by-doctor
  - by-patient
  - by-specialty
  - my-appointments
  - today
  - upcoming
  - stats
  - confirm
  - cancel
  - start
  - complete
  - no-show
  - restore

access:
  user:
    create: true
    read: true (próprio)
    update: false
  admin: full

layers:
  - user
  - administrator

layerMode:
  user: standard
  administrator: complex

notifications:
  onCreate: true
  onUpdate: true
  onDelete: false
```

**Dependências:** `patients`, `doctors` (criados anteriormente)  
**Módulos que dependem dele:** `medical-records` (futuro)

---

### ORDEM 5: MEDICAL-RECORDS (Futuro)

**Prioridade:** BAIXA  
**Complexidade:** ALTA  
**Tempo estimado:** 12h  
**Status:** PLANEJADO

> Aguardar implementação de `appointments` para criar.

---

## 📊 DIAGRAMA DE DEPENDÊNCIAS

```
                    ┌─────────────────────────────────┐
                    │           COMPANIES             │ ← existente
                    │        (multi-tenancy)          │
                    └───────────────┬─────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           │                        │                        │
           ▼                        ▼                        ▼
    ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
    │     USERS    │        │  SPECIALTIES │        │     USERS    │
    │  (pacientes) │        │   (criar)    │        │  (médicos)   │
    └───────┬──────┘        └──────────────┘        └───────┬──────┘
            │                                             │
            │                                             │
            ▼                                             ▼
    ┌──────────────┐                              ┌──────────────┐
    │   PATIENTS   │                              │   DOCTORS    │
    │   (criar)    │◄─────────────────────────────│   (criar)    │
    └───────┬──────┘                              └───────┬──────┘
            │                                            │
            │    ┌──────────────────────────────────────┘
            │    │
            ▼    ▼
    ┌──────────────────────┐
    │     APPOINTMENTS     │ ← ESCOPO PRINCIPAL
    │      (criar)         │
    └──────────────────────┘
            │
            ▼
    ┌──────────────────────┐
    │   MEDICAL_RECORDS    │ ← FUTURO
    │     (planejado)     │
    └──────────────────────┘
```

---

## 🚀 ORDEM DE IMPLEMENTAÇÃO

```
SEMANA 1
├── Dia 1-2: Specialty (simples, rápido)
├── Dia 3-4: Patients (depende de users)
└── Dia 5: Doctors (depende de users + specialty)

SEMANA 2
├── Dia 1-3: Appointments (principal)
├── Dia 4: Testes de integração
└── Dia 5: Deploy
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] `specialties` criado
- [ ] `patients` criado
- [ ] `doctors` criado
- [ ] `appointments` criado
- [ ] Integração entre módulos funcionando
- [ ] Regras de negócio validadas
- [ ] Notificações configuradas
- [ ] Testes de aceitação passando

---

**FIM DOS MÓDULOS RELACIONADOS**