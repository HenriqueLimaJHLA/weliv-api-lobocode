import { Module } from '@nestjs/common';
import { AdministratorChargesModule } from './administrator/administrator-charges.module';
import { UserChargesModule } from './user/user-charges.module';

@Module({ imports: [AdministratorChargesModule, UserChargesModule], exports: [AdministratorChargesModule, UserChargesModule] })
export class ChargesModule {}