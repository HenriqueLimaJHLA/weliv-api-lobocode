import { Module } from '@nestjs/common';
import { AdministratorPatientsService } from './administrator-patients.service';
import { AdministratorPatientsController } from './administrator-patients.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';

@Module({
  imports: [UniversalModule, NotificationsModule],
  controllers: [AdministratorPatientsController],
  providers: [AdministratorPatientsService],
  exports: [AdministratorPatientsService],
})
export class AdministratorPatientsModule {}