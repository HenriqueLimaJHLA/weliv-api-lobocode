import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { NotFoundError, UnauthorizedError, ValidationError } from 'src/shared/common/errors';
import { SUCCESS_MESSAGES } from 'src/shared/common/messages';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable({ scope: Scope.REQUEST })
export class AvailabilitiesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(REQUEST) private readonly request: any,
  ) {}

  // ============================================================================
  // BLOQUEIOS DO PROFISSIONAL LOGADO
  // ============================================================================

  async listarMeusBloqueios(page = 1, limit = 20) {
    const professionalUserId = this.extrairUserId();
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.professionalBlockedTime.findMany({
        where: { professionalUserId },
        orderBy: { blockedDate: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.professionalBlockedTime.count({ where: { professionalUserId } }),
    ]);

    return { data, pagination: this.paginar(page, limit, total) };
  }

  async buscarPorId(id: string) {
    const item = await this.prisma.professionalBlockedTime.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('ProfessionalBlockedTime', id, 'id');
    return { data: item };
  }

  async criar(dto: CreateAvailabilityDto) {
    const professionalUserId = dto.professionalUserId ?? this.extrairUserId();

    this.validarHorarios(dto.startTime, dto.endTime);

    const data = await this.prisma.professionalBlockedTime.create({
      data: {
        professionalUserId,
        blockedDate: new Date(dto.blockedDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        reason: dto.reason,
      },
    });

    return { data };
  }

  async atualizar(id: string, dto: UpdateAvailabilityDto) {
    await this.validarExistencia(id);

    if (dto.startTime && dto.endTime) this.validarHorarios(dto.startTime, dto.endTime);

    const data = await this.prisma.professionalBlockedTime.update({
      where: { id },
      data: {
        ...(dto.blockedDate && { blockedDate: new Date(dto.blockedDate) }),
        ...(dto.startTime && { startTime: dto.startTime }),
        ...(dto.endTime && { endTime: dto.endTime }),
        ...(dto.reason && { reason: dto.reason }),
      },
    });

    return { data };
  }

  async remover(id: string) {
    await this.validarExistencia(id);
    await this.prisma.professionalBlockedTime.delete({ where: { id } });
    return { message: SUCCESS_MESSAGES.CRUD.DELETED };
  }

  // ============================================================================
  // LISTAGEM PARA ADMIN/PRO (por profissional)
  // ============================================================================

  async listarPorProfissional(professionalUserId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.professionalBlockedTime.findMany({
        where: { professionalUserId },
        orderBy: { blockedDate: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.professionalBlockedTime.count({ where: { professionalUserId } }),
    ]);

    return { data, pagination: this.paginar(page, limit, total) };
  }

  async listarBloqueadosPorData(professionalUserId: string, data: string) {
    const date = new Date(data);
    const items = await this.prisma.professionalBlockedTime.findMany({
      where: { professionalUserId, blockedDate: date },
      orderBy: { startTime: 'asc' },
    });
    return { data: items };
  }

  // ============================================================================
  // PRIVADOS
  // ============================================================================

  private extrairUserId(): string {
    const id = this.request?.user?.id;
    if (!id) throw new UnauthorizedError('Usuário não autenticado');
    return id;
  }

  private async validarExistencia(id: string) {
    const item = await this.prisma.professionalBlockedTime.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('ProfessionalBlockedTime', id, 'id');
    return item;
  }

  private validarHorarios(startTime: string, endTime: string) {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new ValidationError('Formato de hora inválido. Use HH:MM');
    }
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    if (h1 * 60 + m1 >= h2 * 60 + m2) {
      throw new ValidationError('Hora de início deve ser menor que hora de fim');
    }
  }

  private paginar(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
  }
}
