import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { UniversalService, UniversalRepository, UniversalMetricsService, UniversalQueryService, UniversalPermissionService } from 'src/shared/universal';
import { NotFoundError } from 'src/shared/common/errors';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable({ scope: Scope.REQUEST })
export class AdministratorPaymentsService extends UniversalService<CreatePaymentDto, UpdatePaymentDto> {
  constructor(
    repository: UniversalRepository<CreatePaymentDto, UpdatePaymentDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) protected readonly request: any,
  ) {
    super(repository, queryService, permissionService, metricsService, request, 'payment' as any, 'Payment' as any);
  }

  private setEntityConfig() {
    this.entityConfig = {
      includes: { company: { select: { id: true, name: true } } },
      transform: { exclude: [] },
    };
  }

  async listarPagamentos(page = 1, limit = 20, patientId?: string, status?: string) {
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

  async buscarPagamentoPorId(id: string) {
    const item = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null }, this.getIncludeConfig());
    if (!item) throw new NotFoundError('Payment', id, 'id');
    return { data: item };
  }

  async criarPagamento(dto: CreatePaymentDto) {
    const companyId = this.obterCompanyId();
    const data = await this.repository.criar(this.entityName, { ...dto, companyId: companyId || undefined }, this.getIncludeConfig());
    return { data };
  }

  async atualizarPagamento(id: string, dto: UpdatePaymentDto) {
    await this.validarPagamentoExiste(id);
    const data = await this.repository.atualizar(this.entityName, { id }, dto, this.getIncludeConfig());
    return { data };
  }

  async confirmarPagamento(id: string) {
    await this.validarPagamentoExiste(id);
    await this.repository.atualizar(this.entityName, { id }, { status: 'COMPLETED', paid: true });
    return { message: 'Pagamento confirmado' };
  }

  async cancelarPagamento(id: string) {
    await this.validarPagamentoExiste(id);
    await this.repository.atualizar(this.entityName, { id }, { status: 'CANCELLED' });
    return { message: 'Pagamento cancelado' };
  }

  private async validarPagamentoExiste(id: string) {
    const item = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });
    if (!item) throw new NotFoundError('Payment', id, 'id');
    return item;
  }

  private paginar(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
  }
}