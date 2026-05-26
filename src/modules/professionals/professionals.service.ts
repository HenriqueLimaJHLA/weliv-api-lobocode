import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Prisma, Roles } from '@prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TenantService } from 'src/shared/tenant/tenant.service';
import { NotFoundError, UnauthorizedError, ValidationError } from 'src/shared/common/errors';
import { UpdateProfessionalDto } from './dto/update-professional.dto';

const PROFESSIONAL_SELECT: Prisma.UserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatarUrl: true,
  role: true,
  status: true,
  professionalTitle: true,
  biography: true,
  registrationNumber: true,
  specialty: true,
  consultationPrice: true,
  acceptsInsurance: true,
  insurances: true,
  availableSchedule: true,
  remarcationEnabled: true,
  remarcationLimit: true,
  waitingListEnabled: true,
  depositPercentage: true,
  company: { select: { id: true, name: true } },
};

@Injectable({ scope: Scope.REQUEST })
export class ProfessionalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
    @Optional() @Inject(REQUEST) private readonly request: any,
  ) {}

  // ============================================================================
  // LISTAGEM PÚBLICA (busca pelo app do paciente)
  // ============================================================================

  async buscarProfissionaisDisponiveis(
    page = 1,
    limit = 20,
    params: { specialty?: string; name?: string; companyId?: string } = {},
  ) {
    const where: Prisma.UserWhereInput = {
      role: Roles.PROFESSIONAL,
      status: 'ACTIVE',
      deletedAt: null,
    };

    if (params.companyId) where.companyId = params.companyId;
    if (params.specialty) where.specialty = { contains: params.specialty, mode: 'insensitive' };
    if (params.name) where.name = { contains: params.name, mode: 'insensitive' };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({ where, select: PROFESSIONAL_SELECT, orderBy: { name: 'asc' }, skip, take: limit }),
      this.prisma.user.count({ where }),
    ]);

    return { data, pagination: this.paginar(page, limit, total) };
  }

  async buscarPorId(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: PROFESSIONAL_SELECT });
    if (!user || user.role !== Roles.PROFESSIONAL) throw new NotFoundError('Professional', id, 'id');
    return { data: user };
  }

  // ============================================================================
  // PERFIL DO PROFISSIONAL LOGADO
  // ============================================================================

  async obterMeuPerfil() {
    const userId = this.extrairUserId();
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: PROFESSIONAL_SELECT });
    if (!user) throw new NotFoundError('User', userId, 'id');
    return { data: user };
  }

  async atualizarMeuPerfil(dto: UpdateProfessionalDto) {
    const userId = this.extrairUserId();

    const data = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.professionalTitle !== undefined && { professionalTitle: dto.professionalTitle }),
        ...(dto.biography !== undefined && { biography: dto.biography }),
        ...(dto.registrationNumber !== undefined && { registrationNumber: dto.registrationNumber }),
        ...(dto.specialty !== undefined && { specialty: dto.specialty }),
        ...(dto.consultationPrice !== undefined && { consultationPrice: dto.consultationPrice }),
        ...(dto.acceptsInsurance !== undefined && { acceptsInsurance: dto.acceptsInsurance }),
        ...(dto.insurances !== undefined && { insurances: dto.insurances }),
        ...(dto.professionalCnpj !== undefined && { professionalCnpj: dto.professionalCnpj }),
        ...(dto.professionalAddress !== undefined && { professionalAddress: dto.professionalAddress }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
      },
      select: PROFESSIONAL_SELECT,
    });

    return { data };
  }

  // ============================================================================
  // LISTAGEM PARA ADMIN (empresa)
  // ============================================================================

  async listarPorEmpresa(page = 1, limit = 20, search?: string) {
    const companyId = await this.resolverCompanyId();
    const where: Prisma.UserWhereInput = { companyId, role: Roles.PROFESSIONAL, deletedAt: null };

    if (search?.trim()) {
      (where as any).name = { contains: search.trim(), mode: 'insensitive' };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({ where, select: PROFESSIONAL_SELECT, orderBy: { name: 'asc' }, skip, take: limit }),
      this.prisma.user.count({ where }),
    ]);

    return { data, pagination: this.paginar(page, limit, total) };
  }

  // ============================================================================
  // PRIVADOS
  // ============================================================================

  private extrairUserId(): string {
    const id = this.request?.user?.id;
    if (!id) throw new UnauthorizedError('Usuário não autenticado');
    return id;
  }

  private async resolverCompanyId(): Promise<string> {
    const companyId = this.tenantService.getCompanyId();
    if (companyId) return companyId;

    const user = this.request?.user;
    if (!user) throw new UnauthorizedError('Usuário não autenticado');

    const userData = await this.prisma.user.findUnique({ where: { id: user.id }, select: { companyId: true } });
    if (!userData?.companyId) throw new ValidationError('Usuário não possui empresa vinculada');
    return userData.companyId;
  }

  private paginar(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
  }
}
