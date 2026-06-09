import {
  PROJECT_CORE_CASL_TO_MODEL_MAPPING,
  PROJECT_CORE_ENTITY_MAPPING,
} from './entities.core.config';

export const PROJECT_PLUGIN_ENTITY_MAPPING = {
  reminder: 'Reminder',
  service: 'Service',
  review: 'Review',
  favorite: 'Favorite',
  booking: 'Booking',
  payment: 'Payment',
  payout: 'Payout',
  coupon: 'Coupon',
  ticket: 'Ticket',
  ticketReply: 'TicketReply',
  incident: 'Incident',
  incidentUpdate: 'IncidentUpdate',
  webhook: 'Webhook',
  webhookLog: 'WebhookLog',
  availability: 'Availability',
  availabilityException: 'AvailabilityException',
  kycDocument: 'KycDocument',
  setting: 'Setting',
  notification: 'Notification',
  notificationRecipient: 'NotificationRecipient',
  notificationChannelLog: 'NotificationChannelLog',
  notificationTemplate: 'NotificationTemplate',
  userNotificationPreference: 'UserNotificationPreference',
  deviceToken: 'DeviceToken',
  file: 'File',
} as const;

export const PROJECT_PLUGIN_CASL_TO_MODEL_MAPPING = {
  Reminder: 'reminder',
  Service: 'service',
  Review: 'review',
  Favorite: 'favorite',
  Booking: 'booking',
  Payment: 'payment',
  Payout: 'payout',
  Coupon: 'coupon',
  Ticket: 'ticket',
  TicketReply: 'ticketReply',
  Incident: 'incident',
  IncidentUpdate: 'incidentUpdate',
  Webhook: 'webhook',
  WebhookLog: 'webhookLog',
  Availability: 'availability',
  AvailabilityException: 'availabilityException',
  KycDocument: 'kycDocument',
  Setting: 'setting',
  File: 'file',
} as const;

export const PROJECT_ENTITY_MAPPING = {
  ...PROJECT_CORE_ENTITY_MAPPING,
  ...PROJECT_PLUGIN_ENTITY_MAPPING,
} as const;

export const PROJECT_CASL_TO_MODEL_MAPPING = {
  ...PROJECT_CORE_CASL_TO_MODEL_MAPPING,
  ...PROJECT_PLUGIN_CASL_TO_MODEL_MAPPING,
} as const;
