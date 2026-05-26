import { Injectable } from '@nestjs/common';
import { Prisma, Roles, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { UserRepository } from './repositories/user.repository';
import { UserValidator } from './validators/user.validator';
import { UserFactory } from './factories/user.factory';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from 'src/shared/common/errors';
import { SUCCESS_MESSAGES } from 'src/shared/common/messages';
// FilesService importado para futura remoção de avatar antigo quando disponível

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userValidator: UserValidator,
    private readonly userFactory: UserFactory,
  ) {}

  // ============================================================================
  // CRUD BÁSICO
  // ============================================================================

  async buscarTodos(page = 1, limit = 20, orderBy = 'name', orderDirection: 'asc' | 'desc' = 'asc') {
    const skip = (page - 1) * limit;
    const where: Prisma.UserWhereInput = { deletedAt: null };

    const [users, total] = await Promise.all([
      this.userRepository.buscarMuitos(where, { skip, take: limit, orderBy: { [orderBy]: orderDirection } }),
      this.userRepository.contar(where),
    ]);

    return {
      data: users.map(this.sanitizarUsuario),
      pagination: this.paginar(page, limit, total),
    };
  }

  async buscarPorId(id: string) {
    const user = await this.userRepository.buscarUnico({ id });
    if (!user || user.deletedAt) throw new NotFoundError('User', id, 'id');
    return { data: this.sanitizarUsuario(user) };
  }

  async atualizar(id: string, dto: UpdateUserDto) {
    await this.validarExistencia(id);
    const data = this.prepararDadosParaUpdate(dto);
    const updated = await this.userRepository.atualizar({ id }, data);
    return { data: this.sanitizarUsuario(updated) };
  }

  async desativar(id: string) {
    await this.validarExistencia(id);
    const result = await this.userRepository.atualizar({ id }, { deletedAt: new Date() });
    return { message: SUCCESS_MESSAGES.CRUD.DELETED, data: this.sanitizarUsuario(result) };
  }

  async reativar(id: string) {
    const user = await this.userRepository.buscarUnico({ id });
    if (!user || !user.deletedAt) throw new NotFoundError('User', id, 'id');
    const result = await this.userRepository.atualizar({ id }, { deletedAt: null });
    return { message: SUCCESS_MESSAGES.CRUD.RESTORED, data: this.sanitizarUsuario(result) };
  }

  // ============================================================================
  // CRIAÇÃO POR TIPO
  // ============================================================================

  async criarNovoPaciente(dto: any) {
    await this.userValidator.validarSeEmailEhUnico(dto.email);
    await this.userValidator.validarSeLoginEhUnico(dto.login ?? dto.email);
    if (dto.cpf) await this.userValidator.validarSeCpfEhUnico(dto.cpf);

    const data = this.userFactory.criarPaciente(dto);
    const user = await this.userRepository.criar(data);
    return { data: this.sanitizarUsuario(user) };
  }

  async criarNovoAdmin(dto: CreateAdminDto) {
    await this.userValidator.validarSeEmailEhUnico(dto.email);
    await this.userValidator.validarSeLoginEhUnico(dto.login ?? dto.email);

    const data = this.userFactory.criarAdmin(dto);
    const user = await this.userRepository.criar(data);
    return { data: this.sanitizarUsuario(user) };
  }

  // ============================================================================
  // BUSCAS ESPECÍFICAS
  // ============================================================================

  async buscarPacientes(page = 1, limit = 20, search?: string) {
    const baseWhere: Prisma.UserWhereInput = { role: Roles.PATIENT, deletedAt: null };
    const where: Prisma.UserWhereInput = search?.trim()
      ? {
          ...baseWhere,
          OR: [
            { name: { contains: search.trim(), mode: 'insensitive' } },
            { email: { contains: search.trim(), mode: 'insensitive' } },
          ],
        }
      : baseWhere;

    const skip = (page - 1) * limit;
    const select: Prisma.UserSelect = {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      status: true,
      healthPlan: true,
      patientCareStatus: true,
      createdAt: true,
    };

    const [users, total] = await Promise.all([
      this.userRepository.buscarMuitosComSelect(where, { skip, take: limit, orderBy: { name: 'asc' } }, select),
      this.userRepository.contar(where),
    ]);

    return { data: users, pagination: this.paginar(page, limit, total) };
  }

  async buscarProfissionais(page = 1, limit = 20, search?: string) {
    const baseWhere: Prisma.UserWhereInput = { role: Roles.PROFESSIONAL, deletedAt: null };
    const where: Prisma.UserWhereInput = search?.trim()
      ? {
          ...baseWhere,
          OR: [
            { name: { contains: search.trim(), mode: 'insensitive' } },
            { email: { contains: search.trim(), mode: 'insensitive' } },
            { company: { name: { contains: search.trim(), mode: 'insensitive' } } },
          ],
        }
      : baseWhere;

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.userRepository.buscarMuitos(where, { skip, take: limit, orderBy: { name: 'asc' } }),
      this.userRepository.contar(where),
    ]);

    return {
      data: users.map(this.sanitizarUsuario),
      pagination: this.paginar(page, limit, total),
    };
  }

  async buscarPorEmail(email: string) {
    const user = await this.userRepository.buscarUnico({ email });
    if (!user) throw new NotFoundError('User', email, 'email');
    return { data: this.sanitizarUsuario(user) };
  }

  async buscarPorCompany(companyId: string) {
    const users = await this.userRepository.buscarMuitos({ companyId, deletedAt: null });
    return { data: users.map(this.sanitizarUsuario) };
  }

  async buscarPorRole(role: Roles) {
    const users = await this.userRepository.buscarMuitos({ role, deletedAt: null });
    return { data: users.map(this.sanitizarUsuario) };
  }

  // ============================================================================
  // PERFIL DO USUÁRIO LOGADO
  // ============================================================================

  async obterMeuPerfil(request: any) {
    const userId = this.extrairIdDoRequest(request);
    const user = await this.userRepository.buscarUnico({ id: userId });
    if (!user) throw new NotFoundError('User', userId, 'id');
    return { data: this.sanitizarUsuario(user) };
  }

  async atualizarMeuPerfil(request: any, dto: UpdateUserDto) {
    const userId = this.extrairIdDoRequest(request);
    return this.atualizar(userId, dto);
  }

  // ============================================================================
  // GESTÃO DE USUÁRIOS DA EMPRESA (painel PRO)
  // ============================================================================

  async listarUsuariosDaMinhaEmpresa(request: any) {
    const companyId = this.extrairCompanyIdDoRequest(request);
    await this.validarSeAtorEhAdminDaEmpresa(request, companyId);
    return this.buscarPorCompany(companyId);
  }

  async criarUsuarioDaMinhaEmpresa(request: any, dto: any) {
    const companyId = this.extrairCompanyIdDoRequest(request);
    await this.validarSeAtorEhAdminDaEmpresa(request, companyId);

    await this.userValidator.validarSeEmailEhUnico(dto.email);
    await this.userValidator.validarSeLoginEhUnico(dto.login ?? dto.email);
    if (dto.cpf) await this.userValidator.validarSeCpfEhUnico(dto.cpf);

    const companyUserRole = this.resolverCompanyUserRole(dto);
    const role = companyUserRole === 'ADMIN' ? Roles.ADMIN : Roles.PROFESSIONAL;

    const data: Prisma.UserCreateInput = {
      name: dto.name,
      login: String(dto.login ?? dto.email).trim().toLowerCase(),
      email: String(dto.email).trim().toLowerCase(),
      password: bcrypt.hashSync(dto.password, 10),
      role,
      status: UserStatus.ACTIVE,
      cpf: dto.cpf,
      phone: dto.phone,
      company: { connect: { id: companyId } },
    };

    const user = await this.userRepository.criar(data);
    return { data: this.sanitizarUsuario(user) };
  }

  async atualizarUsuarioDaMinhaEmpresa(request: any, id: string, dto: UpdateUserDto) {
    const companyId = this.extrairCompanyIdDoRequest(request);
    await this.validarSeAtorEhAdminDaEmpresa(request, companyId);

    const alvo = await this.userRepository.buscarPrimeiro({ id, companyId });
    if (!alvo) throw new NotFoundError('User', id, 'id');

    return this.atualizar(id, dto);
  }

  async desativarUsuarioDaMinhaEmpresa(request: any, id: string) {
    const companyId = this.extrairCompanyIdDoRequest(request);
    await this.validarSeAtorEhAdminDaEmpresa(request, companyId);

    if (request?.user?.id === id) {
      throw new ValidationError('Não é permitido desativar o próprio usuário');
    }

    const alvo = await this.userRepository.buscarPrimeiro({ id, companyId });
    if (!alvo) throw new NotFoundError('User', id, 'id');

    return this.desativar(id);
  }

  async reativarUsuarioDaMinhaEmpresa(request: any, id: string) {
    const companyId = this.extrairCompanyIdDoRequest(request);
    await this.validarSeAtorEhAdminDaEmpresa(request, companyId);

    const alvo = await this.userRepository.buscarPrimeiro({ id, companyId, deletedAt: { not: null } });
    if (!alvo) throw new NotFoundError('User', id, 'id');

    return this.reativar(id);
  }

  async convidarProfissionalParaMinhaEmpresa(request: any, email: string) {
    const companyId = this.extrairCompanyIdDoRequest(request);
    await this.validarSeAtorEhAdminDaEmpresa(request, companyId);

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) throw new ValidationError('E-mail é obrigatório');

    const alvo = await this.userRepository.buscarUnico({ email: normalizedEmail });
    if (!alvo) {
      throw new ValidationError('Não encontramos um usuário com este e-mail.');
    }
    if (alvo.deletedAt) {
      throw new ValidationError('Usuário inativo não pode ser convidado');
    }
    if (alvo.companyId && alvo.companyId !== companyId) {
      throw new ConflictError('Este usuário já está vinculado a outra empresa.');
    }
    if (alvo.companyId === companyId) {
      return { data: this.sanitizarUsuario(alvo), message: 'Usuário já é profissional desta empresa' };
    }

    const atualizado = await this.userRepository.atualizar(
      { id: alvo.id },
      {
        role: Roles.PROFESSIONAL,
        company: { connect: { id: companyId } },
      },
    );

    return {
      data: this.sanitizarUsuario(atualizado),
      message: 'Convite aplicado. Usuário agora é profissional da empresa.',
    };
  }

  // ============================================================================
  // PRIVADOS
  // ============================================================================

  private async validarExistencia(id: string) {
    const user = await this.userRepository.buscarUnico({ id });
    if (!user || user.deletedAt) throw new NotFoundError('User', id, 'id');
    return user;
  }

  private extrairIdDoRequest(request: any): string {
    const id = request?.user?.id;
    if (!id) throw new ForbiddenError('Usuário não autenticado');
    return id;
  }

  private extrairCompanyIdDoRequest(request: any): string {
    const companyId = request?.user?.companyId;
    if (!companyId) throw new ValidationError('Usuário não vinculado a empresa');
    return companyId;
  }

  private async validarSeAtorEhAdminDaEmpresa(request: any, companyId: string) {
    const actorId = request?.user?.id;
    if (!actorId) throw new ForbiddenError('Usuário não autenticado');

    const actor = await this.userRepository.buscarPrimeiro({ id: actorId, companyId });
    if (!actor) throw new ForbiddenError('Usuário sem vínculo com a empresa');

    const role = String(actor.role || '').toUpperCase();
    if (role !== 'ADMIN' && role !== 'SYSTEM_ADMIN') {
      throw new ForbiddenError('Somente administradores podem gerenciar usuários da empresa.');
    }
  }

  private resolverCompanyUserRole(dto: any): 'ADMIN' | 'COLLABORATOR' {
    const role = String(dto?.companyUserRole || dto?.role || '').trim().toUpperCase();
    return role === 'ADMIN' ? 'ADMIN' : 'COLLABORATOR';
  }

  private prepararDadosParaUpdate(dto: UpdateUserDto): Prisma.UserUpdateInput {
    const data: Record<string, any> = {};

    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined) data[key] = value;
    });

    if (data.password) data.password = bcrypt.hashSync(data.password, 10);
    if (data.login) data.login = String(data.login).trim().toLowerCase();
    if (data.email) data.email = String(data.email).trim().toLowerCase();
    if (data.birthDate) {
      data.birthDate = data.birthDate.includes('T')
        ? new Date(data.birthDate)
        : new Date(data.birthDate + 'T00:00:00.000Z');
    }

    return data as Prisma.UserUpdateInput;
  }

  private sanitizarUsuario(user: any): any {
    if (!user) return user;
    const { password: _, ...safe } = user;
    return safe;
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
