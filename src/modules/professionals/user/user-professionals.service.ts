import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import {
  UniversalService,
  UniversalRepository,
  UniversalMetricsService,
  UniversalQueryService,
  UniversalPermissionService,
} from 'src/shared/universal';
import { CreateProfessionalDto } from '../administrator/dto/create-professional.dto';
import { UpdateProfessionalDto } from '../administrator/dto/update-professional.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE - Professionals (User - Acesso do próprio profissional)
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable({ scope: Scope.REQUEST })
export class UserProfessionalsService extends UniversalService<
  CreateProfessionalDto,
  UpdateProfessionalDto
> {
  constructor(
    repository: UniversalRepository<CreateProfessionalDto, UpdateProfessionalDto>,
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
      'professional',
      'Professional',
    );
  }

  /**
   * Lista profissionais ativos da empresa (público)
   */
  async listarProfissionais(page = 1, limit = 50, specialtyId?: string) {
    const companyId = this.obterCompanyId();
    const where: any = {
      status: 'ACTIVE',
      deletedAt: null,
    };

    if (companyId) where.companyId = companyId;
    if (specialtyId) where.specialtyId = specialtyId;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.buscarMuitos(
        this.entityName,
        where,
        { orderBy: { user: { name: 'asc' } }, skip, take: limit },
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
   * Busca perfil do profissional logado
   */
  async meuPerfil() {
    const user = this.obterUsuarioLogado();
    if (!user) return null;

    const item = await this.repository.buscarPrimeiro(
      this.entityName,
      { userId: user.id, deletedAt: null },
      this.getIncludeConfig(),
    );

    return item ? { data: item } : null;
  }

  /**
   * Atualiza próprio perfil
   */
  async atualizarMeuPerfil(dto: UpdateProfessionalDto) {
    const user = this.obterUsuarioLogado();
    if (!user) return null;

    const item = await this.repository.buscarPrimeiro(
      this.entityName,
      { userId: user.id, deletedAt: null },
    );

    if (!item) return null;

    return this.repository.atualizar(
      this.entityName,
      { id: item.id },
      dto,
      this.getIncludeConfig(),
    );
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