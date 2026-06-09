# 📋 ESCOPO: Notifications (Sistema de Notificações)

**Versão:** 1.0  
**Data:** 2026-06-08  
**Status:** RASCUNHO

---

## 1. IDENTIFICAÇÃO

| Campo | Valor |
|-------|-------|
| Domínio | `notifications` |
| Entidade | `Notification` |
| Descrição | Sistema centralizado de notificações que gerencia envio multi-canal (in-app, push, email, SMS, WhatsApp) com templates, preferências de usuário e tracking de entrega. |
| Módulo pai | Nenhum |
| Dependências | `companies`, `users` (existentes) |

---

## 2. ARQUITETURA DO SISTEMA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NOTIFICATION GATEWAY                                 │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      NOTIFICATION MODULE                                │ │
│  │                                                                          │ │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │   │   In-App    │  │    Push     │  │    Email    │  │     SMS     │   │ │
│  │   │ (WebSocket) │  │  (Firebase) │  │  (SMTP)     │  │  (Provider) │   │ │
│  │   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │ │
│  │          │                │                │                │           │ │
│  │          └────────────────┼────────────────┼────────────────┘           │ │
│  │                           │                │                           │ │
│  │                           ▼                ▼                           │ │
│  │                   ┌───────────────┐ ┌───────────────┐                  │ │
│  │                   │   WhatsApp    │ │    Templates  │                  │ │
│  │                   │  (Provider)   │ │   (Hub)       │                  │ │
│  │                   └───────────────┘ └───────────────┘                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                       PROVIDER ADAPTERS                                  │ │
│  │                                                                          │ │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │   │ Firebase │  │  SendGrid│  │  Twilio  │  │  Z-API   │  │  AWS SES │  │ │
│  │   │    FCM   │  │  /Resend │  │  /Vonage │  │  /另API   │  │  /Postmark│  │ │
│  │   └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. ENTIDADES

### 3.1 Notification (Notificação Principal)

| Campo | Tipo | Obrigatório | Padrão | Descrição |
|-------|------|-------------|--------|-----------|
| id | uuid | sim | auto | ID único |
| title | string | sim | - | Título da notificação |
| body | text | sim | - | Corpo/mensagem |
| data | json | não | - | Dados extras (payload) |
| type | enum | sim | GENERAL | Tipo de notificação |
| priority | enum | sim | NORMAL | Prioridade |
| scheduledAt | datetime | não | - | Agendar envio |
| sentAt | datetime | não | - | Data do envio |
| expiresAt | datetime | não | - | Expiração |
| companyId | uuid | não | - | Empresa (null = global) |
| createdByUserId | uuid | não | - | Quem criou |
| imageUrl | string | não | - | URL da imagem (thumbnail) |
| actionUrl | string | não | - | URL de ação ao clicar |
| actionType | enum | não | - | Tipo de ação |
| isRead | boolean | sim | false | Já foi lida (para in-app) |
| readAt | datetime | não | - | Quando foi lida |
| clickAt | datetime | não | - | Quando foi clicada |
| createdAt | datetime | sim | auto | Criação |
| updatedAt | datetime | sim | auto | Atualização |
| deletedAt | datetime | não | - | Exclusão |

### 3.2 NotificationRecipient (Destinatários)

| Campo | Tipo | Obrigatório | Padrão | Descrição |
|-------|------|-------------|--------|-----------|
| id | uuid | sim | auto | ID único |
| userId | uuid | sim | - | Usuário destinatário |
| channels | json | sim | - | Canais ativos para este usuário |
| isRead | boolean | sim | false | Foi lida |
| readAt | datetime | não | - | Quando foi lida |
| isDelivered | boolean | sim | false | Foi entregue |
| deliveredAt | datetime | não | - | Quando foi entregue |
| failedAt | datetime | não | - | Quando falhou |
| failureReason | string | não | - | Motivo da falha |
| notificationId | uuid | sim | - | Notificação pai |
| createdAt | datetime | sim | auto | Criação |
| updatedAt | datetime | sim | auto | Atualização |
| deletedAt | datetime | não | - | Exclusão |

### 3.3 NotificationChannel (Canais de Envio)

