import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import {
  NotFoundError,
  ForbiddenError,
} from 'src/shared/common/errors';
import {
  CreateExampleDto,
  ExampleStatus,
  ExampleType,
} from '../dto/create-example.dto';
import { UpdateExampleDto } from '../dto/update-example.dto';

/**
 * COMPLEX · USER — contexto e regras de criação/atualização no escopo do usuário.
 */
@Injectable()
export class UserExampleContextService {
  constructor(private readonly prisma: PrismaService) {}

  async validarEPrepararParaCriacao(
    data: CreateExampleDto,
    userId: string,
  ): Promise<void> {
    (data as any).ownerId = userId;
    if (data.code) {
      (data as any).code = data.code.trim().toUpperCase();
    }
    if (!data.type) {
      (data as any).type = ExampleType.STANDARD;
    }
    if (!data.status) {
      (data as any).status = ExampleStatus.PENDING;
    }
    if (data.startsAt && typeof data.startsAt === 'string') {
      (data as any).startsAt = new Date(data.startsAt);
    }
    if (data.endsAt && typeof data.endsAt === 'string') {
      (data as any).endsAt = new Date(data.endsAt);
    }
    if (data.code) {
      const existente = await (this.prisma as any).example.findFirst({
        where: { code: (data as any).code, deletedAt: null },
      });
      if (existente) {
        throw new ForbiddenError(
          `Já existe um registro com o código ${(data as any).code}.`,
        );
      }
    }
  }

  async validarEPrepararParaAtualizacaoDoUsuario(
    id: string,
    userId: string,
    data: UpdateExampleDto,
  ): Promise<void> {
    const entity = await (this.prisma as any).example.findFirst({
      where: { id, ownerId: userId, deletedAt: null },
    });
    if (!entity) {
      throw new NotFoundError('example', id, 'id');
    }
    if (data.code) {
      (data as any).code = data.code.trim().toUpperCase();
    }
    if (data.startsAt && typeof data.startsAt === 'string') {
      (data as any).startsAt = new Date(data.startsAt);
    }
    if (data.endsAt && typeof data.endsAt === 'string') {
      (data as any).endsAt = new Date(data.endsAt);
    }
  }

  async resolverRegistroDoUsuario(
    userId: string,
    companyId: string | null,
  ): Promise<{ data: any }> {
    const where: any = { ownerId: userId, deletedAt: null };
    if (companyId) {
      where.companyId = companyId;
    }
    const entity = await (this.prisma as any).example.findFirst({
      where,
      include: { owner: { select: { id: true, name: true } } },
    });
    if (!entity) {
      throw new NotFoundError('example', userId, 'ownerId');
    }
    return { data: entity };
  }

  async atualizarRegistroDoUsuario(
    userId: string,
    companyId: string | null,
    data: UpdateExampleDto,
  ): Promise<{ data: any }> {
    const where: any = { ownerId: userId, deletedAt: null };
    if (companyId) {
      where.companyId = companyId;
    }
    const entity = await (this.prisma as any).example.findFirst({ where });
    if (!entity) {
      throw new NotFoundError('example', userId, 'ownerId');
    }
    await this.validarEPrepararParaAtualizacaoDoUsuario(entity.id, userId, data);
    const updated = await (this.prisma as any).example.update({
      where: { id: entity.id },
      data: data as any,
    });
    return { data: updated };
  }
}
