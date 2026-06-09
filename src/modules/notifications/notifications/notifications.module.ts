import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE - Notifications Core
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsCoreModule {}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { NotificationsService } from './notifications.service';
export { NotificationsController } from './notifications.controller';
