import { Module } from '@nestjs/common';
import { AdministratorAppointmentsModule } from './administrator/administrator-appointments.module';
import { UserAppointmentsModule } from './user/user-appointments.module';

@Module({ imports: [AdministratorAppointmentsModule, UserAppointmentsModule], exports: [AdministratorAppointmentsModule, UserAppointmentsModule] })
export class AppointmentsModule {}