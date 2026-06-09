# 📋 ESCOPO: Appointments (Agendamento de Consultas Médicas)

**Versão:** 1.0  
**Data:** 2026-06-08  
**Status:** RASCUNHO

---

## 1. IDENTIFICAÇÃO

| Campo | Valor |
|-------|-------|
| Domínio | `appointments` |
| Entidade | `Appointment` |
| Descrição | Sistema de agendamento de consultas médicas com controle de status e notificações |
| Módulo pai | Nenhum |
| Dependências | `users`, `companies` (existentes), `patients`, `doctors`, `specialties` (a criar) |

---

## 2. ENTIDADE PRINCIPAL

### 2.1 Campos

| Campo | Tipo | Obrigatório | Padrão | Descrição | Validações |
|-------|------|-------------|--------|-----------|------------|
| id | uuid | sim | auto | ID único | - |
| code | string | não | auto | Código sequencial | único por empresa |
| date | datetime | sim | - | Data e hora | deve ser futura |
| endDate | datetime | não | - | Data/hora fim | >= date |
| duration | int | sim | 30 | Duração em minutos | >= 15, <= 240 |
| status | enum | sim | SCHEDULED | Status | valores definidos |
| reason | string | sim | - | Motivo da consulta | maxLength: 200 |
| notes | text | não | - | Observações | - |
| isPaid | boolean | sim | false | Pago? | - |
| paidAt | datetime | não | - | Data pagamento | - |
| confirmedAt | datetime | não | - | Data confirmação | - |
| confirmedBy | uuid | não | - | Quem confirmou | - |
| cancelledAt | datetime | não | - | Data cancelamento | - |
| cancelledBy | uuid | não | - | Quem cancelou | - |
| cancellationReason | text | não | - | Motivo cancelamento | - |
| companyId | uuid | sim | - | Empresa | - |
| patientId | uuid | sim | - | Paciente | - |
| doctorId | uuid | sim | - | Médico | - |
| specialtyId | uuid | não | - | Especialidade | - |
| createdAt | datetime | sim | auto | Criação | - |
| updatedAt | datetime | sim | auto | Atualização | - |
| deletedAt | datetime | não | - | Exclusão | soft delete |

### 2.2 Enum(s)

```typescript
// Status do Agendamento
enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',      // Agendado
  CONFIRMED = 'CONFIRMED', // Confirmado
  IN_PROGRESS = 'IN_PROGRESS',   // Em atendimento
  COMPLETED = 'COMPLETED',       // Finalizado
  CANCELLED = 'CANCELLED',       // Cancelado
  NO_SHOW = 'NO_SHOW',          // Não compareceu
}
```

### 2.3 Relacionamentos

| Entidade | Tipo | Obrigatório | onDelete | Descrição |
|----------|------|-------------|----------|-----------|
| Company | many-to-one | sim | Cascade | Empresa dona |
| User (Patient) | many-to-one | sim | Restrict | Paciente |
| User (Doctor) | many-to-one | sim | Restrict | Médico |
| Specialty | many-to-one | não | SetNull | Especialidade |

---

## 3. REGRAS DE NEGÓCIO

### 3.1 Validações

| # | Regra | Descrição | Prioridade |
|---|-------|-----------|------------|
| V1 | Data futura | A data deve ser futura (mínimo 15min) | ALTA |
| V2 | Horário disponível | Não pode conflitar com outro agendamento do mesmo médico | ALTA |
| V3 | Duração mínima | Mínimo 15 minutos | MÉDIA |
| V4 | Duração máxima | Máximo 4 horas | MÉDIA |
| V5 | Paciente ativo | Paciente deve ter status ACTIVE | ALTA |
| V6 | Médico ativo | Médico deve ter status ACTIVE | ALTA |
| V7 | Não no passado | Não pode agendar data passada | ALTA |
| V8 |Horário médico | Deve estar dentro do horário de trabalho do médico | MÉDIA |

### 3.2 Restrições