| Campo | Tipo | Obrigatório | Padrão | Descrição |
|-------|------|-------------|--------|-----------|
| id | uuid | sim | auto | ID único |
| channel | enum | sim | - | Canal (IN_APP, PUSH, EMAIL, SMS, WHATSAPP) |
| provider | string | não | - | Provider específico |
| providerMessageId | string | não | - | ID no provider |
| status | enum | sim | PENDING | Status do envio |
| sentAt | datetime | não | - | Quando foi enviado |
| deliveredAt | datetime | não | - | Quando foi entregue |
| failedAt | datetime | não | - | Quando falhou |
| failureReason | string | não | - | Motivo da falha |
| retryCount | int | sim | 0 | Tentativas |
| cost | decimal | não | - | Custo do envio |
| notificationId | uuid | sim | - | Notificação pai |
| recipientId | uuid | sim | - | Destinatário pai |
| companyId | uuid | não | - | Empresa |
| createdAt | datetime | sim | auto | Criação |
| updatedAt | datetime | sim | auto | Atualização |

### 3.4 NotificationTemplate (Templates)

| Campo | Tipo | Obrigatório | Padrão | Descrição |
|-------|------|-------------|--------|-----------|
| id | uuid | sim | auto | ID único |
| name | string | sim | - | Nome do template |
| code | string | sim | - | Código único |
| channel | enum | sim | - | Canal (IN_APP, PUSH, EMAIL, SMS, WHATSAPP) |
| title | string | não | - | Título (para push/email) |
| body | text | sim | - | Corpo com placeholders |
| variables | json | sim | - | Variáveis disponíveis |
| subject | string | não | - | Assunto (para email) |
| footer | string | não | - | Rodapé |
| imageUrl | string | não | - | URL da imagem |
| actionText | string | não | - | Texto do botão |
| actionUrl | string | não | - | URL do botão |
| isActive | boolean | sim | true | Ativo |
| companyId | uuid | não | - | Empresa (null = global) |
| createdAt | datetime | sim | auto | Criação |
| updatedAt | datetime | sim | auto | Atualização |
| deletedAt | datetime | não | - | Exclusão |

### 3.5 UserNotificationPreference (Preferências do Usuário)

| Campo | Tipo | Obrigatório | Padrão | Descrição |
|-------|------|-------------|--------|-----------|
| id | uuid | sim | auto | ID único |
| userId | uuid | sim | - | Usuário |
| channel | enum | sim | - | Canal |
| enabled | boolean | sim | true | Ativo |
| frequency | enum | sim | INSTANT | Frequência |
| quietHoursStart | time | não | - | Início silêncio |
| quietHoursEnd | time | não | - | Fim silêncio |
| notificationTypes | json | não | - | Tipos permitidos |
| companyId | uuid | não | - | Empresa |
| createdAt | datetime | sim | auto | Criação |
| updatedAt | datetime | sim | auto | Atualização |

### 3.6 DeviceToken (Tokens de Dispositivo)

| Campo | Tipo | Obrigatório | Padrão | Descrição |
|-------|------|-------------|--------|-----------|
| id | uuid | sim | auto | ID único |
| userId | uuid | sim | - | Usuário |
| token | string | sim | - | Token do dispositivo |
| type | enum | sim | - | Tipo (IOS, ANDROID, WEB) |
| provider | enum | sim | FCM | Provider (FCM, APNS, etc) |
| isActive | boolean | sim | true | Ativo |
| lastUsedAt | datetime | não | - | Último uso |
| deviceInfo | json | não | - | Info do dispositivo |
| companyId | uuid | não | - | Empresa |
| createdAt | datetime | sim | auto | Criação |
| updatedAt | datetime | sim | auto | Atualização |

---

## 4. ENUMS

```typescript
// Tipo de Notificação
enum NotificationType {
  GENERAL = 'GENERAL',           // Geral
  BOOKING = 'BOOKING',           // Agendamento
  PAYMENT = 'PAYMENT',           // Pagamento
  REMINDER = 'REMINDER',         // Lembrete
  PROMOTION = 'PROMOTION',       // Promoção
  SYSTEM = 'SYSTEM',            // Sistema
  SECURITY = 'SECURITY',         // Segurança
  SUPPORT = 'SUPPORT',          // Suporte
  MARKETING = 'MARKETING',      // Marketing
  SOCIAL = 'SOCIAL',             // Social
}

// Prioridade
enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Canal
enum NotificationChannel {
  IN_APP = 'IN_APP',            // Dentro do app (WebSocket)
  PUSH = 'PUSH',                // Push notification (FCM/APNS)
  EMAIL = 'EMAIL',              // Email
  SMS = 'SMS',                  // SMS
  WHATSAPP = 'WHATSAPP',        // WhatsApp
}

// Status do Canal
enum ChannelStatus {
  PENDING = 'PENDING',
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
}

// Tipo de Dispositivo
enum DeviceType {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB',
  DESKTOP = 'DESKTOP',
}

// Provider de Push
enum PushProvider {
  FCM = 'FCM',                  // Firebase Cloud Messaging
  APNS = 'APNS',                // Apple Push Notification
  WEB_PUSH = 'WEB_PUSH',        // Web Push
}

// Frequência
enum NotificationFrequency {
  INSTANT = 'INSTANT',          // Imediato
  DAILY = 'DAILY',             // Resumo diário
  WEEKLY = 'WEEKLY',           // Resumo semanal
  NONE = 'NONE',               // Desativado
}

// Ação
enum NotificationActionType {
  NONE = 'NONE',
  DEEP_LINK = 'DEEP_LINK',
  URL = 'URL',
  SCREEN = 'SCREEN',
  CALL = 'CALL',
}
```

