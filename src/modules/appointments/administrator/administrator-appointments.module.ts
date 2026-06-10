import { Module } from '@nestjs/common';
import { AdministratorAppointmentsService } from './administrator-appointments.service';
import { AdministratorAppointmentsController } from './administrator-appointments.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';

@Module({ imports: [UniversalModule, NotificationsModule], controllers: [AdministratorAppointmentsController], providers: [AdministratorAppointmentsService], exports: [AdministratorAppointmentsService] })
export class AdministratorAppointmentsModule {}