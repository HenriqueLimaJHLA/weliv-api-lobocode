import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import {
  UniversalService,
  UniversalRepository,
  UniversalMetricsService,
  UniversalQueryService,
  UniversalPermissionService,
} from 'src/shared/universal';
import { CreatePatientDto } from '../administrator/dto/create-patient.dto';
import { UpdatePatientDto } from '../administrator/dto/update-patient.dto';

@Injectable({ scope: Scope.REQUEST })
export class UserPatientsService extends UniversalService<
  CreatePatientDto,
  UpdatePatientDto
> {
  constructor(
    repository: UniversalRepository<CreatePatientDto, UpdatePatientDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) protected readonly request: any,
  ) {
    super(
      repository,
      queryService,
      permissionService,
      metricsService,
      request,
      'patient',
      'Patient',
    );
  }

  async meuPerfil() {
    const user = this.obterUsuarioLogado();
    if (!user) return null;

    const item = await this.repository.buscarPrimeiro(
      this.entityName,
      { userId: user.id, deletedAt: null },
      this.getIncludeConfig(),
    );

    return item ? { data: item } : null;
  }

  async atualizarMeuPerfil(dto: UpdatePatientDto) {
    const user = this.obterUsuarioLogado();
    if (!user) return null;

    const item = await this.repository.buscarPrimeiro(
      this.entityName,
      { userId: user.id, deletedAt: null },
    );

    if (!item) return null;

    return this.repository.atualizar(
      this.entityName,
      { id: item.id },
      dto,
      this.getIncludeConfig(),
    );
  }
}