import { Module } from '@nestjs/common';
import { AdministratorPatientsModule } from './administrator/administrator-patients.module';
import { UserPatientsModule } from './user/user-patients.module';

@Module({
  imports: [AdministratorPatientsModule, UserPatientsModule],
  exports: [AdministratorPatientsModule, UserPatientsModule],
})
export class PatientsModule {}