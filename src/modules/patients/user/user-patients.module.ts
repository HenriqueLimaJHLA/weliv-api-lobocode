import { Module } from '@nestjs/common';
import { UniversalModule } from 'src/shared/universal';
import { UserPatientsService } from './user-patients.service';
import { UserPatientsController } from './user-patients.controller';

@Module({
  imports: [UniversalModule],
  controllers: [UserPatientsController],
  providers: [UserPatientsService],
  exports: [UserPatientsService],
})
export class UserPatientsModule {}