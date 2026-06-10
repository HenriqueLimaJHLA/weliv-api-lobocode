import { Module } from '@nestjs/common';
import { AdministratorChargesService } from './administrator-charges.service';
import { AdministratorChargesController } from './administrator-charges.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';

@Module({ imports: [UniversalModule], controllers: [AdministratorChargesController], providers: [AdministratorChargesService], exports: [AdministratorChargesService] })
export class AdministratorChargesModule {}