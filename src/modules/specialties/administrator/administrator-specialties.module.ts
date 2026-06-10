import { Module } from '@nestjs/common';
import { AdministratorSpecialtiesService } from './administrator-specialties.service';
import { AdministratorSpecialtiesController } from './administrator-specialties.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE - Specialties (Administrator)
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [
    UniversalModule,
    NotificationsModule,
  ],
  controllers: [AdministratorSpecialtiesController],
  providers: [AdministratorSpecialtiesService],
  exports: [AdministratorSpecialtiesService],
})
export class AdministratorSpecialtiesModule {}