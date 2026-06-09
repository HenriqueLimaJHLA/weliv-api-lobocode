import { Module } from '@nestjs/common';
import { NotificationsInAppModule } from './in-app/in-app.module';
import { NotificationsPushModule } from './push/push.module';
import { NotificationsEmailModule } from './email/email.module';
import { NotificationsSmsModule } from './sms/sms.module';
import { NotificationsWhatsAppModule } from './whatsapp/whatsapp.module';

// ═══════════════════════════════════════════════════════════════════════════════
// CHANNELS MODULE - Módulo Agregador de Canais
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [
    NotificationsInAppModule,
    NotificationsPushModule,
    NotificationsEmailModule,
    NotificationsSmsModule,
    NotificationsWhatsAppModule,
  ],
  exports: [
    NotificationsInAppModule,
    NotificationsPushModule,
    NotificationsEmailModule,
    NotificationsSmsModule,
    NotificationsWhatsAppModule,
  ],
})
export class NotificationsChannelsModule {}
