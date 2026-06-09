import { Module } from '@nestjs/common';
import { AdministratorSettingService } from './administrator-setting.service';
import { AdministratorSettingController } from './administrator-setting.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';

@Module({
  imports: [
    UniversalModule,
    NotificationsModule,
  ],
  controllers: [AdministratorSettingController],
  providers: [AdministratorSettingService],
  exports: [AdministratorSettingService],
})
export class AdministratorSettingModule {}