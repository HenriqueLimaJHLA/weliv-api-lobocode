import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { UniversalService, UniversalRepository, UniversalMetricsService, UniversalQueryService, UniversalPermissionService } from 'src/shared/universal';
import { CreateDocumentDto } from '../administrator/dto/create-document.dto';
import { UpdateDocumentDto } from '../administrator/dto/update-document.dto';

@Injectable({ scope: Scope.REQUEST })
export class UserDocumentsService extends UniversalService<CreateDocumentDto, UpdateDocumentDto> {
  constructor(
    repository: UniversalRepository<CreateDocumentDto, UpdateDocumentDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) protected readonly request: any,
  ) {
    super(repository, queryService, permissionService, metricsService, request, 'document' as any, 'Document' as any);
  }

  async meusDocumentos(page = 1, limit = 20) {
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