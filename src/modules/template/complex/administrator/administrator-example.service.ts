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
import { AdministratorExampleContextService } from './services/administrator-example-context.service';
import {
  AdministratorExampleQueryService,
  ExampleAdminListParams,
} from './services/administrator-example-query.service';
import { CreateExampleDto, ExampleStatus } from './dto/create-example.dto';
import { UpdateExampleDto } from './dto/update-example.dto';

/**
 * COMPLEX · ADMINISTRATOR — orquestra CRUD administrativo e delega
 * validações ao AdministratorExampleContextService e queries ao
 * AdministratorExampleQueryService.
 */
@Injectable({ scope: Scope.REQUEST })
export class AdministratorExampleService extends UniversalService<
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
    @Optional() @Inject(REQUEST) protected readonly request: any,
    private readonly administratorExampleContext: AdministratorExampleContextService,
    private readonly administratorExampleQuery: AdministratorExampleQueryService,
  ) {
    const { model, casl } = AdministratorExampleService.entityConfig;
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
        company: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
      transform: {
        flatten: {
          company: { field: 'name', target: 'companyName' },
          owner: { field: 'name', target: 'ownerName' },
        },
        custom: (data) => {
          if (data.status === ExampleStatus.ACTIVE && data.endsAt) {
            const end = new Date(data.endsAt);
            if (!isNaN(end.getTime())) {
              data.isExpired = end.getTime() < Date.now();
            }
          }
          if (typeof data.amount === 'number') {
            data.amountReais = Math.round(data.amount) / 100;
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
    await this.administratorExampleContext.validarEPrepararParaCriacao(data);
  }

  protected async depoisDeCriar(entity: any): Promise<void> {
    // TODO: Implementar notificação
  }

  protected async antesDeAtualizar(
    id: string,
    data: UpdateExampleDto,
  ): Promise<void> {
    await this.administratorExampleContext.validarEPrepararParaAtualizacao(id, data);
  }

  protected async antesDeDesativar(id: string): Promise<void> {
    const entity = await this.repository.buscarPrimeiro(
      this.entityName,
      { id, deletedAt: null },
    );
    if (!entity) {
      throw new NotFoundError('example', id, 'id');
    }
    if (entity.status === ExampleStatus.ACTIVE) {
      throw new ForbiddenError(
        'Não é possível desativar um registro com status ACTIVE. Cancele-o primeiro.',
      );
    }
  }

  async listarParaAdmin(params: ExampleAdminListParams) {
    return this.administratorExampleQuery.listarParaAdmin(params);
  }

  async obterDetalhesParaAdmin(id: string) {
    return this.administratorExampleQuery.obterDetalhesParaAdmin(id);
  }

  async obterResumoEstatisticas() {
    const companyId = this.obterCompanyId();
    if (!companyId) {
      throw new ForbiddenError('Contexto de empresa não disponível.');
    }
    return this.administratorExampleQuery.obterResumoEstatisticas(companyId);
  }
}
