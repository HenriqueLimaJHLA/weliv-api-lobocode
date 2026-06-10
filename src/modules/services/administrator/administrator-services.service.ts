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
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE - Services (Administrator)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Reaproveita lógica do weliv-api-lobocode com adaptações para o padrão
// LOBOCODE-AI-SOFTWARE-FACTORY.
//
// Validações preservadas:
// - Nome único por empresa
// - Especialidade existente
// - Existence checks
//
// Fluxo:
// - listarServicos → busca paginada com filtros
// - buscarServicoPorId → busca por ID
// - criarServico → criação com validações
// - atualizarServico → atualização com validações
// - desativarServico → soft delete
//
// ============================================================================

@Injectable({ scope: Scope.REQUEST })
export class AdministratorServicesService extends UniversalService<
  CreateServiceDto,
  UpdateServiceDto
> {
  private static readonly entityConfig = createEntityConfig('service');

  constructor(
    repository: UniversalRepository<CreateServiceDto, UpdateServiceDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) protected readonly request: any,
  ) {
    const { model, casl } = AdministratorServicesService.entityConfig;
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
        specialty: {
          select: {
            id: true,
            name: true,
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
   * Lista serviços com paginação
   * Reaproveitado do weliv-api-lobocode/services.service.ts
   */
  async listarServicos(page = 1, limit = 20, specialtyId?: string) {
    const companyId = this.obterCompanyId();
    const where: any = { deletedAt: null };

    if (companyId) where.companyId = companyId;
    if (specialtyId) where.specialtyId = specialtyId;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.buscarMuitos(
        this.entityName,
        where,
        { orderBy: { order: 'asc' }, skip, take: limit },
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
   * Busca serviço por ID
   * Reaproveitado do weliv-api-lobocode/services.service.ts
   */
  async buscarServicoPorId(id: string) {
    const item = await this.repository.buscarPrimeiro(
      this.entityName,
      { id, deletedAt: null },
      this.getIncludeConfig(),
    );

    if (!item) {
      throw new NotFoundError('Service', id, 'id');
    }

    return { data: item };
  }

  /**
   * Cria novo serviço
   * Reaproveitado do weliv-api-lobocode/services.service.ts
   */
  async criarServico(dto: CreateServiceDto) {
    const companyId = this.obterCompanyId();

    // Validar nome único por empresa
    const existeNome = await this.repository.buscarPrimeiro(this.entityName, {
      name: dto.name,
      companyId: companyId || undefined,
      deletedAt: null,
    });

    if (existeNome) {
      throw new ConflictError(`Já existe um serviço com o nome "${dto.name}"`);
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
   * Atualiza serviço
   * Reaproveitado do weliv-api-lobocode/services.service.ts
   */
  async atualizarServico(id: string, dto: UpdateServiceDto) {
    await this.validarServicoExiste(id);

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
        throw new ConflictError(`Já existe um serviço com o nome "${dto.name}"`);
      }
    }

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
   * Desativa serviço (soft delete)
   * Reaproveitado do weliv-api-lobocode/services.service.ts
   */
  async desativarServico(id: string) {
    await this.validarServicoExiste(id);
    await this.repository.desativar(this.entityName, { id });

    return { message: 'Serviço desativado com sucesso' };
  }

  /**
   * Reativa serviço
   * Reaproveitado do weliv-api-lobocode/services.service.ts
   */
  async reativarServico(id: string) {
    const item = await this.repository.buscarPrimeiro(this.entityName, { id });
    if (!item) {
      throw new NotFoundError('Service', id, 'id');
    }
    await this.repository.reativar(this.entityName, { id });

    return { message: 'Serviço reativado com sucesso' };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // VALIDAÇÕES - REAPROVEITADO DO WELIV-API-LOBOCODE
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Valida se serviço existe
   */
  private async validarServicoExiste(id: string) {
    const item = await this.repository.buscarPrimeiro(this.entityName, {
      id,
      deletedAt: null,
    });

    if (!item) {
      throw new NotFoundError('Service', id, 'id');
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