import { Module } from '@nestjs/common';
import { AdministratorProfessionalsModule } from './administrator/administrator-professionals.module';
import { UserProfessionalsModule } from './user/user-professionals.module';

// ═══════════════════════════════════════════════════════════════════════════════
// PROFESSIONALS MODULE
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [
    AdministratorProfessionalsModule,
    UserProfessionalsModule,
  ],
  exports: [
    AdministratorProfessionalsModule,
    UserProfessionalsModule,
  ],
})
export class ProfessionalsModule {}