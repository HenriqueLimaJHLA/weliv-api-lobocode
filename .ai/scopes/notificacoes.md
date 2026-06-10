# 📋 Especificação: Notificações (Notifications)

## Entidade
- **Domínio:** notifications
- **Tabela Prisma:** `Notification`
- **Camadas:** administrator, user

---

## Regras de Negócio

### Canais
- [ ] IN_APP: notificação no sistema
- [ ] PUSH: push notification (FCM/APNS)
- [ ] EMAIL: email
- [ ] SMS: SMS (Twilio)
- [ ] WHATSAPP: WhatsApp (Z-API)

### Tipos
- [ ] GENERAL: geral
- [ ] BOOKING: agendamento
- [ ] PAYMENT: pagamento
- [ ] REMINDER: lembrete
- [ ] PROMOTION: promoção
- [ ] SYSTEM: sistema

### Prioridade
- [ ] LOW: baixa
- [ ] NORMAL: normal
- [ ] HIGH: alta
- [ ] URGENT: urgente

### Status de Entrega
- [ ] PENDING: aguardando
- [ ] SENDING: enviando
- [ ] SENT: enviado
- [ ] DELIVERED: entregue
- [ ] FAILED: falhou

### Preferências
- [ ] Usuário pode configurar frequência
- [ ] Horário de silêncio configurável
- [ ] Canais desabilitados por usuário

---

## Campos (Prisma)

```prisma
model Notification {
  id          String  @id @default(uuid())
  title       String
  body        String
  type        NotificationType @default(GENERAL)
  priority    NotificationPriority @default(NORMAL)
  data Json?
 imageUrl    String?
  actionUrl   String?
  actionType  NotificationActionType?
  
  scheduledAt DateTime?
  expiresAt   DateTime?
  
  companyId   String?
  company Company? @relation(...)
  
  recipients NotificationRecipient[]
  channels NotificationChannelLog[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
}

model NotificationRecipient {
  id String  @id @default(uuid())
  notificationId String
  notification  Notification @relation(...)
  userId String
  user          User @relation(...)
  readAt        DateTime?
  createdAt     DateTime @default(now())
}

model NotificationChannelLog {
  id            String  @id @default(uuid())
  notificationId String
  notification  Notification @relation(...)
  channel       NotificationChannel
  status        ChannelStatus @default(PENDING)
  messageId     String?
  error String?
  sentAt        DateTime?
  deliveredAt   DateTime?
  createdAt     DateTime @default(now())
}

model UserNotificationPreference {
  id            String  @id @default(uuid())
  userId        String  @unique
  user User @relation(...)
  channel NotificationChannel
  enabled       Boolean @default(true)
  frequency     NotificationFrequency @default(INSTANT)
  quietHoursStart String?
  quietHoursEnd   String?
  allowedTypes    String[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model DeviceToken {
  id String  @id @default(uuid())
  userId        String
  user          User @relation(...)
  token         String
  type          DeviceType
  deviceInfo    Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?
  
  @@unique([userId, token, type])
}
```

---

## Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/admin/notifications` | Criar |
| POST | `/admin/notifications/to-users` | Enviar para usuários |
| POST | `/admin/notifications/to-all` | Enviar para todos |
| GET | `/admin/notifications` | Listar |
| GET | `/admin/notifications/:id` | Detalhes |
| PATCH | `/admin/notifications/:id` | Atualizar |
| DELETE | `/admin/notifications/:id` | Deletar |
| GET | `/admin/notifications/stats` | Estatísticas |
| GET | `/user/notifications` | Minhas notificações |
| PATCH | `/user/notifications/:id/read` | Marcar como lida |
| GET | `/user/notifications/preferences` | Preferências |
| PATCH | `/user/notifications/preferences` | Atualizar preferências |
| POST | `/user/devices` | Registrar device |

---

## Relacionamentos

- `Notification.company` → `Company?`
- `Notification.recipients` → `NotificationRecipient[]`
- `Notification.channels` → `NotificationChannelLog[]`
- `UserNotificationPreference.user` → `User`
- `DeviceToken.user` → `User`

---

## Status
- [x] Criado
- [x] Implementado
- [ ] Testado
