import { Module } from '@nestjs/common';
import { AdministratorPaymentsService } from './administrator-payments.service';
import { AdministratorPaymentsController } from './administrator-payments.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';

@Module({ imports: [UniversalModule], controllers: [AdministratorPaymentsController], providers: [AdministratorPaymentsService], exports: [AdministratorPaymentsService] })
export class AdministratorPaymentsModule {}