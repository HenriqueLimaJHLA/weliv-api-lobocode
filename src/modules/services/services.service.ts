import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { CatalogItemStatus } from '@prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TenantService } from 'src/shared/tenant/tenant.service';
import { NotFoundError, UnauthorizedError, ValidationError } from 'src/shared/common/errors';
import { SUCCESS_MESSAGES } from 'src/shared/common/messages';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';

const SERVICE_INCLUDE = {
  specialty: { select: { id: true, name: true } },
  company: { select: { id: true, name: true } },
};

@Injectable({ scope: Scope.REQUEST })
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
    @Optional() @Inject(REQUEST) private readonly request: any,
  ) {}

  // ============================================================================
  // SERVICES (catálogo de procedimentos)
  // ============================================================================

  async listarServicos(page = 1, limit = 20, specialtyId?: string) {
    const companyId = this.tenantService.getCompanyId();
    const where: any = { deletedAt: null };
    if (companyId) where.companyId = companyId;
    if (specialtyId) where.specialtyId = specialtyId;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.service.findMany({ where, include: SERVICE_INCLUDE, orderBy: { name: 'asc' }, skip, take: limit }),
      this.prisma.service.count({ where }),
    ]);

    return { data, pagination: this.paginar(page, limit, total) };
  }

  async buscarServicoPorId(id: string) {
    const item = await this.prisma.service.findUnique({ where: { id }, include: SERVICE_INCLUDE });
    if (!item || item.deletedAt) throw new NotFoundError('Service', id, 'id');
    return { data: item };
  }

  async criarServico(dto: CreateServiceDto) {
    const companyId = await this.resolverCompanyId();
    if (dto.specialtyId) await this.validarEspecialidadeExiste(dto.specialtyId);

    const data = await this.prisma.service.create({
      data: {
        name: dto.name,
        status: dto.status ?? CatalogItemStatus.ACTIVE,
        specialtyId: dto.specialtyId ?? null,
        companyId,
      },
      include: SERVICE_INCLUDE,
    });

    return { data };
  }

  async atualizarServico(id: string, dto: UpdateServiceDto) {
    await this.validarServicoExiste(id);
    if (dto.specialtyId) await this.validarEspecialidadeExiste(dto.specialtyId);

    const data = await this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.status && { status: dto.status }),
        ...(dto.specialtyId !== undefined && { specialtyId: dto.specialtyId }),
      },
      include: SERVICE_INCLUDE,
    });

    return { data };
  }

  async desativarServico(id: string) {
    await this.validarServicoExiste(id);
    await this.prisma.service.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: SUCCESS_MESSAGES.CRUD.DELETED };
  }

  async reativarServico(id: string) {
    const item = await this.prisma.service.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Service', id, 'id');
    await this.prisma.service.update({ where: { id }, data: { deletedAt: null } });
    return { message: SUCCESS_MESSAGES.CRUD.RESTORED };
  }

  // ============================================================================
  // SPECIALTIES (especialidades clínicas)
  // ============================================================================

  async listarEspecialidades(page = 1, limit = 50) {
    const companyId = this.tenantService.getCompanyId();
    const where: any = { deletedAt: null, OR: [{ companyId: null }, ...(companyId ? [{ companyId }] : [])] };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.specialty.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
      this.prisma.specialty.count({ where }),
    ]);

    return { data, pagination: this.paginar(page, limit, total) };
  }

  async buscarEspecialidadePorId(id: string) {
    const item = await this.prisma.specialty.findUnique({ where: { id } });
    if (!item || item.deletedAt) throw new NotFoundError('Specialty', id, 'id');
    return { data: item };
  }

  async criarEspecialidade(dto: CreateSpecialtyDto) {
    const companyId = await this.resolverCompanyId();

    const data = await this.prisma.specialty.create({
      data: {
        name: dto.name,
        status: dto.status ?? CatalogItemStatus.ACTIVE,
        companyId,
      },
    });

    return { data };
  }

  async atualizarEspecialidade(id: string, dto: Partial<CreateSpecialtyDto>) {
    await this.validarEspecialidadeExiste(id);

    const data = await this.prisma.specialty.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.status && { status: dto.status }),
      },
    });

    return { data };
  }

  async desativarEspecialidade(id: string) {
    await this.validarEspecialidadeExiste(id);
    await this.prisma.specialty.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: SUCCESS_MESSAGES.CRUD.DELETED };
  }

  // ============================================================================
  // PRIVADOS
  // ============================================================================

  private async resolverCompanyId(): Promise<string> {
    const companyId = this.tenantService.getCompanyId();
    if (companyId) return companyId;

    const user = this.request?.user;
    if (!user) throw new UnauthorizedError('Usuário não autenticado');

    const userData = await this.prisma.user.findUnique({ where: { id: user.id }, select: { companyId: true } });
    if (!userData?.companyId) throw new ValidationError('Usuário não possui empresa vinculada');
    return userData.companyId;
  }

  private async validarServicoExiste(id: string) {
    const item = await this.prisma.service.findUnique({ where: { id } });
    if (!item || item.deletedAt) throw new NotFoundError('Service', id, 'id');
    return item;
  }

  private async validarEspecialidadeExiste(id: string) {
    const item = await this.prisma.specialty.findUnique({ where: { id } });
    if (!item || item.deletedAt) throw new NotFoundError('Specialty', id, 'id');
    return item;
  }

  private paginar(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
  }
}
