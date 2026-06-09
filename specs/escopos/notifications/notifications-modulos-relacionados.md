# 📦 MÓDULOS RELACIONADOS: Notifications

**Escopo Pai:** `notifications-escopo.md`  
**Versão:** 1.0  
**Data:** 2026-06-08

---

## VISÃO GERAL

O módulo **Notifications** é um sistema centralizado de envio multi-canal. Ele gerencia notificações internas (in-app/WebSocket) e externas (push, email, SMS, WhatsApp) com templates, preferências de usuário e tracking de entrega.

---

## 📋 RESUMO DOS MÓDULOS

| Módulo | Prioridade | Complexidade | Dependências |
|--------|------------|--------------|--------------|
| `notifications` | ALTA | ALTA | `companies`, `users` |
| `notifications-templates` | ALTA | MÉDIA | `notifications` |
| `notifications-preferences` | MÉDIA | BAIXA | `notifications`, `users` |
| `notifications-devices` | MÉDIA | BAIXA | `notifications` |
| `notifications-channels` | ALTA | ALTA | `notifications` |
| `notifications-jobs` | MÉDIA | BAIXA | `notifications` |

---

## 🔨 MÓDULOS A CRIAR

### ORDEM 1: NOTIFICATIONS (Principal)

**Prioridade:** ALTA  
**Complexidade:** ALTA  
**Tempo estimado:** 16h

> Documentado em `notifications-escopo.md`

**Entities:**
- `Notification`
- `NotificationRecipient`
- `NotificationChannel`

**Features:**
- CRUD de notificações
- Envio multi-canal
- Agendamento
- Retry automático
- Tracking de entrega
- Estatísticas

---

### ORDEM 2: NOTIFICATIONS-TEMPLATES

**Prioridade:** ALTA  
**Complexidade:** MÉDIA  
**Tempo estimado:** 6h

```yaml
# specs/notifications-templates.yaml

domain: notifications-templates
entity: NotificationTemplate
description: Templates de notificação reutilizáveis

fields:
  - name: name
    type: string
    required: true
    description: Nome do template

  - name: code
    type: string
    required: true
    unique: true
    description: Código único (ex: booking_confirmed)

  - name: channel
    type: enum
    required: true
    values: [IN_APP, PUSH, EMAIL, SMS, WHATSAPP]
    description: Canal do template

  - name: title
    type: string
    required: false
    description: Título (push/email)

  - name: body
    type: text
    required: true
    description: Corpo com placeholders (ex: {{name}})

  - name: subject
    type: string
    required: false
    description: Assunto (email)

  - name: variables
    type: json
    required: true
    description: Lista de variáveis disponíveis

  - name: footer
    type: string
    required: false
    description: Rodapé

  - name: imageUrl
    type: string
    required: false
    description: URL da imagem

  - name: actionText
    type: string
    required: false
    description: Texto do botão

  - name: actionUrl
    type: string
    required: false
    description: URL do botão

  - name: isActive
    type: boolean
    required: true
    default: true

  - name: companyId
    type: uuid
    required: false
    description: Empresa (null = global)

relationships:
  - type: many-to-one
    entity: Company
    required: false
    onDelete: Cascade

features:
  - CRUD
  - by-channel
  - by-code
  - preview
  - duplicate

access:
  admin: full
```

---

### ORDEM 3: NOTIFICATIONS-PREFERENCES

**Prioridade:** MÉDIA  
**Complexidade:** BAIXA  
**Tempo estimado:** 4h

