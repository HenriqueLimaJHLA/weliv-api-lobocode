import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { NotFoundError } from 'src/shared/common/errors';
import { ExampleStatus, ExampleType } from '../dto/create-example.dto';

export interface ExampleAdminListParams {
  page?: number;
  limit?: number;
  status?: ExampleStatus;
  type?: ExampleType;
  search?: string;
  companyId?: string;
}

export interface ExampleAdminListResult {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  summary: {
    totalAtivos: number;
    totalPendentes: number;
    totalInativos: number;
  };
}

/**
 * COMPLEX · ADMINISTRATOR — queries complexas e enriquecimento para o painel admin.
 */
@Injectable()
export class AdministratorExampleQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async listarParaAdmin(
    params: ExampleAdminListParams,
  ): Promise<ExampleAdminListResult> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (params.companyId) {
      where.companyId = params.companyId;
    }
    if (params.status) {
      where.status = params.status;
    }
    if (params.type) {
      where.type = params.type;
    }
    if (params.search?.trim()) {
      const s = params.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { code: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
      ];
    }
    const [list, total, totalAtivos, totalPendentes, totalInativos] =
      await Promise.all([
        (this.prisma as any).example.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            company: { select: { id: true, name: true } },
            owner: { select: { id: true, name: true, email: true } },
          },
        }),
        (this.prisma as any).example.count({ where }),
        (this.prisma as any).example.count({
          where: { ...where, status: ExampleStatus.ACTIVE },
        }),
        (this.prisma as any).example.count({
          where: { ...where, status: ExampleStatus.PENDING },
        }),
        (this.prisma as any).example.count({
          where: { ...where, status: ExampleStatus.INACTIVE },
        }),
      ]);
    const totalPages = Math.ceil(total / limit) || 0;
    return {
      data: list,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      summary: {
        totalAtivos,
        totalPendentes,
        totalInativos,
      },
    };
  }

  async obterDetalhesParaAdmin(id: string): Promise<{ data: any }> {
    const entity = await (this.prisma as any).example.findFirst({
      where: { id, deletedAt: null },
      include: {
        company: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    if (!entity) {
      throw new NotFoundError('example', id, 'id');
    }
    const totalFilhos = await (this.prisma as any).example.count({
      where: { parentId: id, deletedAt: null },
    });
    return {
      data: {
        ...entity,
        _meta: {
          totalFilhos,
          isAtivo: entity.status === ExampleStatus.ACTIVE,
        },
      },
    };
  }

  async obterResumoEstatisticas(companyId: string): Promise<{ data: any }> {
    const where: any = { companyId, deletedAt: null };
    const [total, porStatus, porTipo] = await Promise.all([
      (this.prisma as any).example.count({ where }),
      (this.prisma as any).example.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      (this.prisma as any).example.groupBy({
        by: ['type'],
        where,
        _count: { id: true },
      }),
    ]);
    const statusMap = Object.fromEntries(
      porStatus.map((row: any) => [row.status, row._count.id]),
    );
    const tipoMap = Object.fromEntries(
      porTipo.map((row: any) => [row.type, row._count.id]),
    );
    return {
      data: {
        total,
        porStatus: statusMap,
        porTipo: tipoMap,
      },
    };
  }
}
