import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { UniversalService, UniversalRepository, UniversalMetricsService, UniversalQueryService, UniversalPermissionService } from 'src/shared/universal';
import { NotFoundError } from 'src/shared/common/errors';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable({ scope: Scope.REQUEST })
export class AdministratorDocumentsService extends UniversalService<CreateDocumentDto, UpdateDocumentDto> {
  constructor(
    repository: UniversalRepository<CreateDocumentDto, UpdateDocumentDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) protected readonly request: any,
  ) {
    super(repository, queryService, permissionService, metricsService, request, 'document' as any, 'Document' as any);
  }

  async listarDocumentos(page = 1, limit = 20, patientId?: string, type?: string) {
    const companyId = this.obterCompanyId();
    const where: any = { deletedAt: null };
    if (companyId) where.companyId = companyId;
    if (patientId) where.patientId = patientId;
    if (type) where.type = type;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.buscarMuitos(this.entityName, where, { orderBy: { createdAt: 'desc' }, skip, take: limit }, this.getIncludeConfig()),
      this.repository.contarTodos(this.entityName, where),
    ]);
    return { data, pagination: this.paginar(page, limit, total) };
  }

  async buscarDocumentoPorId(id: string) {
    const item = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null }, this.getIncludeConfig());
    if (!item) throw new NotFoundError('Document', id, 'id');
    return { data: item };
  }

  async criarDocumento(dto: CreateDocumentDto) {
    const companyId = this.obterCompanyId();
    const data = await this.repository.criar(this.entityName, { ...dto, companyId: companyId || undefined }, this.getIncludeConfig());
    return { data };
  }

  async atualizarDocumento(id: string, dto: UpdateDocumentDto) {
    await this.validarDocumentoExiste(id);
    const data = await this.repository.atualizar(this.entityName, { id }, dto, this.getIncludeConfig());
    return { data };
  }

  private async validarDocumentoExiste(id: string) {
    const item = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });
    if (!item) throw new NotFoundError('Document', id, 'id');
    return item;
  }

  private paginar(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
  }
}