import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import {
  UniversalService,
  UniversalRepository,
  UniversalMetricsService,
  UniversalQueryService,
  UniversalPermissionService,
} from 'src/shared/universal';
import { CreateSpecialtyDto } from '../administrator/dto/create-specialty.dto';
import { UpdateSpecialtyDto } from '../administrator/dto/update-specialty.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE - Specialties (User - Acesso Público/Lido)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Para usuários comuns (não admin), oferece apenas leitura de especialidades.
// Permite listar e buscar, mas não criar/editar/excluir.
//
// ============================================================================

@Injectable({ scope: Scope.REQUEST })
export class UserSpecialtiesService extends UniversalService<
  CreateSpecialtyDto,
  UpdateSpecialtyDto
> {
  constructor(
    repository: UniversalRepository<CreateSpecialtyDto, UpdateSpecialtyDto>,
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
      'specialty',
      'Specialty',
    );
  }

  /**
   * Lista especialidades ativas (acesso público)
   * Usuários comuns só veem especialidades ativas da plataforma
   */
  async listarEspecialidades(page = 1, limit = 50, category?: string) {
    const where: any = {
      status: 'ACTIVE',
      deletedAt: null,
    };

    if (category) {
      where.category = category;
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.buscarMuitos(
        this.entityName,
        where,
        { orderBy: { name: 'asc' }, skip, take: limit },
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
   * Lista todas as categorias únicas
   */
  async listarCategorias() {
    const result = await this.repository.buscarMuitos(
      this.entityName,
      { deletedAt: null, category: { not: null } },
      { orderBy: { category: 'asc' } },
      { category: true },
    );

    const categorias = [...new Set(result.map((r: any) => r.category).filter(Boolean))];
    return { data: categorias };
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