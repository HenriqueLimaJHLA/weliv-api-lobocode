import { Module } from '@nestjs/common';
import { AdministratorUserService } from './administrator-user.service';
import { AdministratorUserController } from './administrator-user.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';

@Module({
  imports: [
    UniversalModule,
    NotificationsModule,
  ],
  controllers: [AdministratorUserController],
  providers: [AdministratorUserService],
  exports: [AdministratorUserService],
})
export class AdministratorUserModule {}