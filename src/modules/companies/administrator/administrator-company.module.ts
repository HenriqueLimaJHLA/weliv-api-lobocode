import { Module } from '@nestjs/common';
import { AdministratorCompanyService } from './administrator-company.service';
import { AdministratorCompanyController } from './administrator-company.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';
import { NotificationModule } from 'src/modules/infrastructure/notifications/notification.module';

@Module({
  imports: [
    UniversalModule,
    NotificationModule,
  ],
  controllers: [AdministratorCompanyController],
  providers: [AdministratorCompanyService],
  exports: [AdministratorCompanyService],
})
export class AdministratorCompanyModule {}