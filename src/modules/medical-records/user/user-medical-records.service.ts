import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { UniversalService, UniversalRepository, UniversalMetricsService, UniversalQueryService, UniversalPermissionService } from 'src/shared/universal';
import { CreateMedicalRecordDto } from '../administrator/dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from '../administrator/dto/update-medical-record.dto';

@Injectable({ scope: Scope.REQUEST })
export class UserMedicalRecordsService extends UniversalService<CreateMedicalRecordDto, UpdateMedicalRecordDto> {
  constructor(
    repository: UniversalRepository<CreateMedicalRecordDto, UpdateMedicalRecordDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) protected readonly request: any,
  ) {
    super(repository, queryService, permissionService, metricsService, request, 'medicalRecord' as any, 'MedicalRecord' as any);
  }

  async meuProntuario() {
    const user = this.obterUsuarioLogado();
    if (!user) return null;
    const items = await this.repository.buscarMuitos(this.entityName, { patientId: user.id, deletedAt: null }, { orderBy: { createdAt: 'desc' } }, this.getIncludeConfig());
    return { data: items };
  }
}