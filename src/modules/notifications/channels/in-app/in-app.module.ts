import { Module, Global } from '@nestjs/common';
import { NotificationsInAppService } from './in-app.service';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE - In-App (WebSocket)
// ═══════════════════════════════════════════════════════════════════════════════

@Global()
@Module({
  providers: [NotificationsInAppService],
  exports: [NotificationsInAppService],
})
export class NotificationsInAppModule {}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { NotificationsInAppService } from './in-app.service';
