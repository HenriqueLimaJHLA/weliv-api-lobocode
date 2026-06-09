import { Module } from '@nestjs/common';
import { AdministratorExampleService } from './administrator-example.service';
import { AdministratorExampleController } from './administrator-example.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { AdministratorExampleContextService } from './services/administrator-example-context.service';
import { AdministratorExampleQueryService } from './services/administrator-example-query.service';

@Module({
  imports: [
    UniversalModule,
    NotificationsModule,
  ],
  controllers: [AdministratorExampleController],
  providers: [
    AdministratorExampleService,
    AdministratorExampleContextService,
    AdministratorExampleQueryService,
  ],
  exports: [AdministratorExampleService],
})
export class AdministratorExampleModule {}