---

## 5. REGRAS DE NEGÓCIO

### 5.1 Validações

| # | Regra | Descrição | Prioridade |
|---|-------|-----------|------------|
| V1 | Título obrigatório | Título deve ter entre 3 e 200 caracteres | ALTA |
| V2 | Corpo obrigatório | Corpo deve ter entre 1 e 2000 caracteres | ALTA |
| V3 | Destinatário válido | Deve ter pelo menos um destinatário | ALTA |
| V4 | Canal ativo | Só pode enviar por canais ativos no usuário | ALTA |
| V5 | Template válido | Se usar template, deve existir e estar ativo | ALTA |
| V6 | Agendamento válido | Se agendar, deve ser no futuro | MÉDIA |

### 5.2 Restrições

| # | Regra | Descrição | Tratamento |
|---|-------|-----------|------------|
| R1 | Rate limit por empresa | Limite de envios por minuto/hora | Queue + throttle |
| R2 | Preferência do usuário | Respeitar preferências de canal/frequência | Filtrar antes de enviar |
| R3 | Quiet hours | Não enviar durante horário de silêncio | Adiar para depois |
| R4 | Opt-out | Respeitar descadastro | Não enviar |
| R5 | Custo máximo | Limite de gasto por mês | Alerta + bloqueio |

### 5.3 Automatizações

| # | Regra | Ação | Quando |
|---|-------|------|--------|
| A1 | Marcar como lida | atualizar isRead = true | Ao abrir |
| A2 | Marcar entregue | atualizar isDelivered = true | Confirmação provider |
| A3 | Retry | Tentar novamente se falhou | A cada 5min, máx 3x |
| A4 | Cleanup | Excluir notificações expiradas | Daily cron |
| A5 | Tracking | Registrar métricas | A cada status |

### 5.4 Campos Calculados

| Campo | Cálculo |
|-------|---------|
| deliveryRate | delivered / sent * 100 |
| readRate | read / delivered * 100 |
| avgDeliveryTime | avg(deliveredAt - sentAt) |

---

## 6. FLUXO DE ENVIO

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ENVIO DE NOTIFICAÇÃO                           │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐
  │ SOLICITA │ ───────────────────────────────────────────────────────────────┐
  └────┬─────┘                                                                   │
       │                                                                      │
       ▼                                                                      │
  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐           │
  │ VALIDAR  │ ──▶ │ PREFS    │ ──▶ │ TEMPLATE │ ──▶ │ FILTRAR  │           │
  │ (campos) │     │ (usuario)│     │ (apply)  │     │ (canais) │           │
  └────┬─────┘     └──────────┘     └──────────┘     └────┬─────┘           │
       │                                                  │                   │
       │     ┌─────────────────────────────────────────────┘                   │
       │     │                                                                  │
       ▼     ▼                                                                  │
  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐             │
  │ CRIAR    │ ──▶ │ QUEUE    │ ──▶ │ PROCESS  │ ──▶ │ PROVIDER│             │
  │ NOTIF    │     │ (bull)   │     │ (worker) │     │ (send)   │             │
  └──────────┘     └──────────┘     └──────────┘     └────┬─────┘             │
                                                          │                   │
       ┌───────────────────────────────────────────────────┘                   │
       │                                                                      │
       ▼                                                                      │
  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐             │
  │ TRACK    │ ──▶ │ WEBHOOK  │ ──▶ │ METRICS  │ ──▶ │ STORAGE │             │
  │ (status) │     │ (callback)│     │ (stats) │     │ (log)   │             │
  └──────────┘     └──────────┘     └──────────┘     └──────────┘             │
