import { Module } from '@nestjs/common';
import { UniversalModule } from 'src/shared/universal';
import { UserAppointmentsService } from './user-appointments.service';
import { UserAppointmentsController } from './user-appointments.controller';

@Module({ imports: [UniversalModule], controllers: [UserAppointmentsController], providers: [UserAppointmentsService], exports: [UserAppointmentsService] })
export class UserAppointmentsModule {}