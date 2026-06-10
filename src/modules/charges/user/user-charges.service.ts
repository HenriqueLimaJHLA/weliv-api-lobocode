import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { UniversalService, UniversalRepository, UniversalMetricsService, UniversalQueryService, UniversalPermissionService } from 'src/shared/universal';
import { CreateChargeDto } from '../administrator/dto/create-charge.dto';
import { UpdateChargeDto } from '../administrator/dto/update-charge.dto';

@Injectable({ scope: Scope.REQUEST })
export class UserChargesService extends UniversalService<CreateChargeDto, UpdateChargeDto> {
  constructor(
    repository: UniversalRepository<CreateChargeDto, UpdateChargeDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) protected readonly request: any,
  ) {
    super(repository, queryService, permissionService, metricsService, request, 'charge' as any, 'Charge' as any);
  }

  async minhasCobrancas(page = 1, limit = 20) {
    const where: any = { deletedAt: null };
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.buscarMuitos(this.entityName, where, { orderBy: { createdAt: 'desc' }, skip, take: limit }, this.getIncludeConfig()),
      this.repository.contarTodos(this.entityName, where),
    ]);
    return { data, pagination: this.paginar(page, limit, total) };
  }

  private paginar(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
  }
}