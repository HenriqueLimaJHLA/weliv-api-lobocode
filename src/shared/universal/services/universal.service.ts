import { Inject, Optional } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { NotFoundError } from '../../common/errors';
import { SUCCESS_MESSAGES } from '../../common/messages';
import { UniversalQueryService } from './query.service';
import { UniversalRepository } from '../repositories/universal.repository';
import { UniversalPermissionService } from './permission.service';
import { UniversalMetricsService } from './metrics.service';
import { Roles } from '@prisma/client';
import {
  EntityNameCasl,
  EntityNameModel,
  IncludeConfig,
  TransformConfig,
  EntityConfig,
} from '../types';

/**
 * Serviço universal abstrato que fornece operações CRUD padronizadas
 * para todas as entidades do sistema.
 *
 * Inclui hooks para personalização, validações automáticas,
 * permissões CASL, multi-tenancy e sistema de includes/transformações.
 */
export abstract class UniversalService<DtoCreate, DtoUpdate> {
  protected readonly entityName: EntityNameModel;
  protected readonly entityNameCasl: EntityNameCasl;
  protected removeCompanyIdInWhereClause: boolean = false;

  // Configuração de includes e transformações
  protected entityConfig: EntityConfig = {};

  constructor(
    protected repository: UniversalRepository<DtoCreate, DtoUpdate>,
    protected queryService: UniversalQueryService,
    protected permissionService: UniversalPermissionService,
    protected metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) protected request: any,
    entityNameModel: EntityNameModel,
    entityNameCasl: EntityNameCasl,
  ) {
    this.entityName = entityNameModel;
    this.entityNameCasl = entityNameCasl;
  }

  // ============================================================================
  // 📖 MÉTODOS PÚBLICOS - OPERAÇÕES DE LEITURA
  // ============================================================================

  /**
   * Busca entidade por ID
   */
  async buscarPorId(id: string, include?: any) {
    const startTime = Date.now();
    const user = this.request?.user;

    try {
      this.permissionService.validarAction(this.entityNameCasl, 'read');

      const whereClause = this.queryService.construirWhereClauseParaRead(
        this.entityNameCasl,
        { id },
      );

      const includeConfig = include || this.getIncludeConfig();

      const entity = await this.buscarEntidade(
        whereClause,
        includeConfig,
        false,
      );

      this.validarResultadoDaBusca(entity, this.entityName, 'id', id);

      // Registra métricas de sucesso
      this.metricsService.recordEntityOperation(
        this.entityName,
        'read',
        'success',
        user,
        Date.now() - startTime,
      );

      return { data: this.transformData(entity) };
    } catch (error) {
      // Registra métricas de erro
      this.metricsService.recordEntityOperation(
        this.entityName,
        'read',
        'error',
        user,
        Date.now() - startTime,
      );

      throw error;
    }
  }

  /**
   * Lista todas as entidades
   */
  async buscarTodos() {
    this.permissionService.validarAction(this.entityNameCasl, 'read');

    const whereClause = this.queryService.construirWhereClauseParaRead(
      this.entityNameCasl,
    );

    // Usa includes da configuração se não for fornecido
    const includeConfig = this.getIncludeConfig();
    const entities = await this.repository.buscarMuitos(
      this.entityName,
      whereClause,
      {},
      includeConfig,
    );
    const transformedData = this.transformData(entities);
    return transformedData;
  }

  /**
   * Lista todas as entidades com paginação
   */
  async buscarComPaginacao(page = 1, limit = 20, include?: any) {
    this.permissionService.validarAction(this.entityNameCasl, 'read');

    const whereClause = this.queryService.construirWhereClauseParaRead(
      this.entityNameCasl,
    );

    if (this.removeCompanyIdInWhereClause) delete whereClause.companyId;

    // Usa includes da configuração se não for fornecido
    const includeConfig = include || this.getIncludeConfig();

    const skip = (page - 1) * limit;
    const [entities, total] = await Promise.all([
      this.repository.buscarMuitos(
        this.entityName,
        whereClause,
        {
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        },
        includeConfig,
      ),
      this.repository.contarTodos(this.entityName, whereClause),
    ]);

    const { totalPages, hasNextPage, hasPreviousPage } =
      this.calcularInformacoesDePaginacao(page, limit, total);

    // Aplica transformações se configurado
    const transformedData = this.transformData(entities);

    return {
      data: transformedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  /**
   * Busca entidade por campo específico
   */
  async buscarPorCampo(field: string, value: any, include?: any) {
    this.permissionService.validarAction(this.entityNameCasl, 'read');

    const whereClause = this.queryService.construirWhereClauseParaRead(
      this.entityNameCasl,
      { [field]: value },
    );

    const includeConfig = include || this.getIncludeConfig();

    // Aplica transformações se configurado
    const entity = await this.repository.buscarPrimeiro(
      this.entityName,
      whereClause,
      includeConfig,
    );

    return { data: this.transformData(entity) };
  }

  /**
   * Busca múltiplas entidades por campo específico
   */
  async buscarMuitosPorCampo(field: string, value: any, include?: any) {
    this.permissionService.validarAction(this.entityNameCasl, 'read');

    const whereClause = this.queryService.construirWhereClauseParaRead(
      this.entityNameCasl,
      { [field]: value },
    );

    const includeConfig = include || this.getIncludeConfig();

    const entities = await this.repository.buscarMuitos(
      this.entityName,
      whereClause,
      includeConfig,
    );

    return { data: this.transformData(entities) };
  }

  /**
   * Busca uma entidade por múltiplos campos
   */
  async buscarPorCampos(fields: Record<string, any>, include?: any) {
    this.permissionService.validarAction(this.entityNameCasl, 'read');

    const whereClause = this.queryService.construirWhereClauseParaRead(
      this.entityNameCasl,
      fields,
    );

    const includeConfig = include || this.getIncludeConfig();

    const entity = await this.repository.buscarPrimeiro(
      this.entityName,
      whereClause,
      includeConfig,
    );

    return { data: this.transformData(entity) };
  }

  /**
   * Busca múltiplas entidades por múltiplos campos
   */
  async buscarMuitosPorCampos(fields: Record<string, any>, include?: any) {
    this.permissionService.validarAction(this.entityNameCasl, 'read');

    const whereClause = this.queryService.construirWhereClauseParaRead(
      this.entityNameCasl,
      fields,
    );

    const includeConfig = include || this.getIncludeConfig();

    const entities = await this.repository.buscarMuitos(
      this.entityName,
      whereClause,
      includeConfig,
    );

    return { data: this.transformData(entities) };
  }

  // ============================================================================
  // ✏️ MÉTODOS PÚBLICOS - OPERAÇÕES DE ESCRITA
  // ============================================================================

  /**
   * Cria nova entidade
   */
  async criar(data: DtoCreate, include?: any, role?: Roles) {
    const startTime = Date.now();
    const user = this.request?.user;

    try {
      // Incrementa operações concorrentes
      this.metricsService.incrementConcurrentOperations(
        this.entityName,
        'create',
      );

      this.permissionService.validarAction(this.entityNameCasl, 'create');

      if (role) {
        this.permissionService.validarCriacaoDeEntidadeComRole(
          this.entityNameCasl,
          role,
        );
      }

      await this.antesDeCriar(data);

      // Usa includes da configuração se não for fornecido
      const includeConfig = include || this.getIncludeConfig();

      const entity = await this.repository.criar(
        this.entityName,
        data,
        includeConfig,
      );

      // Registra métricas de sucesso
      this.metricsService.recordEntityOperation(
        this.entityName,
        'create',
        'success',
        user,
        Date.now() - startTime,
      );

      await this.depoisDeCriar(entity);

      // Aplica transformações se configurado
      return this.transformData(entity);
    } catch (error) {
      // Registra métricas de erro
      this.metricsService.recordEntityOperation(
        this.entityName,
        'create',
        'error',
        user,
        Date.now() - startTime,
      );

      throw error;
    } finally {
      // Decrementa operações concorrentes
      this.metricsService.decrementConcurrentOperations(
        this.entityName,
        'create',
      );
    }
  }

  /**
   * Atualiza entidade existente
   */
  async atualizar(id: string, updateEntityDto: DtoUpdate, include?: any) {
    const startTime = Date.now();
    const user = this.request?.user;

    try {
      // Incrementa operações concorrentes
      this.metricsService.incrementConcurrentOperations(
        this.entityName,
        'update',
      );

      this.permissionService.validarAction(this.entityNameCasl, 'update');

      await this.antesDeAtualizar(id, updateEntityDto);

      const whereClause = this.queryService.construirWhereClauseParaUpdate(
        this.entityNameCasl,
        id,
      );

      const entity = await this.buscarEntidade(whereClause);

      this.validarResultadoDaBusca(entity, this.entityName, 'id', id);

      // Usa includes da configuração se não for fornecido
      const includeConfig = include || this.getIncludeConfig();

      const updatedEntity = await this.repository.atualizar(
        this.entityName,
        { id },
        updateEntityDto,
        includeConfig,
      );

      // Registra métricas de sucesso
      this.metricsService.recordEntityOperation(
        this.entityName,
        'update',
        'success',
        user,
        Date.now() - startTime,
      );

      await this.depoisDeAtualizar(id, updateEntityDto);

      // Aplica transformações se configurado
      return this.transformData(updatedEntity);
    } catch (error) {
      // Registra métricas de erro
      this.metricsService.recordEntityOperation(
        this.entityName,
        'update',
        'error',
        user,
        Date.now() - startTime,
      );

      throw error;
    } finally {
      // Decrementa operações concorrentes
      this.metricsService.decrementConcurrentOperations(
        this.entityName,
        'update',
      );
    }
  }

  /**
   * Desativa entidade (soft delete)
   */
  async desativar(id: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'delete');

    await this.antesDeDesativar(id);

    const whereClause = this.queryService.construirWhereClauseParaDelete(
      this.entityNameCasl,
      id,
    );
    const entity = await this.buscarEntidade(whereClause);

    if (!entity) {
      throw new NotFoundError(this.entityName, id, 'id');
    }

    await this.repository.desativar(this.entityName, { id });

    await this.depoisDeDesativar(id);

    return {
      message: SUCCESS_MESSAGES.CRUD.DELETED,
    };
  }

  /**
   * Reativa entidade (restaura soft delete)
   */
  async reativar(id: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'delete');

    await this.antesDeReativar(id);

    const whereClause = this.queryService.construirWhereClauseParaUpdate(
      this.entityNameCasl,
      id,
    );
    const entity = await this.buscarEntidade(whereClause, true);

    if (!entity) {
      throw new NotFoundError(this.entityName, id, 'id');
    }

    await this.repository.reativar(this.entityName, { id });

    await this.depoisDeReativar(id);

    return {
      message: SUCCESS_MESSAGES.CRUD.RESTORED,
    };
  }

  // ============================================================================
  // 🔍 MÉTODOS PÚBLICOS - VALIDAÇÕES E UTILITÁRIOS
  // ============================================================================

  /**
   * Valida existência de uma entidade
   */
  async validarExistencia(id: string, deletedAt: boolean = false) {
    const entity = await this.repository.buscarUnico(this.entityName, {
      id,
      deletedAt: deletedAt ? { not: null } : null,
    });

    if (!entity) {
      throw new NotFoundError(this.entityName, id, 'id');
    }
    return entity;
  }

  // ============================================================================
  // 🎯 HOOKS DO CICLO DE VIDA - PARA SOBRESCRITA NAS CLASSES FILHAS
  // ============================================================================

  /**
   * Configura includes e transformações para a entidade
   * Sobrescreva para definir configurações específicas
   */
  protected getEntityConfig(): EntityConfig {
    return this.entityConfig;
  }

  /**
   * Obtém configuração de includes
   */
  protected getIncludeConfig(): IncludeConfig | undefined {
    return this.getEntityConfig().includes;
  }

  /**
   * Obtém configuração de transformação
   */
  protected getTransformConfig(): TransformConfig | undefined {
    return this.getEntityConfig().transform;
  }

  /**
   * Aplica transformações nos dados baseado na configuração
   */
  protected transformData(data: any | any[]): any[] {
    const config = this.getTransformConfig();
    if (!config) return data;

    const transformedData = (Array.isArray(data) ? data : [data]).map(
      (entity) => {
        let transformed = { ...entity };

        // Aplica flatten (mapeia campos de relacionamento para campos planos)
        if (config.flatten) {
          Object.entries(config.flatten).forEach(([relation, config]) => {
            if (transformed[relation]) {
              if (typeof config === 'string') {
                // Configuração simples: relation -> targetField
                transformed[config] = transformed[relation];
              } else {
                // Configuração específica: extrai campo específico do relacionamento
                const { field, target } = config;
                if (
                  transformed[relation] &&
                  typeof transformed[relation] === 'object'
                ) {
                  transformed[target] = transformed[relation][field];
                }
              }
              delete transformed[relation];
            }
          });
        }

        // Aplica transformação customizada
        if (config.custom) {
          transformed = config.custom(transformed);
        }

        // Remove campos excluídos
        if (config.exclude) {
          config.exclude.forEach((field) => {
            delete transformed[field];
          });
        }

        return transformed;
      },
    );

    return Array.isArray(data) ? transformedData : transformedData[0];
  }

  /**
   * Hook executado antes da criação
   * Sobrescreva para validações específicas
   */
  protected async antesDeCriar(data: DtoCreate): Promise<void> {}

  /**
   * Hook executado após a criação
   * Sobrescreva para ações pós-criação
   */
  protected async depoisDeCriar(data: any): Promise<void> {}

  /**
   * Hook executado antes da atualização
   * Sobrescreva para validações específicas
   */
  protected async antesDeAtualizar(
    id: string,
    data: DtoUpdate,
  ): Promise<void> {}

  /**
   * Hook executado após a atualização
   * Sobrescreva para ações pós-atualização
   */
  protected async depoisDeAtualizar(id: string, data: any): Promise<void> {}

  /**
   * Hook executado antes da exclusão
   * Sobrescreva para validações específicas
   */
  protected async antesDeDesativar(id: string): Promise<void> {}

  /**
   * Hook executado após a exclusão
   * Sobrescreva para ações pós-exclusão
   */
  protected async depoisDeDesativar(id: string): Promise<void> {}

  /**
   * Hook executado antes da restauração
   * Sobrescreva para validações específicas
   */
  protected async antesDeReativar(id: string): Promise<void> {}

  /**
   * Hook executado após a restauração
   * Sobrescreva para ações pós-restauração
   */
  protected async depoisDeReativar(id: string): Promise<void> {}

  // ============================================================================
  // 🛡️ MÉTODOS PROTEGIDOS - VALIDAÇÕES E UTILITÁRIOS INTERNOS
  // ============================================================================

  /**
   * Valida se um campo é único na entidade
   */
  protected async validarSeEhUnico(
    field: string,
    value: any,
    excludeId?: string,
  ): Promise<boolean> {
    const whereClause: any = { [field]: value };

    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    // Só busca registros ativos (não deletados)
    whereClause.deletedAt = null;

    const existingEntity = await this.repository.buscarPrimeiro(
      this.entityName,
      whereClause,
    );

    return !existingEntity; // Retorna true se for único (não existe)
  }

  /**
   * Valida resultado da busca e lança erro se não encontrado
   */
  protected validarResultadoDaBusca(
    result: any,
    entity: string,
    identifier: string,
    value: string,
  ): any {
    if (!result) {
      throw new NotFoundError(entity, value, identifier);
    }
    return result;
  }

  // ============================================================================
  // 🔧 MÉTODOS PROTEGIDOS - UTILITÁRIOS PARA CLASSES FILHAS
  // ============================================================================

  /**
   * Obtém o usuário logado do contexto da requisição
   */
  protected obterUsuarioLogado(): any {
    return this.request?.user || null;
  }

  /**
   * Obtém o ID do usuário logado
   */
  protected obterUsuarioLogadoId(): string | null {
    return this.request?.user?.id || null;
  }

  /**
   * Obtém o companyId do contexto da requisição
   */
  protected obterCompanyId(): string | null {
    return (
      this.request?.user?.companyId || this.request?.query?.companyId || null
    );
  }

  // ============================================================================
  // 🔧 MÉTODOS PRIVADOS - UTILITÁRIOS INTERNOS
  // ============================================================================

  /**
   * Busca entidade aplicando filtros de soft delete
   */
  private async buscarEntidade(
    where: any,
    include: any = {},
    deletedAt: boolean = false,
  ) {
    const entity = await this.repository.buscarPrimeiro(
      this.entityName,
      {
        ...where,
        deletedAt: deletedAt ? { not: null } : null,
      },
      include,
    );
    return entity;
  }

  /**
   * Calcula informações de paginação
   */
  protected calcularInformacoesDePaginacao(
    page: number,
    limit: number,
    total: number,
  ) {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return { totalPages, hasNextPage, hasPreviousPage };
  }
}
