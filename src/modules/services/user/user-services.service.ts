import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import {
  UniversalService,
  UniversalRepository,
  UniversalMetricsService,
  UniversalQueryService,
  UniversalPermissionService,
} from 'src/shared/universal';
import { CreateServiceDto } from '../administrator/dto/create-service.dto';
import { UpdateServiceDto } from '../administrator/dto/update-service.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE - Services (User - Acesso Público/Lido)
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable({ scope: Scope.REQUEST })
export class UserServicesService extends UniversalService<
  CreateServiceDto,
  UpdateServiceDto
> {
  constructor(
    repository: UniversalRepository<CreateServiceDto, UpdateServiceDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) protected readonly request: any,
  ) {
    super(
      repository,
      queryService,
      permissionService,
      metricsService,
      request,
      'service',
      'Service',
    );
  }

  /**
   * Lista serviços ativos (acesso público)
   */
  async listarServicos(page = 1, limit = 50, specialtyId?: string) {
    const where: any = {
      status: 'ACTIVE',
      deletedAt: null,
    };

    if (specialtyId) where.specialtyId = specialtyId;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.buscarMuitos(
        this.entityName,
        where,
        { orderBy: { order: 'asc' }, skip, take: limit },
        this.getIncludeConfig(),
      ),
      this.repository.contarTodos(this.entityName, where),
    ]);

    return {
      data,
      pagination: this.paginar(page, limit, total),
    };
  }

  /**
   * Lista serviços por especialidade
   */
  async listarPorEspecialidade(specialtyId: string, page = 1, limit = 20) {
    return this.listarServicos(page, limit, specialtyId);
  }

  private paginar(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}