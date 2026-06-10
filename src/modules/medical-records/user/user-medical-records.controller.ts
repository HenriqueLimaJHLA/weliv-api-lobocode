import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { UniversalController } from 'src/shared/universal';
import { CreateMedicalRecordDto } from '../administrator/dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from '../administrator/dto/update-medical-record.dto';
import { UserMedicalRecordsService } from './user-medical-records.service';

@ApiTags('medical-records')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('medical-records')
export class UserMedicalRecordsController extends UniversalController<CreateMedicalRecordDto, UpdateMedicalRecordDto, UserMedicalRecordsService> {
  constructor(service: UserMedicalRecordsService) { super(service); }

  @Get('my-records')
  @ApiOperation({ summary: 'Meu prontuário' })
  meuProntuario() { return this.service.meuProntuario(); }
}