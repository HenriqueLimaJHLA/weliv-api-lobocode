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
import { CreateUserDto, UserStatus, UserRole } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE - Users (Administrator)
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable({ scope: Scope.REQUEST })
export class AdministratorUserService extends UniversalService<
  CreateUserDto,
  UpdateUserDto
> {
  private static readonly entityConfig = createEntityConfig('user');

  constructor(
    repository: UniversalRepository<CreateUserDto, UpdateUserDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) protected readonly request: any,
  ) {
    const { model, casl } = AdministratorUserService.entityConfig;
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
        company: {
          select: {
            id: true,
            name: true,
            cnpj: true,
            tradeName: true,
          },
        },
      },
      transform: {
        flatten: {
          company: { field: 'name', target: 'companyName' },
        },
        custom: (data) => {
          // Não expor campos sensíveis
          if (data.password) {
            delete data.password;
          }
          if (data.twoFactorSecret) {
            delete data.twoFactorSecret;
          }

          // Adicionar campos calculados
          if (data.lockedUntil) {
            data.isLocked = new Date(data.lockedUntil) > new Date();
          } else {
            data.isLocked = false;
          }

          // Verificar se é super admin
          data.isSuperAdmin = data.role === UserRole.SYSTEM_ADMIN;

          // Formatar telefone
          if (data.phone) {
            data.phoneFormatted = this.formatPhone(data.phone);
          }

          return data;
        },
        exclude: [
          'password',
          'twoFactorSecret',
          'loginAttempts',
          'lockedUntil',
        ],
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HOOKS
  // ═══════════════════════════════════════════════════════════════════════════════

  protected async antesDeCriar(data: CreateUserDto): Promise<void> {
    const user = this.obterUsuarioLogado();

    if (!user) {
      throw new ForbiddenError('Usuário não autenticado');
    }

    if (user.role !== UserRole.SYSTEM_ADMIN && user.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Apenas ADMIN ou SYSTEM_ADMIN pode criar usuários');
    }

    if (data.role === UserRole.SYSTEM_ADMIN && data.companyId) {
      throw new ForbiddenError('SYSTEM_ADMIN não pode pertencer a uma empresa');
    }

    if (data.role === UserRole.ADMIN && !data.companyId && user.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenError('ADMIN deve pertencer a uma empresa');
    }

    // Normalizar email
    const emailNormalizado = data.email.toLowerCase().trim();
    (data as any).email = emailNormalizado;

    // Validar email único
    const existeEmail = await this.repository.buscarPrimeiro(this.entityName, {
      email: emailNormalizado,
      deletedAt: null,
    });

    if (existeEmail) {
      throw new ConflictError(`Já existe um usuário com o email ${emailNormalizado}`);
    }

    // Validar CPF único
    if (data.cpf) {
      const cpfNormalizado = this.normalizarCPF(data.cpf);
      const existeCPF = await this.repository.buscarPrimeiro(this.entityName, {
        cpf: cpfNormalizado,
        deletedAt: null,
      });

      if (existeCPF) {
        throw new ConflictError(`Já existe um usuário com o CPF ${cpfNormalizado}`);
      }

      (data as any).cpf = cpfNormalizado;
    }
  }

  protected async antesDeAtualizar(id: string, data: UpdateUserDto): Promise<void> {
    const currentUser = this.obterUsuarioLogado();
    const usuario = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });

    if (!usuario) {
      throw new NotFoundError(this.entityName, id, 'id');
    }

    if (data.email) {
      const emailNormalizado = data.email.toLowerCase().trim();
      const existeEmail = await this.repository.buscarPrimeiro(this.entityName, {
        email: emailNormalizado,
        id: { not: id },
        deletedAt: null,
      });

      if (existeEmail) {
        throw new ConflictError(`Já existe outro usuário com o email ${emailNormalizado}`);
      }

      (data as any).email = emailNormalizado;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MÉTODOS CUSTOMIZADOS - STATUS
  // ═══════════════════════════════════════════════════════════════════════════════

  async activate(id: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'update');

    const usuario = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });

    if (!usuario) {
      throw new NotFoundError(this.entityName, id, 'id');
    }

    if (usuario.status === UserStatus.ACTIVE) {
      throw new ConflictError('Usuário já está ativo');
    }

    const updated = await this.repository.atualizar(this.entityName, { id }, { status: UserStatus.ACTIVE });
    return { data: this.transformData(updated) };
  }

  async deactivate(id: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'update');

    const usuario = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });

    if (!usuario) {
      throw new NotFoundError(this.entityName, id, 'id');
    }

    if (usuario.status === UserStatus.INACTIVE) {
      throw new ConflictError('Usuário já está inativo');
    }

    const updated = await this.repository.atualizar(this.entityName, { id }, { status: UserStatus.INACTIVE });
    return { data: this.transformData(updated) };
  }

  async suspend(id: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'update');

    const usuario = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });

    if (!usuario) {
      throw new NotFoundError(this.entityName, id, 'id');
    }

    if (usuario.status === UserStatus.SUSPENDED) {
      throw new ConflictError('Usuário já está suspenso');
    }

    const updated = await this.repository.atualizar(this.entityName, { id }, { status: UserStatus.SUSPENDED });
    return { data: this.transformData(updated) };
  }

  async unlock(id: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'update');

    const usuario = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });

    if (!usuario) {
      throw new NotFoundError(this.entityName, id, 'id');
    }

    const updated = await this.repository.atualizar(
      this.entityName,
      { id },
      { loginAttempts: 0, lockedUntil: null },
    );
    return { data: this.transformData(updated) };
  }

  async changeRole(id: string, role: string) {
    const currentUser = this.obterUsuarioLogado();

    if (currentUser?.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenError('Apenas SYSTEM_ADMIN pode alterar roles');
    }

    const usuario = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });

    if (!usuario) {
      throw new NotFoundError(this.entityName, id, 'id');
    }

    const updated = await this.repository.atualizar(this.entityName, { id }, { role });
    return { data: this.transformData(updated) };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MÉTODOS CUSTOMIZADOS - BUSCA
  // ═══════════════════════════════════════════════════════════════════════════════

  async buscarPorEmail(email: string) {
    if (!email?.trim()) {
      throw new ConflictError('Email é obrigatório');
    }

    this.permissionService.validarAction(this.entityNameCasl, 'read');

    const emailNormalizado = email.toLowerCase().trim();
    return this.buscarPorCampo('email', emailNormalizado);
  }

  async buscarPorRole(role: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'read');
    return this.buscarMuitosPorCampo('role', role);
  }

  async buscarPorStatus(status: UserStatus) {
    this.permissionService.validarAction(this.entityNameCasl, 'read');
    return this.buscarMuitosPorCampo('status', status);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MÉTODOS CUSTOMIZADOS - ESTATÍSTICAS
  // ═══════════════════════════════════════════════════════════════════════════════

  async obterResumoEstatisticas() {
    this.permissionService.validarAction(this.entityNameCasl, 'read');

    const where = { deletedAt: null };

    const [total, active, inactive, suspended, admin, user, systemAdmin] = await Promise.all([
      this.repository.contarTodos(this.entityName, where),
      this.repository.contarTodos(this.entityName, { ...where, status: UserStatus.ACTIVE }),
      this.repository.contarTodos(this.entityName, { ...where, status: UserStatus.INACTIVE }),
      this.repository.contarTodos(this.entityName, { ...where, status: UserStatus.SUSPENDED }),
      this.repository.contarTodos(this.entityName, { ...where, role: UserRole.ADMIN }),
      this.repository.contarTodos(this.entityName, { ...where, role: UserRole.USER }),
      this.repository.contarTodos(this.entityName, { ...where, role: UserRole.SYSTEM_ADMIN }),
    ]);

    return {
      data: {
        total,
        byStatus: { active, inactive, suspended },
        byRole: { admin, user, systemAdmin },
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════

  private normalizarCPF(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  private formatPhone(phone: string): string {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    if (numbers.length === 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }
    return phone;
  }
}
