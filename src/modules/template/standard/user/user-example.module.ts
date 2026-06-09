import { Module } from '@nestjs/common';
import { UserExampleService } from './user-example.service';
import { UserExampleController } from './user-example.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';
import { NotificationModule } from 'src/modules/infrastructure/notifications/notification.module';

@Module({
  imports: [
    UniversalModule,
    NotificationModule,
  ],
  controllers: [UserExampleController],
  providers: [UserExampleService],
  exports: [UserExampleService],
})
export class UserExampleModule {}
