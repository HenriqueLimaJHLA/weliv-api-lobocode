// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES - Provider de Notificações
// ═══════════════════════════════════════════════════════════════════════════════

import { NotificationChannel } from '../enums/notification.enums';

// ═══════════════════════════════════════════════════════════════════════════════
// RESULT
// ═══════════════════════════════════════════════════════════════════════════════

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
  provider?: string;
}

export interface NotificationDeliveryReport {
  channel: NotificationChannel;
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUSH PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

export interface PushPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  image?: string;
  icon?: string;
  badge?: number;
  sound?: string;
  priority?: 'high' | 'normal';
  ttl?: number;
  clickAction?: string;
}

export interface PushProviderInterface {
  readonly name: string;
  readonly provider: string;

  send(payload: PushPayload): Promise<NotificationResult>;
  sendMultiple(payloads: PushPayload[]): Promise<NotificationResult[]>;
  validateToken(token: string): Promise<boolean>;
  unsubscribe(token: string): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

export interface EmailPayload {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  tags?: string[];
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  cid?: string;
}

export interface EmailProviderInterface {
  readonly name: string;

  send(payload: EmailPayload): Promise<NotificationResult>;
  sendTemplate(templateId: string, payload: EmailPayload): Promise<NotificationResult>;
  validateEmail(email: string): Promise<boolean>;
  unsubscribe(email: string): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMS PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

export interface SmsPayload {
  to: string;
  message: string;
  from?: string;
}

export interface SmsProviderInterface {
  readonly name: string;

  send(payload: SmsPayload): Promise<NotificationResult>;
  sendMultiple(payloads: SmsPayload[]): Promise<NotificationResult[]>;
  validatePhone(phone: string): Promise<boolean>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WHATSAPP PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

export interface WhatsAppPayload {
  to: string;
  message: string;
  mediaUrl?: string;
  mediaType?: string;
  templateName?: string;
  templateVariables?: Record<string, string>;
}

export interface WhatsAppProviderInterface {
  readonly name: string;

  send(payload: WhatsAppPayload): Promise<NotificationResult>;
  sendTemplate(
    templateName: string,
    variables: Record<string, string>,
    payload: WhatsAppPayload,
  ): Promise<NotificationResult>;
  validatePhone(phone: string): Promise<boolean>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// IN-APP PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

export interface InAppPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
  actionType?: string;
}

export interface InAppProviderInterface {
  readonly name: string;

  send(payload: InAppPayload): Promise<void>;
  sendMultiple(payloads: InAppPayload[]): Promise<void>;
  emitToUser(userId: string, event: string, data: any): Promise<void>;
  emitToRoom(room: string, event: string, data: any): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION SERVICE INTERFACE
// ═══════════════════════════════════════════════════════════════════════════════

export interface NotificationServiceInterface {
  send(params: SendNotificationParams): Promise<NotificationResult[]>;
  sendToUser(userId: string, params: SendNotificationParams): Promise<NotificationResult[]>;
  sendToUsers(userIds: string[], params: SendNotificationParams): Promise<NotificationResult[]>;
  schedule(params: ScheduleNotificationParams): Promise<string>;
  cancel(notificationId: string): Promise<void>;
  markAsRead(recipientId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
}

export interface SendNotificationParams {
  title: string;
  body: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
  actionType?: NotificationActionType;
  scheduledAt?: Date;
  expiresAt?: Date;
  companyId?: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
}

export interface ScheduleNotificationParams extends SendNotificationParams {
  scheduledAt: Date;
}
