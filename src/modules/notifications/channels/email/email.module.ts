import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { NotificationsEmailService } from './email.service';
import { SendGridProvider } from './providers/sendgrid.provider';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE - Email Notifications
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [PrismaModule],
  providers: [NotificationsEmailService, SendGridProvider],
  exports: [NotificationsEmailService, SendGridProvider],
})
export class NotificationsEmailModule {}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { NotificationsEmailService } from './email.service';
export { SendGridProvider } from './providers/sendgrid.provider';
