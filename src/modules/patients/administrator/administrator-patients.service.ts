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
import { NotFoundError, ConflictError } from 'src/shared/common/errors';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE - Patients (Administrator)
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable({ scope: Scope.REQUEST })
export class AdministratorPatientsService extends UniversalService<
  CreatePatientDto,
  UpdatePatientDto
> {
  private static readonly entityConfig = createEntityConfig('patient');

  constructor(
    repository: UniversalRepository<CreatePatientDto, UpdatePatientDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) protected readonly request: any,
  ) {
    const { model, casl } = AdministratorPatientsService.entityConfig;
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            cpf: true,
            birthDate: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            tradeName: true,
          },
        },
      },
      transform: {
        exclude: [],
      },
    };
  }

  /**
   * Lista pacientes com paginação
   */
  async listarPacientes(page = 1, limit = 20, careStatus?: string) {
    const companyId = this.obterCompanyId();
    const where: any = { deletedAt: null };

    if (companyId) where.companyId = companyId;
    if (careStatus) where.careStatus = careStatus;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.buscarMuitos(
        this.entityName,
        where,
        { orderBy: { createdAt: 'desc' }, skip, take: limit },
        this.getIncludeConfig(),
      ),
      this.repository.contarTodos(this.entityName, where),
    ]);

    return {
      data,
      pagination: this.paginar(page, limit, total),
    };
  }

  /**
   * Busca paciente por ID
   */
  async buscarPacientePorId(id: string) {
    const item = await this.repository.buscarPrimeiro(
      this.entityName,
      { id, deletedAt: null },
      this.getIncludeConfig(),
    );

    if (!item) {
      throw new NotFoundError('Patient', id, 'id');
    }

    return { data: item };
  }

  /**
   * Busca paciente por userId
   */
  async buscarPorUserId(userId: string) {
    const item = await this.repository.buscarPrimeiro(
      this.entityName,
      { userId, deletedAt: null },
      this.getIncludeConfig(),
    );

    if (!item) {
      throw new NotFoundError('Patient', userId, 'userId');
    }

    return { data: item };
  }

  /**
   * Cria novo paciente
   */
  async criarPaciente(dto: CreatePatientDto) {
    const companyId = this.obterCompanyId();

    // Validar userId existe
    const user = await this.repository.buscarPrimeiro('user', { id: dto.userId });
    if (!user) {
      throw new NotFoundError('User', dto.userId, 'id');
    }

    // Validar não existe paciente para este user na empresa
    const existePaciente = await this.repository.buscarPrimeiro(this.entityName, {
      userId: dto.userId,
      companyId: companyId || undefined,
      deletedAt: null,
    });

    if (existePaciente) {
      throw new ConflictError('Já existe um paciente vinculado a este usuário nesta empresa');
    }

    const data = await this.repository.criar(
      this.entityName,
      {
        ...dto,
        companyId: companyId || undefined,
      },
      this.getIncludeConfig(),
    );

    return { data };
  }

  /**
   * Atualiza paciente
   */
  async atualizarPaciente(id: string, dto: UpdatePatientDto) {
    await this.validarPacienteExiste(id);

    const data = await this.repository.atualizar(
      this.entityName,
      { id },
      dto,
      this.getIncludeConfig(),
    );

    return { data };
  }

  /**
   * Desativa paciente (soft delete)
   */
  async desativarPaciente(id: string) {
    await this.validarPacienteExiste(id);
    await this.repository.desativar(this.entityName, { id });

    return { message: 'Paciente desativado com sucesso' };
  }

  /**
   * Marca paciente como needing attention
   */
  async marcarAtencao(id: string) {
    await this.validarPacienteExiste(id);
    await this.repository.atualizar(
      this.entityName,
      { id },
      { careStatus: 'NEEDS_ATTENTION' },
      this.getIncludeConfig(),
    );

    return { message: 'Paciente marcado como needing attention' };
  }

  private async validarPacienteExiste(id: string) {
    const item = await this.repository.buscarPrimeiro(this.entityName, {
      id,
      deletedAt: null,
    });

    if (!item) {
      throw new NotFoundError('Patient', id, 'id');
    }

    return item;
  }

  private paginar(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}