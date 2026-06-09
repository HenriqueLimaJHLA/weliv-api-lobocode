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
export class UserExampleService extends UniversalService<
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
      includes: {},
      transform: {
        flatten: {},
        custom: undefined,
        exclude: [],
      },
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MINIMAL · USER: nenhum hook — CASL filtra o que o USER pode ler.
  //
  // Endpoints disponíveis (USER = leitura; ADMIN+ = escrita):
  //   GET  /user/examples?page=1&limit=10   → buscarComPaginacao
  //   GET  /user/examples/all               → buscarTodos
  //   GET  /user/examples/:id               → buscarPorId
  //   GET  /user/examples/search/name       → buscarPorNome
  //   GET  /user/examples/search/field      → buscarPorCampo
  // ══════════════════════════════════════════════════════════════════════════
}
