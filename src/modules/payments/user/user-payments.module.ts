import { Module } from '@nestjs/common';
import { UniversalModule } from 'src/shared/universal';
import { UserPaymentsService } from './user-payments.service';
import { UserPaymentsController } from './user-payments.controller';

@Module({ imports: [UniversalModule], controllers: [UserPaymentsController], providers: [UserPaymentsService], exports: [UserPaymentsService] })
export class UserPaymentsModule {}