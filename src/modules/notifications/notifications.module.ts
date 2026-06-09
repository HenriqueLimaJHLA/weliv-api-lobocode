import { Module } from '@nestjs/common';
import { NotificationsModule } from './notifications/notifications.module';
import { NotificationsChannelsModule } from './channels/channels.module';

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS MODULE - Módulo Raiz
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [
    NotificationsModule,
    NotificationsChannelsModule,
  ],
  exports: [
    NotificationsModule,
    NotificationsChannelsModule,
  ],
})
export class NotificationsModule {}
