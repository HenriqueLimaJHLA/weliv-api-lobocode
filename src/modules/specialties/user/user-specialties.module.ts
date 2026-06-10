import { Module } from '@nestjs/common';
import { UniversalModule } from 'src/shared/universal';
import { UserSpecialtiesService } from './user-specialties.service';
import { UserSpecialtiesController } from './user-specialties.controller';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE - Specialties (User Layer)
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [UniversalModule],
  controllers: [UserSpecialtiesController],
  providers: [UserSpecialtiesService],
  exports: [UserSpecialtiesService],
})
export class UserSpecialtiesModule {}