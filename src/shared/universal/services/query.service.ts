import { Injectable } from '@nestjs/common';
import { CaslAbilityService } from '../../casl/casl-ability/casl-ability.service';
import { TenantService } from '../../tenant/tenant.service';
import { accessibleBy } from '@casl/prisma';
import { CrudAction } from '../../common/types';
import { EntityNameCasl } from '../types';
import { ForbiddenError } from '../../common/errors';
import { ERROR_MESSAGES } from 'src/shared/common/messages';

@Injectable()
export class UniversalQueryService {
  constructor(
    private abilityService: CaslAbilityService,
    private tenantService: TenantService,
  ) {}

  // ============================================================================
  // 📋 MÉTODOS PÚBLICOS - CONSTRUÇÃO DE WHERE CLAUSE
  // ============================================================================

  /**
   * Constrói where clause para operações de leitura
   */
  construirWhereClauseParaRead(
    entityName: EntityNameCasl,
    baseWhere: any = {},
  ): any {
    return this.construirWhereClauseBase(entityName, 'read', baseWhere);
  }

  /**
   * Where só por tenant (empresa) + soft-delete, **sem** `accessibleBy` (CASL).
   * Para listagens do painel operacional onde o escopo desejado é a empresa,
   * evitando união de regras (ex.: tutor + prestador no mesmo usuário).
   * Exige tenant não global (usuário com empresa ou SYSTEM_ADMIN com `companyId` na requisição).
   */
  construirWhereClauseSomenteEmpresa(
    entityName: EntityNameCasl,
    additionalWhere: any = {},
  ): any {
    const tenant = this.tenantService.getTenant();
    if (!tenant?.id || tenant.isGlobal) {
      throw new ForbiddenError(
        ERROR_MESSAGES.AUTHORIZATION.RESOURCE_ACCESS_DENIED,
      );
    }
    const whereClause: any = {
      ...additionalWhere,
      deletedAt: null,
    };
    this.aplicarFiltroCompanyId(whereClause, entityName, tenant.id);
    return whereClause;
  }

  /**
   * Constrói where clause para operações de atualização
   */
  construirWhereClauseParaUpdate(entityName: EntityNameCasl, id: string): any {
    return this.construirWhereClauseBase(entityName, 'update', { id });
  }

  /**
   * Constrói where clause para operações de criação
   */
  construirWhereClauseParaCreate(entityName: EntityNameCasl): any {
    return this.construirWhereClauseBase(entityName, 'create');
  }

  /**
   * Constrói where clause para operações de exclusão
   */
  construirWhereClauseParaDelete(entityName: EntityNameCasl, id: string): any {
    return this.construirWhereClauseBase(entityName, 'delete', { id });
  }

  // ============================================================================
  // 🔧 MÉTODOS PRIVADOS - LÓGICA CENTRALIZADA
  // ============================================================================

  /**
   * Verifica se uma entidade tem companyId direto no schema
   */
  private entidadeTemCompanyIdDireto(entityName: EntityNameCasl): boolean {
    return true;
  }

  /**
   * Aplica filtro de companyId baseado na estrutura da entidade
   */
  private aplicarFiltroCompanyId(
    whereClause: any,
    entityName: EntityNameCasl,
    companyId: string,
  ): void {
    // Company não precisa de filtro de companyId
    if (entityName === 'Company') {
      return;
    }

    // Se a entidade tem companyId direto, aplica diretamente
    if (this.entidadeTemCompanyIdDireto(entityName)) {
      whereClause.companyId = companyId;
      return;
    }

    // Se não há mapeamento e não tem companyId direto, não aplica filtro
    // (entidades que não precisam de filtro de company)
  }

  /**
   * Constrói where clause baseado na ação e filtros adicionais
   * Centraliza a lógica de construção de filtros Prisma com regras CASL
   */

  private construirWhereClauseBase(
    entityName: EntityNameCasl,
    action: CrudAction,
    additionalWhere: any = {},
  ): any {
    const ability = this.abilityService.ability;
    
    const tenant = this.tenantService.getTenant();

    try {
      const whereClause: any = {
        ...additionalWhere,
        AND: [accessibleBy(ability, action)[entityName]],
        deletedAt: null,
      };

      // Se não for tenant global e houver companyId, filtra por companyId
      // (em alguns fluxos administrativos o tenant pode não estar inicializado)
      if (tenant && !tenant.isGlobal && tenant.id) {
        this.aplicarFiltroCompanyId(whereClause, entityName, tenant.id);
      }

      return whereClause;
    } catch (error) {
      // Capturar ForbiddenError do CASL e relançar como erro mais específico
      if (error.name === 'ForbiddenError') {
        throw new ForbiddenError(
          ERROR_MESSAGES.AUTHORIZATION.RESOURCE_ACCESS_DENIED,
        );
      }
      // Re-throw outros erros
      throw error;
    }
  }
}