```yaml
# specs/notifications-preferences.yaml

domain: notifications-preferences
entity: UserNotificationPreference
description: Preferências de notificação do usuário

fields:
  - name: userId
    type: uuid
    required: true

  - name: channel
    type: enum
    required: true
    values: [IN_APP, PUSH, EMAIL, SMS, WHATSAPP]

  - name: enabled
    type: boolean
    required: true
    default: true

  - name: frequency
    type: enum
    required: true
    values: [INSTANT, DAILY, WEEKLY, NONE]
    default: INSTANT

  - name: quietHoursStart
    type: time
    required: false

  - name: quietHoursEnd
    type: time
    required: false

  - name: notificationTypes
    type: json
    required: false
    description: Lista de tipos permitidos

  - name: companyId
    type: uuid
    required: false

relationships:
  - type: many-to-one
    entity: User
    required: true
    onDelete: Cascade

features:
  - CRUD
  - by-user
  - update-channel

access:
  user: read/update (próprio)
```

---

### ORDEM 4: NOTIFICATIONS-DEVICES

**Prioridade:** MÉDIA  
**Complexidade:** BAIXA  
**Tempo estimado:** 4h

```yaml
# specs/notifications-devices.yaml

domain: notifications-devices
entity: DeviceToken
description: Tokens de dispositivo para push notifications

fields:
  - name: userId
    type: uuid
    required: true

  - name: token
    type: string
    required: true
    description: Token do dispositivo

  - name: type
    type: enum
    required: true
    values: [IOS, ANDROID, WEB, DESKTOP]

  - name: provider
    type: enum
    required: true
    values: [FCM, APNS, WEB_PUSH]
    default: FCM

  - name: isActive
    type: boolean
    required: true
    default: true

  - name: lastUsedAt
    type: datetime
    required: false

  - name: deviceInfo
    type: json
    required: false
    description: Info do dispositivo

  - name: companyId
    type: uuid
    required: false

relationships:
  - type: many-to-one
    entity: User
    required: true
    onDelete: Cascade

features:
  - register
  - unregister
  - list (by user)
  - update (refresh token)
  - cleanup (inactive)

access:
  user: full (próprio)
```

---

### ORDEM 5: NOTIFICATIONS-CHANNELS

**Prioridade:** ALTA  
**Complexidade:** ALTA  
**Tempo estimado:** 12h

Este é o submódulo de provedores. Estrutura:

```
channels/
├── channels.module.ts              ← Module agregador
├── channels.service.ts            ← Service principal (delegação)
│
├── in-app/
│   ├── in-app.module.ts
│   ├── in-app.service.ts          ← WebSocket emitter
│   └── in-app.gateway.ts          ← Socket.io gateway
│
├── push/
│   ├── push.module.ts
│   ├── push.service.ts            ← Interface para provedores
│   ├── providers/
│   │   ├── push-provider.interface.ts
│   │   ├── fcm.provider.ts        ← Firebase Cloud Messaging
│   │   └── apns.provider.ts       ← Apple Push
│
├── email/
│   ├── email.module.ts
│   ├── email.service.ts
│   ├── providers/
│   │   ├── email-provider.interface.ts
│   │   ├── sendgrid.provider.ts
│   │   ├── resend.provider.ts
│   │   └── aws-ses.provider.ts
│
├── sms/
│   ├── sms.module.ts
│   ├── sms.service.ts
│   ├── providers/
│   │   ├── sms-provider.interface.ts
│   │   ├── twilio.provider.ts
│   │   └── zapi.provider.ts
│
└── whatsapp/
    ├── whatsapp.module.ts
    ├── whatsapp.service.ts
    └── providers/
        ├── whatsapp-provider.interface.ts
        └── zapi.provider.ts
```

**Provider Interface (exemplo para Push):**

```typescript
// push-provider.interface.ts
export interface PushProvider {
  name: string;

  send(params: {
    token: string;
    title: string;
    body: string;
    data?: Record<string, any>;
    image?: string;
    priority?: 'high' | 'normal';
  }): Promise<PushResult>;

  sendMultiple(params: {
    tokens: string[];
    title: string;
    body: string;
    data?: Record<string, any>;
  }): Promise<PushResult[]>;

  validateToken(token: string): Promise<boolean>;
}

export interface PushResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}
```

---

### ORDEM 6: NOTIFICATIONS-JOBS