```

---

## 7. PROVIDERS

### 7.1 Push Notifications

| Provider | Descrição | Custo |
|----------|-----------|-------|
| Firebase FCM | Android, iOS, Web | Gratuito (até 500k) |
| Apple APNS | iOS only | Gratuito |

### 7.2 Email

| Provider | Descrição | Custo |
|----------|-----------|-------|
| SendGrid | Mais usado | $0.10/1k emails |
| Resend | Moderno, fácil | $0.02/1k emails |
| AWS SES | Barato | $0.10/1k emails |
| Postmark | Confiável | $0.01/1k emails |

### 7.3 SMS

| Provider | Descrição | Custo |
|----------|-----------|-------|
| Twilio | Mais usado | $0.0079/SMS |
| Vonage | Alternativa | $0.005/SMS |
| Z-API | Brasil | R$0.15/SMS |

### 7.4 WhatsApp

| Provider | Descrição | Custo |
|----------|-----------|-------|
| Z-API | Brasil | R$0.35/mensagem |
| Twilio WA | Global | $0.05/mensagem |
| 360dialog | Brasil | R$0.25/mensagem |

---

## 8. FUNCIONALIDADES

### 8.1 CRUD Notifications

| Operação | SYSTEM_ADMIN | ADMIN | USER | Descrição |
|---------|-------------|-------|------|-----------|
| Criar | ✅ | ✅ | ❌ | Criar notificação |
| Ler | ✅ | ✅ | ✅ (próprio) | Ver notificação |
| Listar | ✅ | ✅ | ✅ (próprio) | Listar notificações |
| Marcar lida | ❌ | ❌ | ✅ | Marcar como lida |
| Apagar | ✅ | ✅ | ❌ | Soft delete |

### 8.2 Templates

| Operação | SYSTEM_ADMIN | ADMIN | Descrição |
|---------|-------------|-------|-----------|
| Criar | ✅ | ✅ | Criar template |
| Editar | ✅ | ✅ | Editar template |
| Listar | ✅ | ✅ | Listar templates |
| Preview | ✅ | ✅ | Visualizar |
| Duplicar | ✅ | ✅ | Duplicar |

### 8.3 Endpoints Customizados

| Endpoint | Método | Descrição | Roles |
|----------|--------|-----------|-------|
| `/send` | POST | Enviar notificação | ADMIN, SYSTEM_ADMIN |
| `/send-to-user/:id` | POST | Enviar para usuário específico | ADMIN |
| `/send-to-all` | POST | Enviar para todos os usuários | SYSTEM_ADMIN |
| `/schedule` | POST | Agendar notificação | ADMIN, SYSTEM_ADMIN |
| `/cancel/:id` | DELETE | Cancelar agendada | ADMIN |
| `/stats` | GET | Estatísticas | ADMIN, SYSTEM_ADMIN |
| `/stats/delivery` | GET | Taxa de entrega | ADMIN, SYSTEM_ADMIN |
| `/stats/engagement` | GET | Engajamento | ADMIN, SYSTEM_ADMIN |
| `/unread/count` | GET | Contagem não lidas | USER |
| `/mark-all-read` | POST | Marcar todas como lidas | USER |
| `/preferences` | GET/PUT | Preferências do usuário | USER |
| `/tokens` | POST/DELETE | Gerenciar tokens | USER |
| `/templates` | GET/POST/PUT | CRUD templates | ADMIN |
| `/templates/:id/preview` | POST | Preview template | ADMIN |

### 8.4 Webhooks/Callbacks

| Evento | Descrição |
|--------|-----------|
| `notification.sent` | Notificação enviada |
| `notification.delivered` | Notificação entregue |
| `notification.read` | Notificação lida |
| `notification.clicked` | Notificação clicada |
| `notification.failed` | Falha no envio |
| `notification.bounced` | Email rejeitado |
| `notification.unsubscribed` | Usuário descadastrou |

---

## 9. ESTRUTURA DE MÓDULOS

```
src/modules/notifications/
├── notifications.module.ts                    ← Module raiz
│
├── common/                                   ← Componentes compartilhados
│   ├── dto/
│   │   ├── create-notification.dto.ts
│   │   ├── send-notification.dto.ts
│   │   └── notification-stats.dto.ts
│   ├── interfaces/
│   │   ├── notification-provider.interface.ts
│   │   ├── notification-payload.interface.ts
│   │   └── notification-result.interface.ts
│   ├── enums/
│   │   └── notification.enums.ts
│   └── types/
│       └── notification.types.ts
│
├── notifications/                            ← Módulo principal
│   ├── notifications.service.ts
│   ├── notifications.controller.ts
│   └── notifications.module.ts
│
├── templates/                                ← Módulo de templates
│   ├── templates.service.ts
│   ├── templates.controller.ts
│   └── templates.module.ts
│
├── preferences/                              ← Módulo de preferências
│   ├── preferences.service.ts
│   ├── preferences.controller.ts
│   └── preferences.module.ts
│
├── devices/                                  ← Módulo de tokens
│   ├── devices.service.ts
│   ├── devices.controller.ts
│   └── devices.module.ts
│
├── channels/                                ← Submódulos de canais
│   ├── channels.module.ts
│   │
│   ├── in-app/                              ← In-app (WebSocket)
│   │   ├── in-app.service.ts
│   │   └── in-app.gateway.ts
│   │
│   ├── push/                                ← Push (Firebase)
│   │   ├── push.module.ts
│   │   ├── push.service.ts
│   │   └── providers/
│   │       └── fcm.provider.ts
│   │
│   ├── email/                               ← Email
│   │   ├── email.module.ts
│   │   ├── email.service.ts
│   │   └── providers/
│   │       ├── sendgrid.provider.ts
│   │       └── resend.provider.ts
│   │
│   ├── sms/                                 ← SMS
│   │   ├── sms.module.ts
│   │   ├── sms.service.ts
│   │   └── providers/
│   │       ├── twilio.provider.ts
│   │       └── zapi.provider.ts
│   │
│   └── whatsapp/                            ← WhatsApp
│       ├── whatsapp.module.ts
│       ├── whatsapp.service.ts
│       └── providers/
│           └── zapi.provider.ts
│
└── jobs/                                    ← Jobs (cron)
    ├── notification-cleanup.job.ts
    ├── notification-retry.job.ts
    └── notification-stats.job.ts
