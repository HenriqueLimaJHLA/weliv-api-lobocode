import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { NotificationsPushService } from './push.service';
import { FcmProvider } from './providers/fcm.provider';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE - Push Notifications
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [PrismaModule],
  providers: [NotificationsPushService, FcmProvider],
  exports: [NotificationsPushService, FcmProvider],
})
export class NotificationsPushModule {}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { NotificationsPushService } from './push.service';
export { FcmProvider } from './providers/fcm.provider';
