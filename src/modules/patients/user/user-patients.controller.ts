import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { UniversalController } from 'src/shared/universal';
import { CreatePatientDto } from '../administrator/dto/create-patient.dto';
import { UpdatePatientDto } from '../administrator/dto/update-patient.dto';
import { UserPatientsService } from './user-patients.service';

@ApiTags('patients')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('patients')
export class UserPatientsController extends UniversalController<
  CreatePatientDto,
  UpdatePatientDto,
  UserPatientsService
> {
  constructor(service: UserPatientsService) {
    super(service);
  }

  @Get('me')
  @ApiOperation({ summary: 'Meu perfil de paciente' })
  meuPerfil() {
    return this.service.meuPerfil();
  }

  @Patch('me')
  @ApiOperation({ summary: 'Atualizar meu perfil' })
  atualizarMeuPerfil(@Body() dto: UpdatePatientDto) {
    return this.service.atualizarMeuPerfil(dto);
  }
}