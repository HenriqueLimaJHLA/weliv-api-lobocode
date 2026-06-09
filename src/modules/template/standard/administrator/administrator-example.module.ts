import { Module } from '@nestjs/common';
import { AdministratorExampleService } from './administrator-example.service';
import { AdministratorExampleController } from './administrator-example.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';

@Module({
  imports: [
    UniversalModule,
    NotificationsModule,
  ],
  controllers: [AdministratorExampleController],
  providers: [AdministratorExampleService],
  exports: [AdministratorExampleService],
})
export class AdministratorExampleModule {}