| # | Regra | Descrição | Tratamento |
|---|-------|-----------|------------|
| R1 | Não cancelar IN_PROGRESS | Não pode cancelar consulta já iniciada | Bloquear ação + mensagem |
| R2 | Não cancelar COMPLETED | Não pode cancelar consulta já finalizada | Bloquear ação |
| R3 | Tempo mínimo cancelamento | Só pode cancelar até 2h antes | Alertar usuário + taxa |
| R4 | Máximo antecedência | Não pode agendar com mais de 6 meses | Validação |
| R5 | Máximo diário por médico | Limitar agendamentos por dia | Contagem + alerta |

### 3.3 Automatizações

| # | Regra | Ação | Quando |
|---|-------|------|--------|
| A1 | Código automático | Gerar `APT-YYYYMMDD-XXXX` | Ao criar |
| A2 | Status NO_SHOW | Marcar automaticamente |30min após horário sem comparecimento |
| A3 | Atualizar endDate | Calcular baseado em duration | Ao definir date |
| A4 | Confirmação automática | Confirma se não cancelado | 24h antes |

### 3.4 Campos Calculados

| Campo | Cálculo | Exemplo |
|-------|---------|---------|
| isOverdue | date < now() && status == SCHEDULED | true |
| daysUntil | Math.ceil((date - now()) / day) | 3 |
| isPast | date < now() | true |
| isToday | date.toDateString() == now().toDateString() | true |

---

## 4. FLUXO DE STATUS

```
                         ┌──────────────┐
                         │  SCHEDULED   │ ← inicial
                         └──────┬───────┘
                                │
                    ┌──────────┼──────────┐
                    │          │          │
                    ▼          ▼          ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │CONFIRMED │ │CANCELLED │ │  NO_SHOW │
              └────┬─────┘ └──────────┘ └──────────┘
                   │
                   ▼
            ┌──────────────┐
            │ IN_PROGRESS │ ← médico inicia
            └──────┬──────┘
                   │
                   ▼
            ┌──────────┐
            │ COMPLETED │ ← consulta finalizada
            └──────────┘
```

### Transições Permitidas

| De | Para | Condição | Ação Automática |
|----|------|---------|-----------------|
| SCHEDULED | CONFIRMED | Confirmação | confirmedAt = now() |
| SCHEDULED | CANCELLED | Cancelamento | cancelledAt = now() |
| SCHEDULED | NO_SHOW | Timeout 30min | - |
| CONFIRMED | IN_PROGRESS | Médico inicia | - |
| CONFIRMED | CANCELLED | Cancelamento | - |
| CONFIRMED | NO_SHOW | Timeout 30min | - |
| IN_PROGRESS | COMPLETED | Finalizar | - |
| IN_PROGRESS | CANCELLED | Emergência | - |

---

## 5. FUNCIONALIDADES

### 5.1 CRUD

| Operação | User | Admin | Descrição |
|---------|------|-------|-----------|
| Criar | ✅ | ✅ | Criar agendamento |
| Ler | ✅ (próprio) | ✅ (todos) | Ver agendamento |
| Atualizar | ❌ | ✅ | Alterar dados |
| Excluir | ❌ | ✅ | Soft delete |
| Reativar | ❌ | ✅ | Restore |

### 5.2 Endpoints Customizados

| Endpoint | Método | Descrição | Roles |
|----------|--------|-----------|-------|
| `/by-status` | GET | Busca por status | ADMIN |
| `/by-date` | GET | Busca por data | ADMIN |
| `/by-date-range` | GET | Busca por período | ADMIN |
| `/by-doctor` | GET | Busca por médico | USER, ADMIN |
| `/by-patient` | GET | Busca por paciente | USER, ADMIN |
| `/by-specialty` | GET | Busca por especialidade | ADMIN |
| `/my-appointments` | GET | Meus agendamentos | USER |
| `/today` | GET | Agendamentos de hoje | USER, ADMIN |
| `/upcoming` | GET | Próximos agendamentos | USER, ADMIN |
| `/stats` | GET | Estatísticas | ADMIN |
| `/:id/confirm` | POST | Confirmar | USER, ADMIN |
| `/:id/cancel` | POST | Cancelar | USER, ADMIN |
| `/:id/start` | POST | Iniciar atendimento | ADMIN |
| `/:id/complete` | POST | Finalizar | ADMIN |
| `/:id/no-show` | POST | Marcar não compareceu | ADMIN |

