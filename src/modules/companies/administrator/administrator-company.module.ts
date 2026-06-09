import { Module } from '@nestjs/common';
import { AdministratorCompanyService } from './administrator-company.service';
import { AdministratorCompanyController } from './administrator-company.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';

@Module({
  imports: [
    UniversalModule,
    NotificationsModule,
  ],
  controllers: [AdministratorCompanyController],
  providers: [AdministratorCompanyService],
  exports: [AdministratorCompanyService],
})
export class AdministratorCompanyModule {}