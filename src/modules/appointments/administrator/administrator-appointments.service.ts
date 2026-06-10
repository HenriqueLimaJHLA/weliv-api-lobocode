import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import {
  UniversalService,
  UniversalRepository,
  UniversalMetricsService,
  UniversalQueryService,
  UniversalPermissionService,
  createEntityConfig,
} from 'src/shared/universal';
import { NotFoundError, ConflictError, ForbiddenError } from 'src/shared/common/errors';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus, AppointmentType } from '@prisma/client';

@Injectable({ scope: Scope.REQUEST })
export class AdministratorAppointmentsService extends UniversalService<
  CreateAppointmentDto,
  UpdateAppointmentDto
> {
  private static readonly entityConfig = createEntityConfig('appointment');

  constructor(
    repository: UniversalRepository<CreateAppointmentDto, UpdateAppointmentDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) protected readonly request: any,
  ) {
    const { model, casl } = AdministratorAppointmentsService.entityConfig;
    super(repository, queryService, permissionService, metricsService, request, model, casl);
    this.setEntityConfig();
  }

  private setEntityConfig() {
    this.entityConfig = {
      includes: {
        professional: {
          include: {
            user: { select: { id: true, name: true } },
            specialty: { select: { id: true, name: true } },
          },
        },
        patient: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
        service: { select: { id: true, name: true, duration: true, price: true } },
        company: { select: { id: true, name: true } },
      },
      transform: { exclude: [] },
    };
  }

  async listarAgendamentos(page = 1, limit = 20, professionalId?: string, patientId?: string, status?: string, startDate?: string, endDate?: string) {
    const companyId = this.obterCompanyId();
    const where: any = { deletedAt: null };

    if (companyId) where.companyId = companyId;
    if (professionalId) where.professionalId = professionalId;
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

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

  async buscarAgendamentoPorId(id: string) {
    const item = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null }, this.getIncludeConfig());
    if (!item) throw new NotFoundError('Appointment', id, 'id');
    return { data: item };
  }

  async criarAgendamento(dto: CreateAppointmentDto) {
    const companyId = this.obterCompanyId();

    // Validar profissional
    const professional = await this.repository.buscarPrimeiro('professional', { id: dto.professionalId, deletedAt: null });
    if (!professional) throw new NotFoundError('Professional', dto.professionalId, 'id');

    // Validar paciente
    const patient = await this.repository.buscarPrimeiro('patient', { id: dto.patientId, deletedAt: null });
    if (!patient) throw new NotFoundError('Patient', dto.patientId, 'id');

    // Verificar conflito de horário
    const startsAt = new Date(dto.startsAt);
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : new Date(startsAt.getTime() + 30 * 60000);

    const conflito = await this.repository.buscarPrimeiro(this.entityName, {
      professionalId: dto.professionalId,
      deletedAt: null,
      status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
      OR: [{ AND: [{ startsAt: { lte: startsAt } }, { endsAt: { gt: startsAt } }] }, { AND: [{ startsAt: { lt: endsAt } }, { endsAt: { gte: endsAt } }] }, { AND: [{ startsAt: { gte: startsAt } }, { endsAt: { lte: endsAt } }] }],
    });

    if (conflito) throw new ConflictError('Já existe um agendamento neste horário');

    const data = await this.repository.criar(this.entityName, { ...dto, companyId: companyId || undefined }, this.getIncludeConfig());
    return { data };
  }

  async atualizarAgendamento(id: string, dto: UpdateAppointmentDto) {
    await this.validarAgendamentoExiste(id);
    const data = await this.repository.atualizar(this.entityName, { id }, dto, this.getIncludeConfig());
    return { data };
  }

  async cancelarAgendamento(id: string) {
    await this.validarAgendamentoExiste(id);
    await this.repository.atualizar(this.entityName, { id }, { status: AppointmentStatus.CANCELLED });
    return { message: 'Agendamento cancelado com sucesso' };
  }

  async confirmarAgendamento(id: string) {
    await this.validarAgendamentoExiste(id);
    await this.repository.atualizar(this.entityName, { id }, { status: AppointmentStatus.CONFIRMED });
    return { message: 'Agendamento confirmado' };
  }

  async concluirAgendamento(id: string) {
    await this.validarAgendamentoExiste(id);
    await this.repository.atualizar(this.entityName, { id }, { status: AppointmentStatus.COMPLETED });
    return { message: 'Agendamento concluído' };
  }

  async registrarFalta(id: string) {
    await this.validarAgendamentoExiste(id);
    await this.repository.atualizar(this.entityName, { id }, { status: AppointmentStatus.NO_SHOW });
    return { message: 'Falta registrada' };
  }

  async obterSlotsOcupados(professionalId: string, date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const agendamentos = await this.repository.buscarMuitos(
      this.entityName,
      {
        professionalId,
        deletedAt: null,
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
        startsAt: { gte: startOfDay, lte: endOfDay },
      },
      { orderBy: { startsAt: 'asc' } },
      { startsAt: true, endsAt: true },
    );

    const slots = agendamentos.map((a: any) => ({ startsAt: a.startsAt, endsAt: a.endsAt }));
    return { data: slots };
  }

  private async validarAgendamentoExiste(id: string) {
    const item = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });
    if (!item) throw new NotFoundError('Appointment', id, 'id');
    return item;
  }

  private paginar(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
  }
}