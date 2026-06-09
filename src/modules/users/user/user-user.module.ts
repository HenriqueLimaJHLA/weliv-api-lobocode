import { Module } from '@nestjs/common';
import { UniversalModule } from 'src/shared/universal';
import { UserUserService } from './user-user.service';
import { UserUserController } from './user-user.controller';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE - USER LAYER
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [UniversalModule],
  controllers: [UserUserController],
  providers: [UserUserService],
  exports: [UserUserService],
})
export class UserUserModule {}