**Prioridade:** MÉDIA  
**Complexidade:** BAIXA  
**Tempo estimado:** 4h

```yaml
# specs/notifications-jobs.yaml

domain: notifications-jobs
description: Jobs recorrentes para notificações

jobs:
  - name: notification-cleanup
    schedule: "0 2 * * *" # Daily at 2am
    description: Remove notificações expiradas
    action: soft-delete expired notifications

  - name: notification-retry
    schedule: "*/5 * * * *" # Every 5 minutes
    description: Tenta novamente notificações falhas
    action: retry failed notifications (max 3 attempts)

  - name: notification-stats
    schedule: "0 * * * *" # Hourly
    description: Calcula estatísticas
    action: update delivery rates, engagement metrics

  - name: notification-quiet-hours
    schedule: "*/15 * * * *" # Every 15 minutes
    description: Processa notificações atrasadas
    action: send notifications that were delayed by quiet hours
```

---

## 📊 DIAGRAMA DE DEPENDÊNCIAS

```
                          ┌─────────────────────┐
                          │    NOTIFICATIONS     │ ← Principal
                          │   (notifications)    │
                          └──────────┬──────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          ▼                          ▼                          ▼
   ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
   │   TEMPLATES  │          │  PREFERENCES  │          │    DEVICES   │
   └──────────────┘          └──────────────┘          └──────────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │     CHANNELS        │ ← Submódulos
                          │                     │
                          │  ┌─────┬─────┬────┐ │
                          │  │     │     │    │ │
                          │  ▼     ▼     ▼    │ │
                          │ IN_APP PUSH EMAIL │ │
                          │ SMS    WAPP       │ │
                          │  │     │     │    │ │
                          │  └─────┴─────┴────┘ │
                          └─────────────────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │       JOBS          │
                          └─────────────────────┘
```

---

## 🚀 ORDEM DE IMPLEMENTAÇÃO

```
SEMANA 1
├── Dia 1-2: Notifications (principal)
│   └── Schema, Service, Controller, DTOs
│
├── Dia 3: Templates
│   └── CRUD, preview, duplicate
│
├── Dia 4: Preferences + Devices
│   └── Preferências do usuário, tokens
│
└── Dia 5: Channels (base)
    └── Interface, In-App (WebSocket)

SEMANA 2
├── Dia 1-2: Channels (Push + Email)
│   └── Firebase FCM, SendGrid/Resend
│
├── Dia 3: Channels (SMS + WhatsApp)
│   └── Twilio, Z-API
│
├── Dia 4: Jobs
│   └── Cleanup, retry, stats
│
└── Dia 5: Integração + Testes
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Notifications (Principal)
- [ ] Schema Prisma (Notification, Recipient, Channel)
- [ ] DTOs (Create, Send, Schedule)
- [ ] Service com lógica principal
- [ ] Controller com endpoints
- [ ] Module registrado

### Templates
- [ ] Schema Prisma (NotificationTemplate)
- [ ] CRUD completo
- [ ] Preview com variáveis
- [ ] Duplicate

### Preferences
- [ ] Schema Prisma (UserNotificationPreference)
- [ ] CRUD por usuário
- [ ] Update por canal

### Devices
- [ ] Schema Prisma (DeviceToken)
- [ ] Register/unregister
- [ ] Cleanup de inativos

### Channels
- [ ] Interface base
- [ ] In-App (WebSocket gateway)
- [ ] Push (FCM provider)
- [ ] Email (SendGrid provider)
- [ ] SMS (Twilio provider)
- [ ] WhatsApp (Z-API provider)

### Jobs
- [ ] Cleanup job
- [ ] Retry job
- [ ] Stats job

---

## 📝 PENDÊNCIAS

| # | Pergunta | Status |
|---|----------|--------|
| P1 | Quais providers usar? | ABERTA |
| P2 | Firebase já configurado? | VERIFICAR |
| P3 | SendGrid/Twilio account? | ABERTA |

---

**FIM DOS MÓDULOS RELACIONADOS**