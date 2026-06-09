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
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from 'src/shared/common/errors';
import { NotificationHelper } from 'src/modules/infrastructure/notifications/notification.helper';
import { ENTITY_TYPES } from 'src/modules/infrastructure/notifications/shared/notification.types';
import { UserExampleContextService } from './services/user-example-context.service';
import { CreateExampleDto, ExampleStatus } from './dto/create-example.dto';
import { UpdateExampleDto } from './dto/update-example.dto';

/**
 * COMPLEX · USER — orquestra CRUD com escopo de usuário autenticado.
 * Delega regras de contexto ao UserExampleContextService.
 */
@Injectable({ scope: Scope.REQUEST })
export class UserExampleService extends UniversalService<
  CreateExampleDto,
  UpdateExampleDto
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static readonly entityConfig = createEntityConfig('example' as any);

  constructor(
    repository: UniversalRepository<CreateExampleDto, UpdateExampleDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) request: any,
    private readonly userExampleContext: UserExampleContextService,
    private readonly notificationHelper: NotificationHelper,
  ) {
    const { model, casl } = UserExampleService.entityConfig;
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

  private setEntityConfig() {
    this.entityConfig = {
      includes: {
        owner: { select: { id: true, name: true } },
      },
      transform: {
        flatten: {
          owner: { field: 'name', target: 'ownerName' },
        },
        custom: (data) => {
          if (data.status === ExampleStatus.ACTIVE && data.endsAt) {
            const end = new Date(data.endsAt);
            if (!isNaN(end.getTime())) {
              data.isExpired = end.getTime() < Date.now();
            }
          }
          return data;
        },
        exclude: ['internalCode', 'rawPayload'],
      },
    };
  }

  protected async antesDeCriar(data: CreateExampleDto): Promise<void> {
    const user = this.obterUsuarioLogado();
    if (!user?.id) {
      throw new UnauthorizedError('Usuário não autenticado');
    }
    await this.userExampleContext.validarEPrepararParaCriacao(data, user.id);
  }

  protected async depoisDeCriar(entity: any): Promise<void> {
    try {
      const ownerId = entity.ownerId || entity.owner?.id;
      if (!ownerId) return;
      await this.notificationHelper.criar({
        title: `Exemplo criado: ${entity.name}`,
        message: `O registro "${entity.name}" foi criado.`,
        userId: ownerId,
        companyId: entity.companyId,
        entityType: ENTITY_TYPES.SYSTEM,
        entityId: entity.id,
        priority: 'NORMAL',
        recipients: [ownerId],
        allowSelfNotification: true,
      });
    } catch (err) {
      console.error('Erro ao criar notificação pós-criação de example:', err);
    }
  }

  protected async antesDeAtualizar(
    id: string,
    data: UpdateExampleDto,
  ): Promise<void> {
    const user = this.obterUsuarioLogado();
    if (!user?.id) {
      throw new UnauthorizedError('Usuário não autenticado');
    }
    await this.userExampleContext.validarEPrepararParaAtualizacaoDoUsuario(
      id,
      user.id,
      data,
    );
  }

  protected async antesDeDesativar(id: string): Promise<void> {
    const user = this.obterUsuarioLogado();
    if (!user?.id) {
      throw new ForbiddenError('Usuário não autenticado');
    }
    const entity = await this.repository.buscarPrimeiro(
      this.entityName,
      { id, deletedAt: null },
    );
    if (!entity) {
      throw new NotFoundError('example', id, 'id');
    }
    if (entity.ownerId !== user.id) {
      throw new ForbiddenError('Você só pode desativar seus próprios registros.');
    }
  }

  async obterMeuExample() {
    const user = this.obterUsuarioLogado();
    if (!user) throw new UnauthorizedError('Usuário não autenticado');
    this.permissionService.validarAction(this.entityNameCasl, 'read');
    const companyId = this.obterCompanyId();
    return this.userExampleContext.resolverRegistroDoUsuario(user.id, companyId);
  }

  async atualizarMeuExample(data: UpdateExampleDto) {
    const user = this.obterUsuarioLogado();
    if (!user) throw new UnauthorizedError('Usuário não autenticado');
    this.permissionService.validarAction(this.entityNameCasl, 'update');
    const companyId = this.obterCompanyId();
    return this.userExampleContext.atualizarRegistroDoUsuario(
      user.id,
      companyId,
      data,
    );
  }
}
