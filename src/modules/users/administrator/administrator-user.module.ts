import { Module } from '@nestjs/common';
import { AdministratorUserService } from './administrator-user.service';
import { AdministratorUserController } from './administrator-user.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';
import { NotificationModule } from 'src/modules/infrastructure/notifications/notification.module';

@Module({
  imports: [
    UniversalModule,
    NotificationModule,
  ],
  controllers: [AdministratorUserController],
  providers: [AdministratorUserService],
  exports: [AdministratorUserService],
})
export class AdministratorUserModule {}