```

---

## 10. EXEMPLOS DE USO

### 10.1 Enviar notificação simples

```typescript
await notificationService.send({
  title: 'Olá, João!',
  body: 'Você tem uma nova mensagem.',
  type: NotificationType.GENERAL,
  priority: NotificationPriority.NORMAL,
  channels: [NotificationChannel.PUSH, NotificationChannel.EMAIL],
  userIds: ['user-id-1', 'user-id-2'],
  data: { messageId: 'msg-123' },
});
```

### 10.2 Enviar com template

```typescript
await notificationService.sendWithTemplate({
  templateCode: 'booking_confirmation',
  userIds: ['user-id-1'],
  variables: {
    customerName: 'João Silva',
    serviceName: 'Corte de cabelo',
    dateTime: '10/06/2024 às 14:00',
  },
});
```

### 10.3 Agendar notificação

```typescript
await notificationService.schedule({
  title: 'Lembrete de consulta',
  body: 'Sua consulta é amanhã às 14h',
  channels: [NotificationChannel.PUSH],
  userIds: ['user-id-1'],
  scheduledAt: new Date('2024-06-09T14:00:00'),
});
```

### 10.4 Template de email

```json
{
  "name": "Confirmação de Agendamento",
  "code": "booking_confirmation",
  "channel": "EMAIL",
  "subject": "Sua consulta foi confirmada!",
  "body": "Olá {{customerName}}, sua consulta de {{serviceName}} está confirmada para {{dateTime}}. Obrigado por escolher a {{companyName}}!",
  "variables": ["customerName", "serviceName", "dateTime", "companyName"]
}
```

---

## 11. PENDÊNCIAS / DÚVIDAS

| # | Pergunta | Status |
|---|----------|--------|
| P1 | Quais providers exatamente usar? | ABERTA |
| P2 | Integração com analytics (Firebase Analytics)? | ABERTA |
| P3 | Rate limits específicos por empresa? | ABERTA |
| P4 | histórico de notificações (mover para archival)? | ABERTA |

---

## 12. HISTÓRICO DE ALTERAÇÕES

| Versão | Data | Alteração | Autor |
|--------|------|-----------|-------|
| 1.0 | 2026-06-08 | Criação inicial | Claude (AI) |

---

## 13. APROVAÇÃO

| Papel | Nome | Data | Assinatura |
|-------|------|------|------------|
| Product Owner | | | |
| Tech Lead | | | |
| UX/UI | | | |

---

**FIM DO ESCOPO**