import { Module } from '@nestjs/common';
import { AdministratorMedicalRecordsModule } from './administrator/administrator-medical-records.module';
import { UserMedicalRecordsModule } from './user/user-medical-records.module';

@Module({ imports: [AdministratorMedicalRecordsModule, UserMedicalRecordsModule], exports: [AdministratorMedicalRecordsModule, UserMedicalRecordsModule] })
export class MedicalRecordsModule {}