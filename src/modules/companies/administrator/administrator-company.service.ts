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
import { ForbiddenError, ConflictError, NotFoundError } from 'src/shared/common/errors';
import { CreateCompanyDto, CompanyStatus } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE - Companies (Administrator)
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable({ scope: Scope.REQUEST })
export class AdministratorCompanyService extends UniversalService<
  CreateCompanyDto,
  UpdateCompanyDto
> {
  private static readonly entityConfig = createEntityConfig('company');

  constructor(
    repository: UniversalRepository<CreateCompanyDto, UpdateCompanyDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) protected readonly request: any,
  ) {
    const { model, casl } = AdministratorCompanyService.entityConfig;
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

  // ═══════════════════════════════════════════════════════════════════════════════
  // CONFIGURAÇÃO DE ENTITY
  // ═══════════════════════════════════════════════════════════════════════════════

  private setEntityConfig() {
    this.entityConfig = {
      includes: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
      transform: {
        flatten: {},
        custom: (data) => {
          // CNPJ formatado
          if (data.cnpj) {
            data.cnpjFormatted = this.formatCNPJ(data.cnpj);
          }

          // CEP formatado
          if (data.zipCode) {
            data.zipCodeFormatted = this.formatCEP(data.zipCode);
          }

          // Contadores
          if (data.users) {
            data.userCount = data.users.length;
            data.adminCount = data.users.filter((u: any) => u.role === 'ADMIN').length;
          }

          // Status badge
          data.statusBadge = this.getStatusBadge(data.status);

          // Endereço completo
          if (data.address) {
            data.fullAddress = [
              data.address,
              data.addressNumber,
              data.addressComplement,
              data.neighborhood,
              data.city,
              data.state,
              data.zipCode,
            ]
              .filter(Boolean)
              .join(', ');
          }

          return data;
        },
        exclude: [
          'payoutPixKey',
          'payoutBankAccount',
          'payoutBankAccountDigit',
        ],
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HOOKS DE CICLO DE VIDA
  // ═══════════════════════════════════════════════════════════════════════════════

  protected async antesDeCriar(data: CreateCompanyDto): Promise<void> {
    const user = this.obterUsuarioLogado();

    if (!user) {
      throw new ForbiddenError('Usuário não autenticado');
    }

    if (user.role !== 'SYSTEM_ADMIN') {
      throw new ForbiddenError('Apenas SYSTEM_ADMIN pode criar empresas');
    }

    // Validar CNPJ único
    if (data.cnpj) {
      const cnpjNormalizado = this.normalizarCNPJ(data.cnpj);
      const existe = await this.repository.buscarPrimeiro(this.entityName, {
        cnpj: cnpjNormalizado,
        deletedAt: null,
      });

      if (existe) {
        throw new ConflictError(`Já existe uma empresa com o CNPJ ${cnpjNormalizado}`);
      }

      (data as any).cnpj = cnpjNormalizado;
    }

    // Normalizar campos
    if (data.name) {
      (data as any).name = data.name.trim();
    }

    if (data.contactEmail) {
      (data as any).contactEmail = data.contactEmail.toLowerCase().trim();
    }

    // Definir status inicial
    if (!data.status) {
      (data as any).status = CompanyStatus.PENDING;
    }
  }

  protected async depoisDeCriar(entity: any): Promise<void> {
    // TODO: Implementar notificação usando NotificationsModule
    // Por enquanto, não faz nada
  }

  protected async antesDeAtualizar(id: string, data: UpdateCompanyDto): Promise<void> {
    if (data.cnpj) {
      const cnpjNormalizado = this.normalizarCNPJ(data.cnpj);
      const existe = await this.repository.buscarPrimeiro(this.entityName, {
        cnpj: cnpjNormalizado,
        id: { not: id },
        deletedAt: null,
      });

      if (existe) {
        throw new ConflictError(`Já existe outra empresa com o CNPJ ${cnpjNormalizado}`);
      }

      (data as any).cnpj = cnpjNormalizado;
    }

    const empresa = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });

    if (!empresa) {
      throw new NotFoundError(this.entityName, id, 'id');
    }

    if (empresa.status === CompanyStatus.CANCELLED && data.status !== CompanyStatus.CANCELLED) {
      throw new ForbiddenError('Empresa cancelada não pode ser reativada');
    }
  }

  protected async antesDeDesativar(id: string): Promise<void> {
    const empresa = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });

    if (!empresa) {
      throw new NotFoundError(this.entityName, id, 'id');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MÉTODOS CUSTOMIZADOS - STATUS
  // ═══════════════════════════════════════════════════════════════════════════════

  async approve(id: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'update');

    const empresa = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });

    if (!empresa) {
      throw new NotFoundError(this.entityName, id, 'id');
    }

    if (empresa.status !== CompanyStatus.PENDING) {
      throw new ForbiddenError('Apenas empresas PENDING podem ser aprovadas');
    }

    const updated = await this.repository.atualizar(this.entityName, { id }, { status: CompanyStatus.APPROVED });
    return { data: this.transformData(updated) };
  }

  async reject(id: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'update');

    const empresa = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });

    if (!empresa) {
      throw new NotFoundError(this.entityName, id, 'id');
    }

    if (empresa.status !== CompanyStatus.PENDING) {
      throw new ForbiddenError('Apenas empresas PENDING podem ser rejeitadas');
    }

    const updated = await this.repository.atualizar(this.entityName, { id }, { status: CompanyStatus.CANCELLED });
    return { data: this.transformData(updated) };
  }

  async activate(id: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'update');

    const empresa = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });

    if (!empresa) {
      throw new NotFoundError(this.entityName, id, 'id');
    }

    if (empresa.status !== CompanyStatus.APPROVED && empresa.status !== CompanyStatus.TRIAL) {
      throw new ForbiddenError('Apenas empresas APPROVED ou TRIAL podem ser ativadas');
    }

    const updated = await this.repository.atualizar(this.entityName, { id }, { status: CompanyStatus.ACTIVE });
    return { data: this.transformData(updated) };
  }

  async suspend(id: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'update');

    const empresa = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });

    if (!empresa) {
      throw new NotFoundError(this.entityName, id, 'id');
    }

    if (empresa.status !== CompanyStatus.ACTIVE) {
      throw new ForbiddenError('Apenas empresas ACTIVE podem ser suspensas');
    }

    const updated = await this.repository.atualizar(this.entityName, { id }, { status: CompanyStatus.SUSPENDED });
    return { data: this.transformData(updated) };
  }

  async block(id: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'update');

    const empresa = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });

    if (!empresa) {
      throw new NotFoundError(this.entityName, id, 'id');
    }

    if (empresa.status !== CompanyStatus.ACTIVE) {
      throw new ForbiddenError('Apenas empresas ACTIVE podem ser bloqueadas');
    }

    const updated = await this.repository.atualizar(this.entityName, { id }, { status: CompanyStatus.BLOCKED });
    return { data: this.transformData(updated) };
  }

  async cancel(id: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'update');

    const empresa = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });

    if (!empresa) {
      throw new NotFoundError(this.entityName, id, 'id');
    }

    if (empresa.status === CompanyStatus.CANCELLED) {
      throw new ForbiddenError('Empresa já está cancelada');
    }

    const updated = await this.repository.atualizar(this.entityName, { id }, { status: CompanyStatus.CANCELLED });
    return { data: this.transformData(updated) };
  }

  async startTrial(id: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'update');

    const empresa = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });

    if (!empresa) {
      throw new NotFoundError(this.entityName, id, 'id');
    }

    if (empresa.status !== CompanyStatus.APPROVED) {
      throw new ForbiddenError('Apenas empresas APPROVED podem iniciar trial');
    }

    const updated = await this.repository.atualizar(this.entityName, { id }, { status: CompanyStatus.TRIAL });
    return { data: this.transformData(updated) };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MÉTODOS CUSTOMIZADOS - BUSCA
  // ═══════════════════════════════════════════════════════════════════════════════

  async buscarPorCNPJ(cnpj: string) {
    if (!cnpj?.trim()) {
      throw new ConflictError('CNPJ é obrigatório');
    }

    this.permissionService.validarAction(this.entityNameCasl, 'read');

    const cnpjNormalizado = this.normalizarCNPJ(cnpj);
    return this.buscarPorCampo('cnpj', cnpjNormalizado);
  }

  async buscarPorNome(nome: string) {
    if (!nome?.trim()) {
      throw new ConflictError('Nome é obrigatório');
    }

    this.permissionService.validarAction(this.entityNameCasl, 'read');

    const result = await this.repository.buscarPrimeiro(this.entityName, {
      name: { contains: nome.trim(), mode: 'insensitive' },
      deletedAt: null,
    });

    return { data: this.transformData(result) };
  }

  async buscarPorStatus(status: CompanyStatus) {
    this.permissionService.validarAction(this.entityNameCasl, 'read');
    return this.buscarMuitosPorCampo('status', status);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MÉTODOS CUSTOMIZADOS - ESTATÍSTICAS
  // ═══════════════════════════════════════════════════════════════════════════════

  async obterResumoEstatisticas() {
    this.permissionService.validarAction(this.entityNameCasl, 'read');

    const where = { deletedAt: null };

    const [total, pending, approved, active, trial, suspended, blocked, cancelled] = await Promise.all([
      this.repository.contarTodos(this.entityName, where),
      this.repository.contarTodos(this.entityName, { ...where, status: CompanyStatus.PENDING }),
      this.repository.contarTodos(this.entityName, { ...where, status: CompanyStatus.APPROVED }),
      this.repository.contarTodos(this.entityName, { ...where, status: CompanyStatus.ACTIVE }),
      this.repository.contarTodos(this.entityName, { ...where, status: CompanyStatus.TRIAL }),
      this.repository.contarTodos(this.entityName, { ...where, status: CompanyStatus.SUSPENDED }),
      this.repository.contarTodos(this.entityName, { ...where, status: CompanyStatus.BLOCKED }),
      this.repository.contarTodos(this.entityName, { ...where, status: CompanyStatus.CANCELLED }),
    ]);

    return {
      data: {
        total,
        byStatus: { pending, approved, active, trial, suspended, blocked, cancelled },
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════

  private normalizarCNPJ(cnpj: string): string {
    return cnpj.replace(/\D/g, '');
  }

  private formatCNPJ(cnpj: string): string {
    const numbers = cnpj.replace(/\D/g, '');
    if (numbers.length === 14) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12)}`;
    }
    return cnpj;
  }

  private formatCEP(cep: string): string {
    const numbers = cep.replace(/\D/g, '');
    if (numbers.length === 8) {
      return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
    }
    return cep;
  }

  private getStatusBadge(status: string): { label: string; color: string } {
    const badges: Record<string, { label: string; color: string }> = {
      PENDING: { label: 'Pendente', color: 'yellow' },
      APPROVED: { label: 'Aprovada', color: 'blue' },
      ACTIVE: { label: 'Ativa', color: 'green' },
      TRIAL: { label: 'Trial', color: 'purple' },
      SUSPENDED: { label: 'Suspensa', color: 'orange' },
      BLOCKED: { label: 'Bloqueada', color: 'red' },
      CANCELLED: { label: 'Cancelada', color: 'gray' },
    };
    return badges[status] || { label: status, color: 'gray' };
  }
}
