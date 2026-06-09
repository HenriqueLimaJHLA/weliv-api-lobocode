import { Module } from '@nestjs/common';
import { AdministratorUserModule } from './administrator/administrator-user.module';
import { UserUserModule } from './user/user-user.module';

// ═══════════════════════════════════════════════════════════════════════════════
// USERS MODULE
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [AdministratorUserModule, UserUserModule],
  exports: [AdministratorUserModule, UserUserModule],
})
export class UsersModule {}
