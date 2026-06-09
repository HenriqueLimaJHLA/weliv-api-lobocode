import { Injectable } from '@nestjs/common';
import { CaslService } from '../../casl/casl.service';
import { PermissionContextService } from '../../casl/services/permission-context.service';
import { PermissionAuditService } from '../../casl/services/permission-audit.service';

import { Roles, User } from '@prisma/client';
import { CrudAction } from '../../common/types';
import { EntityNameCasl, getModelName } from '../types';

@Injectable()
export class UniversalPermissionService {
  constructor(
    private caslService: CaslService,
    private contextService: PermissionContextService,
    private auditService: PermissionAuditService,
  ) {}

  // ============================================================================
  // 🔐 MÉTODOS PÚBLICOS - VALIDAÇÃO BÁSICA (Mantidos para compatibilidade)
  // ============================================================================

  /**
   * Verifica se o usuário pode realizar uma ação específica
   * Agora com auditoria automática integrada
   */
  validarAction(
    entityName: EntityNameCasl, 
    action: CrudAction,
    context?: {
      resourceId?: string;
      relatedIds?: Record<string, string>;
      ipAddress?: string;
      userAgent?: string;
      skipAudit?: boolean;
    }
  ): boolean {
    // TODO: Implementar quando método getCurrentUser estiver disponível
    // const user = this.contextService.getCurrentUser();
    let success = false;
    let errorMessage: string | undefined;

    try {
      success = this.caslService.validarAction(action, entityName);
      return success;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Permission denied';
      throw error;
    } finally {

    }
  }

  /**
   * Valida permissões para atualização de campos específicos
   */
  validarPermissoesDeCampo(
    entityName: EntityNameCasl,
    updateData: any,
  ): boolean {
    return this.caslService.validarPermissaoDeCampo(entityName, updateData);
  }

  // ============================================================================
  // 🎯 MÉTODOS PÚBLICOS - VALIDAÇÃO DE ROLE HIERÁRQUICO (RESTAURADO)
  // ============================================================================

  /**
   * Verifica se pode criar entidade com role específico
   */
  validarCriacaoDeEntidadeComRole(
    entityName: EntityNameCasl,
    targetRole: Roles,
  ): boolean {
    return this.validarPermissaoDeRole(entityName, 'create', targetRole);
  }

  /**
   * Verifica se pode atualizar entidade com role específico
   */
  validarAtualizacaoDeEntidadeComRole(
    entityName: EntityNameCasl,
    targetRole: Roles,
  ): boolean {
    return this.validarPermissaoDeRole(entityName, 'update', targetRole);
  }

  /**
   * Verifica se pode deletar entidade com role específico
   */
  validarDelecaoDeEntidadeComRole(
    entityName: EntityNameCasl,
    targetRole: Roles,
  ): boolean {
    return this.validarPermissaoDeRole(entityName, 'delete', targetRole);
  }

  /**
   * Validação centralizada para qualquer ação CRUD com role específico
   */
  validarAcaoDeEntidadeComRole(
    entityName: EntityNameCasl,
    action: CrudAction,
    targetRole: Roles,
  ): boolean {
    return this.validarPermissaoDeRole(entityName, action, targetRole);
  }

  // ============================================================================
  // 🎯 MÉTODOS PÚBLICOS - VALIDAÇÃO COM AUDITORIA (Recomendado)
  // ============================================================================

  /**
   * Valida ação com auditoria completa
   */
  validarComAuditoria(
    entityName: EntityNameCasl,
    user: User,
    action: CrudAction,
    context?: {
      resourceId?: string;
      ipAddress?: string;
      userAgent?: string;
      additionalContext?: Record<string, any>;
    },
  ): boolean {
    return this.auditService.validarComAuditoria(
      user,
      action,
      entityName,
      context,
    );
  }

  // ============================================================================
  // 🔧 MÉTODOS PÚBLICOS - VALIDAÇÃO CONTEXTUAL (Novo)
  // ============================================================================

  /**
   * Valida permissão considerando contexto do usuário
   */
  validarContextual(
    entityName: EntityNameCasl,
    user: User,
    action: CrudAction,
    context?: {
      postId?: string;
      companyId?: string;
      isOnShift?: boolean;
      timeOfDay?: 'day' | 'night';
    },
  ): boolean {
    const permissionContext = this.contextService.criarContexto(user, context);

    return this.contextService.validarPermissaoContextual(permissionContext, {
      action,
      subject: entityName,
      conditions: {
        companyId: context?.companyId,
        postId: context?.postId,
      },
      timeRestrictions:
        context?.timeOfDay === 'night'
          ? {
              startHour: 18,
              endHour: 6,
            }
          : undefined,
    });
  }

  /**
   * Valida permissão para operações de RH (horário comercial)
   */
  validarOperacaoRH(
    entityName: EntityNameCasl,
    user: User,
    action: CrudAction,
    context?: any,
  ): boolean {
    const permissionContext = this.contextService.criarContexto(user, context);

    return this.contextService.validarPermissaoContextual(permissionContext, {
      action,
      subject: entityName,
      timeRestrictions: {
        startHour: 8,
        endHour: 18,
      },
      conditions: {
        role: { in: ['HR', 'ADMIN'] },
      },
    });
  }

  // ============================================================================
  // 📊 MÉTODOS PÚBLICOS - MÉTRICAS E AUDITORIA (Novo)
  // ============================================================================

  /**
   * Obtém métricas de permissões de usuário
   */
  obterMetricas(periodo?: { inicio: Date; fim: Date }) {
    return this.auditService.obterMetricas(periodo);
  }

  /**
   * Obtém logs de auditoria de usuário
   */
  obterLogs(entityName: EntityNameCasl, filtros?: any, limit = 100) {
    return this.auditService.obterLogs(
      { ...filtros, subject: entityName },
      limit,
    );
  }

  /**
   * Exporta logs de usuário para análise
   */
  exportarLogs(formato: 'json' | 'csv' = 'json') {
    return this.auditService.exportarLogs(formato);
  }

  // ============================================================================
  // 🔧 MÉTODOS PRIVADOS - LÓGICA ESPECÍFICA DO USUÁRIO
  // ============================================================================

  /**
   * Valida se o usuário pode realizar ação específica com determinado role
   * Usa regras CASL para verificar permissões hierárquicas
   */
  private validarPermissaoDeRole(
    entityName: EntityNameCasl,
    action: CrudAction,
    targetRole: Roles,
  ): boolean {
    return this.caslService.validarPermissaoDeRole(
      action,
      entityName,
      targetRole,
    );
  }
}
