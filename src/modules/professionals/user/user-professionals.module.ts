import { Module } from '@nestjs/common';
import { UniversalModule } from 'src/shared/universal';
import { UserProfessionalsService } from './user-professionals.service';
import { UserProfessionalsController } from './user-professionals.controller';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE - Professionals (User Layer)
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [UniversalModule],
  controllers: [UserProfessionalsController],
  providers: [UserProfessionalsService],
  exports: [UserProfessionalsService],
})
export class UserProfessionalsModule {}