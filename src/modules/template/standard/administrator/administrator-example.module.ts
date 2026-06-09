import { Module } from '@nestjs/common';
import { AdministratorExampleService } from './administrator-example.service';
import { AdministratorExampleController } from './administrator-example.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';
import { NotificationModule } from 'src/modules/infrastructure/notifications/notification.module';

@Module({
  imports: [
    UniversalModule,
    NotificationModule,
  ],
  controllers: [AdministratorExampleController],
  providers: [AdministratorExampleService],
  exports: [AdministratorExampleService],
})
export class AdministratorExampleModule {}
