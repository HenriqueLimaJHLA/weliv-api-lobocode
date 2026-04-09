import { Injectable } from '@nestjs/common';
import { CaslAbilityService } from './casl-ability/casl-ability.service';
import { AppAbility } from './casl-ability/casl-ability.service';
import { ForbiddenError } from '../common/errors';
import { ERROR_MESSAGES } from '../common/messages';
import { Roles } from '@prisma/client';
import { EntityNameCasl } from '../universal/types';

export type CrudAction = 'create' | 'read' | 'update' | 'delete';

@Injectable()
export class CaslService {
  constructor(private abilityService: CaslAbilityService) {}

  // ============================================================================
  // 📋 MÉTODOS PÚBLICOS - VALIDAÇÕES GENÉRICAS
  // ============================================================================

  /**
   * Valida se o usuário pode realizar uma ação em uma entidade
   */
  validarAction(action: CrudAction, entity: EntityNameCasl): boolean {
    const ability = this.abilityService.ability;

    if (!ability.can(action as any, entity)) {
      throw new ForbiddenError(
        ERROR_MESSAGES.AUTHORIZATION.RESOURCE_ACCESS_DENIED,
      );
    }

    return true;
  }

  /**
   * Valida permissões de campo para atualização
   */
  validarPermissaoDeCampo(entity: EntityNameCasl, updateData: any): boolean {
    const ability = this.abilityService.ability;

    // Verifica se tem permissão geral para update
    const canUpdateGeneral = ability.can('update' as any, entity);
    if (!canUpdateGeneral) {
      throw new ForbiddenError(
        ERROR_MESSAGES.AUTHORIZATION.RESOURCE_ACCESS_DENIED,
      );
    }

    const updateRules = ability.rulesFor('update' as any, entity);

    // VALIDAÇÃO GRANULAR: Verificar cada campo individualmente
    const fieldsToUpdate = Object.keys(updateData);

    // Se não há campos para atualizar, retorna true
    if (fieldsToUpdate.length === 0) {
      return true;
    }

    // Analisa as regras CASL para entender permissões por campo
    const allowedFields = this.extrairCamposPermitidosDasRules(updateRules);

    // Verifica cada campo específico
    for (const field of fieldsToUpdate) {
      let canUpdateField = false;

      // Se temos campos específicos definidos nas regras, verifica se o campo está permitido
      if (allowedFields.length > 0) {
        canUpdateField =
          allowedFields.includes(field) || allowedFields.includes('*');
      } else {
        // Se não há campos específicos, usa permissão geral
        canUpdateField = canUpdateGeneral;
      }

      if (!canUpdateField) {
        throw new ForbiddenError(
          ERROR_MESSAGES.AUTHORIZATION.RESOURCE_ACCESS_DENIED,
        );
      }
    }
    return true;
  }

  /**
   * Valida se o usuário pode realizar ação específica com determinado role
   */
  validarPermissaoDeRole(
    action: CrudAction,
    entity: EntityNameCasl,
    targetRole: Roles,
  ): boolean {
    const ability = this.abilityService.ability;

    // Se o usuário tem permissão 'manage all' (SYSTEM_ADMIN), pode realizar qualquer ação
    if (ability.can('manage' as any, 'all')) {
      return true;
    }

    try {
      const rules = ability.rulesFor(action as any, entity);

      for (const rule of rules as any[]) {
        if (rule.conditions?.role?.in) {
          if (rule.conditions.role.in.includes(targetRole)) {
            return true;
          }
        }
      }

      throw new ForbiddenError(
        ERROR_MESSAGES.AUTHORIZATION.RESOURCE_ACCESS_DENIED,
      );
    } catch (error) {
      throw new ForbiddenError(
        ERROR_MESSAGES.AUTHORIZATION.RESOURCE_ACCESS_DENIED,
      );
    }
  }

  /**
   * Extrai campos permitidos das regras CASL
   */
  extrairCamposPermitidos(entity: EntityNameCasl, action: string): string[] {
    const ability = this.abilityService.ability;
    const rules = ability.rulesFor(action as any, entity);
    return this.extrairCamposPermitidosDasRules(rules);
  }

  /**
   * Obtém a ability atual
   */
  getAbility(): AppAbility {
    return this.abilityService.ability;
  }

  // ============================================================================
  // 🔧 MÉTODOS PRIVADOS - LÓGICA CENTRALIZADA
  // ============================================================================

  /**
   * Extrai campos permitidos das regras CASL
   */
  private extrairCamposPermitidosDasRules(rules: any[]): string[] {
    const allowedFields: string[] = [];

    for (const rule of rules) {
      // Se a regra tem campos específicos definidos
      if (rule.fields) {
        if (Array.isArray(rule.fields)) {
          allowedFields.push(...rule.fields);
        } else if (typeof rule.fields === 'string') {
          allowedFields.push(rule.fields);
        }
      }

      // Se a regra é 'manage all', permite todos os campos
      if (rule.action === 'manage' && rule.subject === 'all') {
        allowedFields.push('*');
      }
    }

    return Array.from(new Set(allowedFields)); // Remove duplicatas
  }
}
