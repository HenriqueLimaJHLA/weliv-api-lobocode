import { Module } from '@nestjs/common';
import { AdministratorServicesModule } from './administrator/administrator-services.module';
import { UserServicesModule } from './user/user-services.module';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICES MODULE
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [
    AdministratorServicesModule,
    UserServicesModule,
  ],
  exports: [
    AdministratorServicesModule,
    UserServicesModule,
  ],
})
export class ServicesModule {}