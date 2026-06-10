import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { UniversalService, UniversalRepository, UniversalMetricsService, UniversalQueryService, UniversalPermissionService } from 'src/shared/universal';
import { NotFoundError } from 'src/shared/common/errors';
import { CreateChargeDto } from './dto/create-charge.dto';
import { UpdateChargeDto } from './dto/update-charge.dto';

@Injectable({ scope: Scope.REQUEST })
export class AdministratorChargesService extends UniversalService<CreateChargeDto, UpdateChargeDto> {
  constructor(
    repository: UniversalRepository<CreateChargeDto, UpdateChargeDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) protected readonly request: any,
  ) {
    super(repository, queryService, permissionService, metricsService, request, 'charge' as any, 'Charge' as any);
  }

  async listarCobrancas(page = 1, limit = 20, patientId?: string, status?: string) {
    const companyId = this.obterCompanyId();
    const where: any = { deletedAt: null };
    if (companyId) where.companyId = companyId;
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.buscarMuitos(this.entityName, where, { orderBy: { createdAt: 'desc' }, skip, take: limit }, this.getIncludeConfig()),
      this.repository.contarTodos(this.entityName, where),
    ]);
    return { data, pagination: this.paginar(page, limit, total) };
  }

  async buscarCobrancaPorId(id: string) {
    const item = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null }, this.getIncludeConfig());
    if (!item) throw new NotFoundError('Charge', id, 'id');
    return { data: item };
  }

  async criarCobranca(dto: CreateChargeDto) {
    const companyId = this.obterCompanyId();
    const data = await this.repository.criar(this.entityName, { ...dto, companyId: companyId || undefined }, this.getIncludeConfig());
    return { data };
  }

  async atualizarCobranca(id: string, dto: UpdateChargeDto) {
    await this.validarCobrancaExiste(id);
    const data = await this.repository.atualizar(this.entityName, { id }, dto, this.getIncludeConfig());
    return { data };
  }

  async marcarComoPago(id: string) {
    await this.validarCobrancaExiste(id);
    await this.repository.atualizar(this.entityName, { id }, { status: 'PAID', paidAt: new Date().toISOString() });
    return { message: 'Cobrança marcada como paga' };
  }

  private async validarCobrancaExiste(id: string) {
    const item = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });
    if (!item) throw new NotFoundError('Charge', id, 'id');
    return item;
  }

  private paginar(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
  }
}