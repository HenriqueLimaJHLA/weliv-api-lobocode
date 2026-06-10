import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles, AppointmentStatus } from '@prisma/client';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleByMethodGuard } from 'src/shared/auth/guards/role-by-method.guard';
import { RoleByMethod } from 'src/shared/auth/role-by-method.decorator';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';
import { UniversalController } from 'src/shared/universal';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AdministratorAppointmentsService } from './administrator-appointments.service';

@ApiTags('admin/appointments')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({ GET: [Roles.SYSTEM_ADMIN, Roles.ADMIN], POST: [Roles.SYSTEM_ADMIN, Roles.ADMIN], PATCH: [Roles.SYSTEM_ADMIN, Roles.ADMIN], DELETE: [Roles.SYSTEM_ADMIN, Roles.ADMIN] })
@Controller('admin/appointments')
export class AdministratorAppointmentsController extends UniversalController<CreateAppointmentDto, UpdateAppointmentDto, AdministratorAppointmentsService> {
  constructor(service: AdministratorAppointmentsService) { super(service); }

  @Get()
  @ApiOperation({ summary: 'Lista agendamentos' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'professionalId', required: false })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  listar(@Query() query: any) {
    return this.service.listarAgendamentos(query.page ? Number(query.page) : 1, query.limit ? Number(query.limit) : 20, query.professionalId, query.patientId, query.status, query.startDate, query.endDate);
  }

  @Get('slots/:professionalId/:date')
  @ApiOperation({ summary: 'Obtém slots ocupados' })
  obterSlotsOcupados(@Param('professionalId') professionalId: string, @Param('date') date: string) {
    return this.service.obterSlotsOcupados(professionalId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca agendamento por ID' })
  buscarPorId(@Param('id') id: string) { return this.service.buscarAgendamentoPorId(id); }

  @Post()
  @ApiOperation({ summary: 'Cria agendamento' })
  criarAgendamento(@Body() dto: CreateAppointmentDto) { return this.service.criarAgendamento(dto); }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza agendamento' })
  atualizarAgendamento(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) { return this.service.atualizarAgendamento(id, dto); }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancela agendamento' })
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  cancelar(@Param('id') id: string) { return this.service.cancelarAgendamento(id); }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirma agendamento' })
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  confirmar(@Param('id') id: string) { return this.service.confirmarAgendamento(id); }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Conclui agendamento' })
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  concluir(@Param('id') id: string) { return this.service.concluirAgendamento(id); }

  @Post(':id/no-show')
  @ApiOperation({ summary: 'Registra falta' })
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  falta(@Param('id') id: string) { return this.service.registrarFalta(id); }
}