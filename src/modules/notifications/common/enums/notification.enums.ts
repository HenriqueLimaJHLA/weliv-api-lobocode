// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS - Notificações
// ═══════════════════════════════════════════════════════════════════════════════

export enum NotificationType {
  GENERAL = 'GENERAL',
  BOOKING = 'BOOKING',
  PAYMENT = 'PAYMENT',
  REMINDER = 'REMINDER',
  PROMOTION = 'PROMOTION',
  SYSTEM = 'SYSTEM',
  SECURITY = 'SECURITY',
  SUPPORT = 'SUPPORT',
  MARKETING = 'MARKETING',
  SOCIAL = 'SOCIAL',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
}

export enum ChannelStatus {
  PENDING = 'PENDING',
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
}

export enum DeviceType {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB',
  DESKTOP = 'DESKTOP',
}

export enum PushProvider {
  FCM = 'FCM',
  APNS = 'APNS',
  WEB_PUSH = 'WEB_PUSH',
}

export enum NotificationFrequency {
  INSTANT = 'INSTANT',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  NONE = 'NONE',
}

export enum NotificationActionType {
  NONE = 'NONE',
  DEEP_LINK = 'DEEP_LINK',
  URL = 'URL',
  SCREEN = 'SCREEN',
  CALL = 'CALL',
}
