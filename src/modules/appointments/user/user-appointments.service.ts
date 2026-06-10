import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { UniversalService, UniversalRepository, UniversalMetricsService, UniversalQueryService, UniversalPermissionService } from 'src/shared/universal';
import { CreateAppointmentDto } from '../administrator/dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../administrator/dto/update-appointment.dto';
import { AppointmentStatus } from '@prisma/client';

@Injectable({ scope: Scope.REQUEST })
export class UserAppointmentsService extends UniversalService<CreateAppointmentDto, UpdateAppointmentDto> {
  constructor(
    repository: UniversalRepository<CreateAppointmentDto, UpdateAppointmentDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) protected readonly request: any,
  ) {
    super(repository, queryService, permissionService, metricsService, request, 'appointment', 'Appointment');
  }

  async minhasConsultas(page = 1, limit = 20, status?: string) {
    const user = this.obterUsuarioLogado();
    if (!user) return { data: [], pagination: null };

    const where: any = { deletedAt: null };
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.buscarMuitos(this.entityName, where, { orderBy: { startsAt: 'asc' }, skip, take: limit }, this.getIncludeConfig()),
      this.repository.contarTodos(this.entityName, where),
    ]);

    return { data, pagination: this.paginar(page, limit, total) };
  }

  async minhaAgenda(page = 1, limit = 20, startDate?: string, endDate?: string) {
    const user = this.obterUsuarioLogado();
    if (!user) return { data: [], pagination: null };

    const where: any = { deletedAt: null, status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] } };

    if (startDate || endDate) {
      where.startsAt = {};
      if (startDate) where.startsAt.gte = new Date(startDate);
      if (endDate) where.startsAt.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.buscarMuitos(this.entityName, where, { orderBy: { startsAt: 'asc' }, skip, take: limit }, this.getIncludeConfig()),
      this.repository.contarTodos(this.entityName, where),
    ]);

    return { data, pagination: this.paginar(page, limit, total) };
  }

  private paginar(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
  }
}