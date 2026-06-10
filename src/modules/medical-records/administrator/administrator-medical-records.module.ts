import { Module } from '@nestjs/common';
import { AdministratorMedicalRecordsService } from './administrator-medical-records.service';
import { AdministratorMedicalRecordsController } from './administrator-medical-records.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';

@Module({ imports: [UniversalModule], controllers: [AdministratorMedicalRecordsController], providers: [AdministratorMedicalRecordsService], exports: [AdministratorMedicalRecordsService] })
export class AdministratorMedicalRecordsModule {}