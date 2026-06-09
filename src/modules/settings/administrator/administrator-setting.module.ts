import { Module } from '@nestjs/common';
import { AdministratorSettingService } from './administrator-setting.service';
import { AdministratorSettingController } from './administrator-setting.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';
import { NotificationModule } from 'src/modules/infrastructure/notifications/notification.module';

@Module({
  imports: [
    UniversalModule,
    NotificationModule,
  ],
  controllers: [AdministratorSettingController],
  providers: [AdministratorSettingService],
  exports: [AdministratorSettingService],
})
export class AdministratorSettingModule {}