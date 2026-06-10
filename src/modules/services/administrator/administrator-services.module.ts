import { Module } from '@nestjs/common';
import { AdministratorServicesService } from './administrator-services.service';
import { AdministratorServicesController } from './administrator-services.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE - Services (Administrator)
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [
    UniversalModule,
    NotificationsModule,
  ],
  controllers: [AdministratorServicesController],
  providers: [AdministratorServicesService],
  exports: [AdministratorServicesService],
})
export class AdministratorServicesModule {}