import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { UniversalService, UniversalRepository, UniversalMetricsService, UniversalQueryService, UniversalPermissionService } from 'src/shared/universal';
import { NotFoundError } from 'src/shared/common/errors';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';

@Injectable({ scope: Scope.REQUEST })
export class AdministratorMedicalRecordsService extends UniversalService<CreateMedicalRecordDto, UpdateMedicalRecordDto> {
  constructor(
    repository: UniversalRepository<CreateMedicalRecordDto, UpdateMedicalRecordDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) protected readonly request: any,
  ) {
    super(repository, queryService, permissionService, metricsService, request, 'medicalRecord' as any, 'MedicalRecord' as any);
  }

  private setEntityConfig() {
    this.entityConfig = {
      includes: {
        patient: { include: { user: { select: { id: true, name: true } } } },
        professional: { include: { user: { select: { id: true, name: true } } } },
      },
      transform: { exclude: [] },
    };
  }

  async listarProntuarios(page = 1, limit = 20, patientId?: string) {
    const companyId = this.obterCompanyId();
    const where: any = { deletedAt: null };
    if (companyId) where.companyId = companyId;
    if (patientId) where.patientId = patientId;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.buscarMuitos(this.entityName, where, { orderBy: { createdAt: 'desc' }, skip, take: limit }, this.getIncludeConfig()),
      this.repository.contarTodos(this.entityName, where),
    ]);
    return { data, pagination: this.paginar(page, limit, total) };
  }

  async buscarProntuarioPorId(id: string) {
    const item = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null }, this.getIncludeConfig());
    if (!item) throw new NotFoundError('MedicalRecord', id, 'id');
    return { data: item };
  }

  async criarProntuario(dto: CreateMedicalRecordDto) {
    const companyId = this.obterCompanyId();
    const data = await this.repository.criar(this.entityName, { ...dto, companyId: companyId || undefined }, this.getIncludeConfig());
    return { data };
  }

  async atualizarProntuario(id: string, dto: UpdateMedicalRecordDto) {
    await this.validarProntuarioExiste(id);
    const data = await this.repository.atualizar(this.entityName, { id }, dto, this.getIncludeConfig());
    return { data };
  }

  async buscarPorPaciente(patientId: string) {
    const items = await this.repository.buscarMuitos(this.entityName, { patientId, deletedAt: null }, { orderBy: { createdAt: 'desc' } }, this.getIncludeConfig());
    return { data: items };
  }

  private async validarProntuarioExiste(id: string) {
    const item = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });
    if (!item) throw new NotFoundError('MedicalRecord', id, 'id');
    return item;
  }

  private paginar(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
  }
}