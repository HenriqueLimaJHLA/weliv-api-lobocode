import { Module } from '@nestjs/common';
import { AdministratorPaymentsModule } from './administrator/administrator-payments.module';
import { UserPaymentsModule } from './user/user-payments.module';

@Module({ imports: [AdministratorPaymentsModule, UserPaymentsModule], exports: [AdministratorPaymentsModule, UserPaymentsModule] })
export class PaymentsModule {}