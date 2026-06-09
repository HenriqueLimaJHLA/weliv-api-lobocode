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
import { CreateExampleDto } from './dto/create-example.dto';
import { UpdateExampleDto } from './dto/update-example.dto';

@Injectable({ scope: Scope.REQUEST })
export class AdministratorExampleService extends UniversalService<
  CreateExampleDto,
  UpdateExampleDto
> {
  // 'example' deve estar registrado em PROJECT_PLUGIN_ENTITY_MAPPING antes de usar
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static readonly entityConfig = createEntityConfig('example' as any);

  constructor(
    repository: UniversalRepository<CreateExampleDto, UpdateExampleDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) request: any,
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
      includes: {},
      transform: {
        flatten: {},
        custom: undefined,
        exclude: [],
      },
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MINIMAL · ADMINISTRATOR: nenhum hook — Universal CRUD para ADMIN+.
  //
  // Endpoints disponíveis via herança de UniversalController:
  //   GET  /admin/examples?page=1&limit=10   → buscarComPaginacao
  //   GET  /admin/examples/all               → buscarTodos
  //   GET  /admin/examples/:id               → buscarPorId
  //   GET  /admin/examples/search/name       → buscarPorNome
  //   GET  /admin/examples/search/field      → buscarPorCampo
  //   POST /admin/examples                   → criar
  //   PATCH /admin/examples/:id              → atualizar
  //   DELETE /admin/examples/:id             → desativar (soft delete)
  //   POST /admin/examples/:id/restore       → reativar
  //   GET  /admin/examples/metrics           → métricas Prometheus
  // ══════════════════════════════════════════════════════════════════════════
}
