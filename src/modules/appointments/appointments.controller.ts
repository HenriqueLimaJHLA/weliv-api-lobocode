import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AppointmentStatus, Roles } from '@prisma/client';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleGuard } from 'src/shared/auth/guards/role.guard';
import { TenantInterceptor } from 'src/shared/tenant/tenant.interceptor';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';

@UseGuards(AuthGuard, RoleGuard)
@UseInterceptors(TenantInterceptor)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  // ============================================================================
  // PACIENTE
  // ============================================================================

  @Get('me')
  listarMinhasConsultas(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: AppointmentStatus,
  ) {
    return this.service.listarMinhasConsultas(Number(page), Number(limit), status);
  }

  // ============================================================================
  // PROFISSIONAL / ADMIN
  // ============================================================================

  @Get('agenda')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  listarMinhaAgenda(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: AppointmentStatus,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('q') q?: string,
  ) {
    return this.service.listarMinhaAgenda(Number(page), Number(limit), { status, dateFrom, dateTo, q });
  }

  @Get('company/:companyId')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  listarPorEmpresa(
    @Param('companyId') companyId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: AppointmentStatus,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('q') q?: string,
  ) {
    return this.service.listarPorEmpresa(companyId, Number(page), Number(limit), { status, dateFrom, dateTo, q });
  }

  @Get('slots/:professionalId/:date')
  obterSlotsOcupados(@Param('professionalId') professionalId: string, @Param('date') date: string) {
    return this.service.obterSlotsOcupados(professionalId, date);
  }

  // ============================================================================
  // CRUD
  // ============================================================================

  @Post()
  criar(@Body() dto: CreateAppointmentDto) {
    return this.service.criar(dto);
  }

  @Patch(':id')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  atualizar(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.service.atualizar(id, dto);
  }

  @Post(':id/confirmar')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  confirmarPorProfissional(@Param('id') id: string) {
    return this.service.confirmarPorProfissional(id);
  }

  @Post(':id/concluir')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  confirmarConcluido(@Param('id') id: string) {
    return this.service.confirmarConcluido(id);
  }

  @Post(':id/falta')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  registrarFalta(@Param('id') id: string) {
    return this.service.registrarFalta(id);
  }

  @Post(':id/cancelar')
  cancelar(@Param('id') id: string) {
    return this.service.cancelar(id);
  }

  @Delete(':id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  desativar(@Param('id') id: string) {
    return this.service.desativar(id);
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.service.buscarPorId(id);
  }
}
