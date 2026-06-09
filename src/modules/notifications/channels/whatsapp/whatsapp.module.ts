import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { NotificationsWhatsAppService } from './whatsapp.service';
import { ZApiProvider } from './providers/zapi.provider';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE - WhatsApp Notifications
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [PrismaModule],
  providers: [NotificationsWhatsAppService, ZApiProvider],
  exports: [NotificationsWhatsAppService, ZApiProvider],
})
export class NotificationsWhatsAppModule {}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { NotificationsWhatsAppService } from './whatsapp.service';
export { ZApiProvider } from './providers/zapi.provider';
