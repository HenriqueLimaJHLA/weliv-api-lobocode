import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@prisma/client';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleByMethodGuard } from 'src/shared/auth/guards/role-by-method.guard';
import { RoleByMethod } from 'src/shared/auth/role-by-method.decorator';
import { UniversalController } from 'src/shared/universal';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { AdministratorMedicalRecordsService } from './administrator-medical-records.service';

@ApiTags('admin/medical-records')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({ GET: [Roles.SYSTEM_ADMIN, Roles.ADMIN], POST: [Roles.SYSTEM_ADMIN, Roles.ADMIN], PATCH: [Roles.SYSTEM_ADMIN, Roles.ADMIN] })
@Controller('admin/medical-records')
export class AdministratorMedicalRecordsController extends UniversalController<CreateMedicalRecordDto, UpdateMedicalRecordDto, AdministratorMedicalRecordsService> {
  constructor(service: AdministratorMedicalRecordsService) { super(service); }

  @Get()
  @ApiOperation({ summary: 'Lista prontuários' })
  listar(@Query() query: any) {
    return this.service.listarProntuarios(query.page ? Number(query.page) : 1, query.limit ? Number(query.limit) : 20, query.patientId);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Busca prontuário por paciente' })
  buscarPorPaciente(@Param('patientId') patientId: string) {
    return this.service.buscarPorPaciente(patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca prontuário por ID' })
  buscarPorId(@Param('id') id: string) { return this.service.buscarProntuarioPorId(id); }

  @Post()
  @ApiOperation({ summary: 'Cria prontuário' })
  criarProntuario(@Body() dto: CreateMedicalRecordDto) { return this.service.criarProntuario(dto); }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza prontuário' })
  atualizarProntuario(@Param('id') id: string, @Body() dto: UpdateMedicalRecordDto) { return this.service.atualizarProntuario(id, dto); }
}