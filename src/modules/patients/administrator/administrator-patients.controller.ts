import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles, PatientCareStatus } from '@prisma/client';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleByMethodGuard } from 'src/shared/auth/guards/role-by-method.guard';
import { RoleByMethod } from 'src/shared/auth/role-by-method.decorator';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';
import { UniversalController } from 'src/shared/universal';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { AdministratorPatientsService } from './administrator-patients.service';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER - Patients (Administrator)
// ═══════════════════════════════════════════════════════════════════════════════

@ApiTags('admin/patients')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({
  GET: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  POST: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  PATCH: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  DELETE: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
})
@Controller('admin/patients')
export class AdministratorPatientsController extends UniversalController<
  CreatePatientDto,
  UpdatePatientDto,
  AdministratorPatientsService
> {
  constructor(service: AdministratorPatientsService) {
    super(service);
  }

  @Get()
  @ApiOperation({ summary: 'Lista pacientes com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'careStatus', required: false, type: String })
  listarPacientes(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('careStatus') careStatus?: string,
  ) {
    return this.service.listarPacientes(
      Number(page) || 1,
      Number(limit) || 20,
      careStatus,
    );
  }

  @Get('by-user/:userId')
  @ApiOperation({ summary: 'Busca paciente por userId' })
  buscarPorUserId(@Param('userId') userId: string) {
    return this.service.buscarPorUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca paciente por ID' })
  buscarPorId(@Param('id') id: string) {
    return this.service.buscarPacientePorId(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria novo paciente' })
  criarPaciente(@Body() dto: CreatePatientDto) {
    return this.service.criarPaciente(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza paciente' })
  atualizarPaciente(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.service.atualizarPaciente(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativa paciente (soft delete)' })
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  desativarPaciente(@Param('id') id: string) {
    return this.service.desativarPaciente(id);
  }

  @Post(':id/needs-attention')
  @ApiOperation({ summary: 'Marcar como needing attention' })
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  needsAttention(@Param('id') id: string) {
    return this.service.marcarAtencao(id);
  }
}