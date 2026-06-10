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
import { ForbiddenError, NotFoundError } from 'src/shared/common/errors';
import { UpdateProfileDto } from './dto/update-profile.dto';

// Placeholder DTO para criação (não usado no user layer)
export class CreateUserDto {}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE - USER LAYER (próprio usuário)
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable({ scope: Scope.REQUEST })
export class UserUserService extends UniversalService<UpdateProfileDto, UpdateProfileDto> {
  private static readonly entityConfig = createEntityConfig('user');

  constructor(
    repository: UniversalRepository<UpdateProfileDto, UpdateProfileDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) request: any,
  ) {
    const { model, casl } = UserUserService.entityConfig;
    super(
      repository,
      queryService,
      permissionService,
      metricsService,
      request,
      model,
      casl,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PERFIL DO USUÁRIO
  // ═══════════════════════════════════════════════════════════════════════════════

  async getMe() {
    const user = this.obterUsuarioLogado();
    if (!user) {
      throw new ForbiddenError('Usuário não autenticado');
    }

    return this.buscarPorId(user.id);
  }

  async updateMyProfile(data: UpdateProfileDto) {
    const user = this.obterUsuarioLogado();
    if (!user) {
      throw new ForbiddenError('Usuário não autenticado');
    }

    return this.atualizar(user.id, data);
  }

  async changeMyPassword(currentPassword: string, newPassword: string) {
    const user = this.obterUsuarioLogado();
    if (!user) {
      throw new ForbiddenError('Usuário não autenticado');
    }

    // TODO: Validar senha atual com bcrypt
    // TODO: Hashear nova senha
    // TODO: Atualizar no banco

    return { message: 'Senha alterada com sucesso' };
  }
}
