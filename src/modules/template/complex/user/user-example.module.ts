import { Module } from '@nestjs/common';
import { UserExampleService } from './user-example.service';
import { UserExampleController } from './user-example.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';
import { NotificationModule } from 'src/modules/infrastructure/notifications/notification.module';
import { UserExampleContextService } from './services/user-example-context.service';

@Module({
  imports: [
    UniversalModule,
    NotificationModule,
  ],
  controllers: [UserExampleController],
  providers: [
    UserExampleService,
    UserExampleContextService,
  ],
  exports: [UserExampleService],
})
export class UserExampleModule {}
