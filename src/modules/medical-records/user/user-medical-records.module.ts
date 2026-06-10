import { Module } from '@nestjs/common';
import { UniversalModule } from 'src/shared/universal';
import { UserMedicalRecordsService } from './user-medical-records.service';
import { UserMedicalRecordsController } from './user-medical-records.controller';

@Module({ imports: [UniversalModule], controllers: [UserMedicalRecordsController], providers: [UserMedicalRecordsService], exports: [UserMedicalRecordsService] })
export class UserMedicalRecordsModule {}