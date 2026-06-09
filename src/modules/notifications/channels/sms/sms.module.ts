import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { NotificationsSmsService } from './sms.service';
import { TwilioProvider } from './providers/twilio.provider';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE - SMS Notifications
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [PrismaModule],
  providers: [NotificationsSmsService, TwilioProvider],
  exports: [NotificationsSmsService, TwilioProvider],
})
export class NotificationsSmsModule {}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { NotificationsSmsService } from './sms.service';
export { TwilioProvider } from './providers/twilio.provider';
