import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import {
  UniversalService,
  UniversalRepository,
  UniversalMetricsService,
  UniversalQueryService,
  UniversalPermissionService,
  createEntityConfig,
} from 'src/shared/universal';
import { NotFoundError, ConflictError } from 'src/shared/common/errors';
import { Roles } from '@prisma/client';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE - Specialties (Administrator)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Reaproveita lógica do weliv-api-lobocode com adaptações para o padrão
// LOBOCODE-AI-SOFTWARE-FACTORY.
//
// Validações preservadas:
// - Nome único por empresa
// - Existence checks
//
// Fluxo:
// - listarEspecialidades → busca paginada com filtros
// - buscarEspecialidadePorId → busca por ID
// - criarEspecialidade → criação com validações
// - atualizarEspecialidade → atualização com validações
// - desativarEspecialidade → soft delete
//
// ============================================================================

@Injectable({ scope: Scope.REQUEST })
export class AdministratorSpecialtiesService extends UniversalService<
  CreateSpecialtyDto,
  UpdateSpecialtyDto
> {
  private static readonly entityConfig = createEntityConfig('specialty');

  constructor(
    repository: UniversalRepository<CreateSpecialtyDto, UpdateSpecialtyDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) protected readonly request: any,
  ) {
    const { model, casl } = AdministratorSpecialtiesService.entityConfig;
    super(
      repository,
      queryService,
      permissionService,
      metricsService,
      request,
      model,
      casl,
    );
    this.setEntityConfig();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CONFIGURAÇÃO DE ENTITY
  // ═══════════════════════════════════════════════════════════════════════════════

  private setEntityConfig() {
    this.entityConfig = {
      includes: {
        company: {
          select: {
            id: true,
            name: true,
            tradeName: true,
          },
        },
      },
      transform: {
        exclude: [],
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CRUD - REAPROVEITADO DO WELIV-API-LOBOCODE
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Lista especialidades com paginação
   * Reaproveitado do weliv-api-lobocode/services.service.ts
   */
  async listarEspecialidades(page = 1, limit = 50, category?: string) {
    const companyId = this.obterCompanyId();
    const where: any = { deletedAt: null };

    // Se tem companyId, busca tanto specialties da empresa quanto da plataforma (companyId null)
    if (companyId) {
      where.OR = [{ companyId: null }, { companyId }];
    }

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
   * Busca especialidade por ID
   * Reaproveitado do weliv-api-lobocode/services.service.ts
   */
  async buscarEspecialidadePorId(id: string) {
    const item = await this.repository.buscarPrimeiro(
      this.entityName,
      { id, deletedAt: null },
      this.getIncludeConfig(),
    );

    if (!item) {
      throw new NotFoundError('Specialty', id, 'id');
    }

    return { data: item };
  }

  /**
   * Cria nova especialidade
   * Reaproveitado do weliv-api-lobocode/services.service.ts
   */
  async criarEspecialidade(dto: CreateSpecialtyDto) {
    const companyId = this.obterCompanyId();

    // Validar nome único por empresa
    const existeNome = await this.repository.buscarPrimeiro(this.entityName, {
      name: dto.name,
      companyId: companyId || undefined,
      deletedAt: null,
    });

    if (existeNome) {
      throw new ConflictError(`Já existe uma especialidade com o nome "${dto.name}"`);
    }

    const data = await this.repository.criar(
      this.entityName,
      {
        ...dto,
        companyId: companyId || undefined,
      },
      this.getIncludeConfig(),
    );

    return { data };
  }

  /**
   * Atualiza especialidade
   * Reaproveitado do weliv-api-lobocode/services.service.ts
   */
  async atualizarEspecialidade(id: string, dto: UpdateSpecialtyDto) {
    // Validar existência
    await this.validarEspecialidadeExiste(id);

    // Se está alterando o nome, validar uniqueness
    if (dto.name) {
      const companyId = this.obterCompanyId();
      const existeNome = await this.repository.buscarPrimeiro(this.entityName, {
        name: dto.name,
        companyId: companyId || undefined,
        id: { not: id },
        deletedAt: null,
      });

      if (existeNome) {
        throw new ConflictError(`Já existe uma especialidade com o nome "${dto.name}"`);
      }
    }

    const data = await this.repository.atualizar(
      this.entityName,
      { id },
      dto,
      this.getIncludeConfig(),
    );

    return { data };
  }

  /**
   * Desativa especialidade (soft delete)
   * Reaproveitado do weliv-api-lobocode/services.service.ts
   */
  async desativarEspecialidade(id: string) {
    await this.validarEspecialidadeExiste(id);
    await this.repository.desativar(this.entityName, { id });

    return { message: 'Especialidade desativada com sucesso' };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // VALIDAÇÕES - REAPROVEITADO DO WELIV-API-LOBOCODE
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Valida se especialidade existe
   * Reaproveitado do weliv-api-lobocode/services.service.ts
   */
  private async validarEspecialidadeExiste(id: string) {
    const item = await this.repository.buscarPrimeiro(this.entityName, {
      id,
      deletedAt: null,
    });

    if (!item) {
      throw new NotFoundError('Specialty', id, 'id');
    }

    return item;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // UTILITÁRIOS
  // ═══════════════════════════════════════════════════════════════════════════════

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