### 5.3 Notificações

| Evento | Destinatário | Canal | Template |
|--------|-------------|-------|----------|
| criação | Paciente | Email/SMS | `appointment_created` |
| criação | Médico | Email | `appointment_doctor_created` |
| confirmação | Paciente | Email/SMS | `appointment_confirmed` |
| lembrete (24h) | Paciente | Email/SMS | `appointment_reminder_24h` |
| lembrete (1h) | Paciente | SMS | `appointment_reminder_1h` |
| cancelamento | Paciente | Email/SMS | `appointment_cancelled` |
| cancelamento | Médico | Email | `appointment_doctor_cancelled` |
| no-show | Admin | Email | `appointment_no_show` |

---

## 6. MÓDULOS RELACIONADOS

### 6.1 Módulos Existentes

| Módulo | Status | Uso |
|--------|--------|-----|
| `companies` | ✅ Existente | Multi-tenancy |
| `users` | ✅ Existente | Paciente/Médico (estender) |

### 6.2 Módulos a Criar

| Módulo | Prioridade | Descrição | Dependência |
|--------|------------|-----------|-------------|
| `patients` | ALTA | Cadastro de pacientes | `users` |
| `doctors` | ALTA | Cadastro de médicos | `users`, `specialties` |
| `specialties` | MÉDIA | Especialidades médicas | - |
| `medical-records` | BAIXA | Prontuário do paciente | `patients`, `appointments` |

### 6.3 Diagrama de Dependências

```
                    ┌─────────────┐
                    │  COMPANIES   │ ← existente
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
             │MEDICAL_RECORDS│ ← futuro
             └───────────────┘
```

---

## 7. INTERFACES (UI)

### 7.1 Lista de Agendamentos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AGENDAMENTOS                    [+ Novo]  [Filtros ▼]  [Hoje]  [Semana]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ Filtros ─────────────────────────────────────────────────────────────┐  │
│  │ Status: [Todos ▼]  Médico: [Todos ▼]  Data: [________]  [Limpar]      │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ ☐ │ Código    │ Paciente      │ Médico     │ Data/Hora        │ Status  ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ ☐ │ APT-001   │ João Silva    │ Dr. Carlos │ 10/06 09:00      │ 🔵 Ag. ││
│  │ ☐ │ APT-002   │ Maria Santos  │ Dr. Carlos │ 10/06 10:00      │ 🟢 Conf ││
│  │ ☐ │ APT-003   │ Pedro Costa   │ Dr. Ana    │ 10/06 14:00      │ 🟡 Atend││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  Legenda: 🔵 Agendado  🟢 Confirmado  🟡 Em Atendimento  🟣 Finalizado     │
│           🔴 Cancelado  ⚫ No Show                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Formulário de Agendamento

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NOVO AGENDAMENTO                                              [× Fechar]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  * Paciente    [Buscar paciente... ___________________________] 🔍          │
│                                                                             │
│  * Médico      [Selecione o médico ___________________________] 🔍          │
│                                                                             │
│  * Data/Hora   [__10/06/2026__] [__09:00__]                                 │
│                                                                             │
│  * Duração     [ 30 minutos ▼]                                              │
│                └─ 15, 30, 45, 60, 90, 120 minutos                           │
│                                                                             │
│  Especialidade [Selecione (opcional) ________________________]              │
│                                                                             │
│  * Motivo      [________________________________________________]          │
│                └─ max 200 caracteres                                       │
│                                                                             │
│  Observações   [________________________________________________]          │
│                └─ Observações internas (opcional)                           │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │  ⚠️ Dr. Carlos já tem agendamento às 09:30                           │   │
│  │  ⚠️ Este horário está fora do expediente do médico (08:00-18:00)     │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                        [Cancelar]  [Agendar]                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. PENDÊNCIAS / DÚVIDAS

| # | Pergunta | Status | Resposta |
|---|----------|--------|----------|
| P1 | Precisa controle de pagamento (valores)? | ABERTA | - |
| P2 | Precisa integração com calendário externo? | ABERTA | - |
| P3 | Precisa aguardamento de sala? | ABERTA | - |
| P4 | Qual sistema de notificação? (email, SMS, push) | ABERTA | - |

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