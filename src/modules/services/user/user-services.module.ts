import { Module } from '@nestjs/common';
import { UniversalModule } from 'src/shared/universal';
import { UserServicesService } from './user-services.service';
import { UserServicesController } from './user-services.controller';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE - Services (User Layer)
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [UniversalModule],
  controllers: [UserServicesController],
  providers: [UserServicesService],
  exports: [UserServicesService],
})
export class UserServicesModule {}