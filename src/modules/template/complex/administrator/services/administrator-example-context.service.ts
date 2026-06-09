import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { NotFoundError, ForbiddenError } from 'src/shared/common/errors';
import {
  CreateExampleDto,
  ExampleStatus,
  ExampleType,
} from '../dto/create-example.dto';
import { UpdateExampleDto } from '../dto/update-example.dto';

/**
 * COMPLEX · ADMINISTRATOR — validações e preparação de payload no painel admin.
 */
@Injectable()
export class AdministratorExampleContextService {
  constructor(private readonly prisma: PrismaService) {}

  async validarEPrepararParaCriacao(data: CreateExampleDto): Promise<void> {
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
    if ((data as any).startsAt && (data as any).endsAt) {
      if ((data as any).startsAt >= (data as any).endsAt) {
        throw new ForbiddenError(
          'A data de início deve ser anterior à data de encerramento.',
        );
      }
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
    if (data.parentId) {
      const parent = await (this.prisma as any).example.findFirst({
        where: { id: data.parentId, deletedAt: null },
        select: { id: true, companyId: true },
      });
      if (!parent) {
        throw new NotFoundError('example (parent)', data.parentId, 'id');
      }
    }
  }

  async validarEPrepararParaAtualizacao(
    id: string,
    data: UpdateExampleDto,
  ): Promise<void> {
    if (data.code) {
      (data as any).code = data.code.trim().toUpperCase();
      const existente = await (this.prisma as any).example.findFirst({
        where: { code: (data as any).code, deletedAt: null, id: { not: id } },
      });
      if (existente) {
        throw new ForbiddenError(
          `Já existe outro registro com o código ${(data as any).code}.`,
        );
      }
    }
    if (data.startsAt && typeof data.startsAt === 'string') {
      (data as any).startsAt = new Date(data.startsAt);
    }
    if (data.endsAt && typeof data.endsAt === 'string') {
      (data as any).endsAt = new Date(data.endsAt);
    }
  }
}
