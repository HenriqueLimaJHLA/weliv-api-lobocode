import { Module } from '@nestjs/common';
import { AdministratorProfessionalsService } from './administrator-professionals.service';
import { AdministratorProfessionalsController } from './administrator-professionals.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE - Professionals (Administrator)
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [
    UniversalModule,
    NotificationsModule,
  ],
  controllers: [AdministratorProfessionalsController],
  providers: [AdministratorProfessionalsService],
  exports: [AdministratorProfessionalsService],
})
export class AdministratorProfessionalsModule {}