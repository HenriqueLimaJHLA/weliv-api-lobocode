import { Module } from '@nestjs/common';
import { UserExampleService } from './user-example.service';
import { UserExampleController } from './user-example.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';

@Module({
  imports: [
    UniversalModule,
    NotificationsModule,
  ],
  controllers: [UserExampleController],
  providers: [UserExampleService],
  exports: [UserExampleService],
})
export class UserExampleModule {}
