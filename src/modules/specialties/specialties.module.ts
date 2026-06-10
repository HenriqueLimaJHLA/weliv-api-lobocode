import { Module } from '@nestjs/common';
import { AdministratorSpecialtiesModule } from './administrator/administrator-specialties.module';
import { UserSpecialtiesModule } from './user/user-specialties.module';

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIALTIES MODULE
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [
    AdministratorSpecialtiesModule,
    UserSpecialtiesModule,
  ],
  exports: [
    AdministratorSpecialtiesModule,
    UserSpecialtiesModule,
  ],
})
export class SpecialtiesModule {}