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
  ConflictError,
} from 'src/shared/common/errors';
import { CreateExampleDto, ExampleStatus } from './dto/create-example.dto';
import { UpdateExampleDto } from './dto/update-example.dto';

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
        relatedEntity: { select: { id: true, name: true } },
      },
      transform: {
        flatten: {
          relatedEntity: { field: 'name', target: 'relatedEntityName' },
        },
        custom: (data) => {
          if (
            data.status !== ExampleStatus.INACTIVE &&
            data.dueDate
          ) {
            const due = new Date(data.dueDate);
            if (!isNaN(due.getTime()) && due.getTime() < Date.now()) {
              data.isOverdue = true;
            } else {
              data.isOverdue = false;
            }
          }
          return data;
        },
        exclude: ['internalCode'],
      },
    };
  }

  protected async antesDeCriar(data: CreateExampleDto): Promise<void> {
    const user = this.obterUsuarioLogado();
    if (!user?.id) {
      throw new ForbiddenError('Usuário não autenticado');
    }
    if (data.code) {
      (data as any).code = data.code.trim().toUpperCase();
      const whereUnicidade = this.queryService.construirWhereClauseParaRead(
        this.entityNameCasl,
        { code: (data as any).code },
      );
      const existe = await this.repository.buscarPrimeiro(
        this.entityName,
        whereUnicidade,
      );
      if (existe) {
        throw new ConflictError(
          `Já existe um registro com o código ${(data as any).code}`,
        );
      }
    }
    if (!data.status) {
      (data as any).status = ExampleStatus.PENDING;
    }
    if (data.dueDate && typeof data.dueDate === 'string') {
      (data as any).dueDate = new Date(data.dueDate);
    }
  }

  protected async depoisDeCriar(entity: any): Promise<void> {
    // TODO: Implementar notificação
  }

  protected async antesDeAtualizar(
    id: string,
    data: UpdateExampleDto,
  ): Promise<void> {
    if (data.code) {
      (data as any).code = data.code.trim().toUpperCase();
      const whereUnicidade = this.queryService.construirWhereClauseParaRead(
        this.entityNameCasl,
        { code: (data as any).code },
      );
      const existe = await this.repository.buscarPrimeiro(
        this.entityName,
        { ...whereUnicidade, id: { not: id } },
      );
      if (existe) {
        throw new ConflictError(
          `Já existe outro registro com o código ${(data as any).code}`,
        );
      }
    }
    if (data.dueDate && typeof data.dueDate === 'string') {
      (data as any).dueDate = new Date(data.dueDate);
    }
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
        'Desative o registro antes de excluí-lo ou cancele-o primeiro.',
      );
    }
  }

  async buscarPorCodigo(code: string) {
    if (!code?.trim()) {
      throw new ConflictError('O parâmetro code é obrigatório');
    }
    this.permissionService.validarAction(this.entityNameCasl, 'read');
    return this.buscarPorCampo('code', code.trim().toUpperCase());
  }

  async buscarPorStatus(status: ExampleStatus) {
    this.permissionService.validarAction(this.entityNameCasl, 'read');
    return this.buscarMuitosPorCampo('status', status);
  }

  async obterResumoEstatisticas() {
    const companyId = this.obterCompanyId();
    if (!companyId) {
      throw new ForbiddenError('Contexto de empresa não disponível.');
    }
    this.permissionService.validarAction(this.entityNameCasl, 'read');
    const where = this.queryService.construirWhereClauseParaRead(
      this.entityNameCasl,
      {},
    );
    const [total, ativos, pendentes] = await Promise.all([
      this.repository.contarTodos(this.entityName, where),
      this.repository.contarTodos(this.entityName, {
        ...where,
        status: ExampleStatus.ACTIVE,
      }),
      this.repository.contarTodos(this.entityName, {
        ...where,
        status: ExampleStatus.PENDING,
      }),
    ]);
    return {
      data: { total, ativos, pendentes },
    };
  }
}
