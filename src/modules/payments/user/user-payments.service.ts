import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { UniversalService, UniversalRepository, UniversalMetricsService, UniversalQueryService, UniversalPermissionService } from 'src/shared/universal';
import { CreatePaymentDto } from '../administrator/dto/create-payment.dto';
import { UpdatePaymentDto } from '../administrator/dto/update-payment.dto';

@Injectable({ scope: Scope.REQUEST })
export class UserPaymentsService extends UniversalService<CreatePaymentDto, UpdatePaymentDto> {
  constructor(
    repository: UniversalRepository<CreatePaymentDto, UpdatePaymentDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) protected readonly request: any,
  ) {
    super(repository, queryService, permissionService, metricsService, request, 'payment' as any, 'Payment' as any);
  }

  async meusPagamentos(page = 1, limit = 20) {
    const user = this.obterUsuarioLogado();
    if (!user) return { data: [], pagination: null };
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