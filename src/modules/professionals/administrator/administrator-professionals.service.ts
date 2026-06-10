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
import { NotFoundError, ConflictError, ForbiddenError } from 'src/shared/common/errors';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE - Professionals (Administrator)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Reaproveita lógica do weliv-api-lobocode/professionals.service.ts
//
// Fluxo:
// - listarProfissionais → busca paginada com filtros
// - buscarProfissionalPorId → busca por ID com user
// - criarProfissional → criação com validações
// - atualizarProfissional → atualização com validações
// - desativarProfissional → soft delete
//
// ============================================================================

@Injectable({ scope: Scope.REQUEST })
export class AdministratorProfessionalsService extends UniversalService<
  CreateProfessionalDto,
  UpdateProfessionalDto
> {
  private static readonly entityConfig = createEntityConfig('professional');

  constructor(
    repository: UniversalRepository<CreateProfessionalDto, UpdateProfessionalDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) protected readonly request: any,
  ) {
    const { model, casl } = AdministratorProfessionalsService.entityConfig;
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profilePicture: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            tradeName: true,
          },
        },
        specialty: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
      transform: {
        flatten: {
          user: { field: 'name', target: 'userName' },
        },
        exclude: [],
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CRUD - REAPROVEITADO DO WELIV-API-LOBOCODE
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Lista profissionais com paginação
   * Reaproveitado do weliv-api-lobocode/professionals.service.ts
   */
  async listarProfissionais(page = 1, limit = 20, specialtyId?: string, status?: string) {
    const companyId = this.obterCompanyId();
    const where: any = { deletedAt: null };

    if (companyId) where.companyId = companyId;
    if (specialtyId) where.specialtyId = specialtyId;
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.buscarMuitos(
        this.entityName,
        where,
        { orderBy: { createdAt: 'desc' }, skip, take: limit },
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
   * Busca profissional por ID
   * Reaproveitado do weliv-api-lobocode/professionals.service.ts
   */
  async buscarProfissionalPorId(id: string) {
    const item = await this.repository.buscarPrimeiro(
      this.entityName,
      { id, deletedAt: null },
      this.getIncludeConfig(),
    );

    if (!item) {
      throw new NotFoundError('Professional', id, 'id');
    }

    return { data: item };
  }

  /**
   * Busca profissional por userId
   */
  async buscarPorUserId(userId: string) {
    const item = await this.repository.buscarPrimeiro(
      this.entityName,
      { userId, deletedAt: null },
      this.getIncludeConfig(),
    );

    if (!item) {
      throw new NotFoundError('Professional', userId, 'userId');
    }

    return { data: item };
  }

  /**
   * Cria novo profissional
   * Reaproveitado do weliv-api-lobocode/professionals.service.ts
   */
  async criarProfissional(dto: CreateProfessionalDto) {
    const companyId = this.obterCompanyId();

    // Validar userId existe
    const user = await this.repository.buscarPrimeiro('user', { id: dto.userId });
    if (!user) {
      throw new NotFoundError('User', dto.userId, 'id');
    }

    // Validar não existe profissional para este user na empresa
    const existeProfissional = await this.repository.buscarPrimeiro(this.entityName, {
      userId: dto.userId,
      companyId: companyId || undefined,
      deletedAt: null,
    });

    if (existeProfissional) {
      throw new ConflictError('Já existe um profissional vinculado a este usuário nesta empresa');
    }

    // Validar especialidade se fornecida
    if (dto.specialtyId) {
      await this.validarEspecialidadeExiste(dto.specialtyId);
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
   * Atualiza profissional
   * Reaproveitado do weliv-api-lobocode/professionals.service.ts
   */
  async atualizarProfissional(id: string, dto: UpdateProfessionalDto) {
    await this.validarProfissionalExiste(id);

    // Validar especialidade se fornecida
    if (dto.specialtyId) {
      await this.validarEspecialidadeExiste(dto.specialtyId);
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
   * Desativa profissional (soft delete)
   * Reaproveitado do weliv-api-lobocode/professionals.service.ts
   */
  async desativarProfissional(id: string) {
    await this.validarProfissionalExiste(id);
    await this.repository.desativar(this.entityName, { id });

    return { message: 'Profissional desativado com sucesso' };
  }

  /**
   * Ativa profissional
   */
  async ativarProfissional(id: string) {
    await this.validarProfissionalExiste(id);
    await this.repository.atualizar(
      this.entityName,
      { id },
      { status: 'ACTIVE' },
      this.getIncludeConfig(),
    );

    return { message: 'Profissional ativado com sucesso' };
  }

  /**
   * Coloca profissional em férias
   */
  async marcarFerias(id: string) {
    await this.validarProfissionalExiste(id);
    await this.repository.atualizar(
      this.entityName,
      { id },
      { status: 'VACATION' },
      this.getIncludeConfig(),
    );

    return { message: 'Profissional marcado como em férias' };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // VALIDAÇÕES - REAPROVEITADO DO WELIV-API-LOBOCODE
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Valida se profissional existe
   */
  private async validarProfissionalExiste(id: string) {
    const item = await this.repository.buscarPrimeiro(this.entityName, {
      id,
      deletedAt: null,
    });

    if (!item) {
      throw new NotFoundError('Professional', id, 'id');
    }

    return item;
  }

  /**
   * Valida se especialidade existe
   */
  private async validarEspecialidadeExiste(id: string) {
    const item = await this.repository.buscarPrimeiro('specialty', {
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