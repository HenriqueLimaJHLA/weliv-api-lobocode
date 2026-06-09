import { Module } from '@nestjs/common';
import { NotificationsCoreModule } from './notifications/notifications.module';
import { NotificationsChannelsModule } from './channels/channels.module';

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS MODULE - Módulo Raiz
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [
    NotificationsCoreModule,
    NotificationsChannelsModule,
  ],
  exports: [
    NotificationsCoreModule,
    NotificationsChannelsModule,
  ],
})
export class NotificationsModule {}
