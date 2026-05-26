import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { AppointmentStatus, Roles } from '@prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from 'src/shared/common/errors';
import { SUCCESS_MESSAGES } from 'src/shared/common/messages';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

const DEFAULT_INCLUDE = {
  patient: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
  professional: { select: { id: true, name: true, specialty: true, avatarUrl: true } },
  company: { select: { id: true, name: true } },
  payments: { select: { id: true, status: true, amount: true, method: true } },
};

@Injectable({ scope: Scope.REQUEST })
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(REQUEST) private readonly request: any,
  ) {}

  // ============================================================================
  // PACIENTE: consultas do usuário logado
  // ============================================================================

  async listarMinhasConsultas(page = 1, limit = 20, status?: AppointmentStatus) {
    const patientId = this.extrairUserId();
    const where: any = { patientId, deletedAt: null };
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({ where, include: DEFAULT_INCLUDE, orderBy: { startsAt: 'desc' }, skip, take: limit }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data, pagination: this.paginar(page, limit, total) };
  }

  // ============================================================================
  // PROFISSIONAL: agenda do profissional logado
  // ============================================================================

  async listarMinhaAgenda(
    page = 1,
    limit = 20,
    params: { status?: AppointmentStatus; dateFrom?: string; dateTo?: string; q?: string } = {},
  ) {
    const user = this.obterUsuarioLogado();
    if (user.role === Roles.PATIENT) throw new ForbiddenError('Acesso negado');

    const professionalId = user.id;
    const where: any = { professionalId, deletedAt: null };

    if (params.status) where.status = params.status;
    if (params.dateFrom && params.dateTo) {
      where.startsAt = { gte: new Date(params.dateFrom), lte: new Date(params.dateTo + 'T23:59:59.999Z') };
    }
    if (params.q?.trim()) {
      where.patient = { name: { contains: params.q.trim(), mode: 'insensitive' } };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({ where, include: DEFAULT_INCLUDE, orderBy: { startsAt: 'asc' }, skip, take: limit }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data, pagination: this.paginar(page, limit, total) };
  }

  // ============================================================================
  // ADMIN: listagem por empresa
  // ============================================================================

  async listarPorEmpresa(
    companyId: string,
    page = 1,
    limit = 20,
    params: { status?: AppointmentStatus; dateFrom?: string; dateTo?: string; q?: string } = {},
  ) {
    const where: any = { companyId, deletedAt: null };
    if (params.status) where.status = params.status;
    if (params.dateFrom && params.dateTo) {
      where.startsAt = { gte: new Date(params.dateFrom), lte: new Date(params.dateTo + 'T23:59:59.999Z') };
    }
    if (params.q?.trim()) {
      where.OR = [
        { patient: { name: { contains: params.q.trim(), mode: 'insensitive' } } },
        { professional: { name: { contains: params.q.trim(), mode: 'insensitive' } } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({ where, include: DEFAULT_INCLUDE, orderBy: { startsAt: 'desc' }, skip, take: limit }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data, pagination: this.paginar(page, limit, total) };
  }

  // ============================================================================
  // CRUD
  // ============================================================================

  async buscarPorId(id: string) {
    const item = await this.prisma.appointment.findUnique({ where: { id }, include: DEFAULT_INCLUDE });
    if (!item || item.deletedAt) throw new NotFoundError('Appointment', id, 'id');
    return { data: item };
  }

  async criar(dto: CreateAppointmentDto) {
    const user = this.obterUsuarioLogado();

    const patientId = dto.patientId ?? (user.role === Roles.PATIENT ? user.id : undefined);
    if (!patientId) throw new ValidationError('patientId é obrigatório');

    let companyId = dto.companyId;
    if (!companyId && user.role !== Roles.PATIENT) {
      const u = await this.prisma.user.findUnique({ where: { id: user.id }, select: { companyId: true } });
      companyId = u?.companyId ?? undefined;
    }

    const data = await this.prisma.appointment.create({
      data: {
        startsAt: new Date(dto.startsAt),
        patientId,
        professionalId: dto.professionalId,
        companyId: companyId ?? null,
        type: dto.type ?? 'PRESENCIAL',
        status: dto.status ?? AppointmentStatus.SCHEDULED,
        depositAmount: dto.depositAmount ?? 0,
        depositPaid: dto.depositPaid ?? false,
        notes: dto.notes,
      },
      include: DEFAULT_INCLUDE,
    });

    return { data };
  }

  async atualizar(id: string, dto: UpdateAppointmentDto) {
    await this.validarExistencia(id);

    const data = await this.prisma.appointment.update({
      where: { id },
      data: {
        ...(dto.startsAt && { startsAt: new Date(dto.startsAt) }),
        ...(dto.status && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.depositPaid !== undefined && { depositPaid: dto.depositPaid }),
        ...(dto.depositAmount !== undefined && { depositAmount: dto.depositAmount }),
      },
      include: DEFAULT_INCLUDE,
    });

    return { data };
  }

  async cancelar(id: string) {
    const item = await this.validarExistencia(id);
    const user = this.obterUsuarioLogado();

    if (user.role === Roles.PATIENT && item.patientId !== user.id) {
      throw new ForbiddenError('Você não pode cancelar esta consulta');
    }

    const data = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
      include: DEFAULT_INCLUDE,
    });

    return { data };
  }

  async confirmarPorProfissional(id: string) {
    const item = await this.validarExistencia(id);
    if (item.status !== AppointmentStatus.SCHEDULED) {
      throw new ValidationError('Apenas consultas agendadas podem ser confirmadas');
    }

    const data = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CONFIRMED },
      include: DEFAULT_INCLUDE,
    });

    return { data };
  }

  async confirmarConcluido(id: string) {
    await this.validarExistencia(id);

    const data = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.COMPLETED },
      include: DEFAULT_INCLUDE,
    });

    return { data };
  }

  async registrarFalta(id: string) {
    await this.validarExistencia(id);

    const data = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.NO_SHOW },
      include: DEFAULT_INCLUDE,
    });

    return { data };
  }

  async desativar(id: string) {
    await this.validarExistencia(id);
    await this.prisma.appointment.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: SUCCESS_MESSAGES.CRUD.DELETED };
  }

  // ============================================================================
  // SLOTS OCUPADOS (para o app de agendamento)
  // ============================================================================

  async obterSlotsOcupados(professionalId: string, dateStr: string) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
    const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        professionalId,
        startsAt: { gte: startOfDay, lte: endOfDay },
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
        deletedAt: null,
      },
      select: { startsAt: true },
    });

    const slots = appointments.map(a => {
      const h = a.startsAt.getHours().toString().padStart(2, '0');
      const min = a.startsAt.getMinutes().toString().padStart(2, '0');
      return `${h}:${min}`;
    });

    return { occupiedSlots: [...new Set(slots)] };
  }

  // ============================================================================
  // PRIVADOS
  // ============================================================================

  private obterUsuarioLogado() {
    const user = this.request?.user;
    if (!user) throw new UnauthorizedError('Usuário não autenticado');
    return user;
  }

  private extrairUserId(): string {
    return this.obterUsuarioLogado().id;
  }

  private async validarExistencia(id: string) {
    const item = await this.prisma.appointment.findUnique({ where: { id } });
    if (!item || item.deletedAt) throw new NotFoundError('Appointment', id, 'id');
    return item;
  }

  private paginar(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
  }
}
