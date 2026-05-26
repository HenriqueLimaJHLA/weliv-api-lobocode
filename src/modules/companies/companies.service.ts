import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from 'src/shared/common/errors';
import {
  UniversalService,
  UniversalRepository,
  UniversalMetricsService,
  UniversalQueryService,
  UniversalPermissionService,
  createEntityConfig,
} from 'src/shared/universal/index';
import { TenantService } from 'src/shared/tenant/tenant.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { SUCCESS_MESSAGES } from 'src/shared/common/messages';

@Injectable({ scope: Scope.REQUEST })
export class CompaniesService extends UniversalService<CreateCompanyDto, UpdateCompanyDto> {
  private static readonly entityConfig = createEntityConfig('company');

  constructor(
    repository: UniversalRepository<CreateCompanyDto, UpdateCompanyDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) request: any,
    private readonly tenantService: TenantService,
    private readonly prisma: PrismaService,
  ) {
    const { model, casl } = CompaniesService.entityConfig;
    super(repository, queryService, permissionService, metricsService, request, model, casl);
  }

  protected async antesDeCriar(data: CreateCompanyDto): Promise<void> {
    if (data.cnpj) await this.validarCnpjUnico(data.cnpj);
    (data as any).status = 'PENDING';
  }

  protected async antesDeAtualizar(id: string, data: UpdateCompanyDto): Promise<void> {
    if (data.cnpj) await this.validarCnpjUnico(data.cnpj, id);
  }

  private async validarCnpjUnico(cnpj: string, excludeId?: string): Promise<void> {
    const where: any = { cnpj, deletedAt: null };
    if (excludeId) where.id = { not: excludeId };

    const existing = await this.prisma.company.findFirst({ where });
    if (existing) throw new ConflictError('CNPJ já está em uso');
  }

  // ============================================================================
  // EMPRESA DO USUÁRIO LOGADO
  // ============================================================================

  async obterMinhaEmpresa() {
    const user = this.obterUsuarioLogado();
    if (!user) throw new UnauthorizedError('Usuário não autenticado');

    this.permissionService.validarAction(this.entityNameCasl, 'read');

    let companyId = this.tenantService.getCompanyId();

    if (!companyId) {
      const userData = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { companyId: true },
      });
      if (!userData?.companyId) {
        throw new ValidationError('Usuário não possui empresa vinculada');
      }
      companyId = userData.companyId;
    }

    const company = await this.repository.buscarPrimeiro(this.entityName, { id: companyId });
    if (!company) throw new NotFoundError(this.entityName, companyId, 'id');

    return { data: this.transformData(company) };
  }

  async atualizarMinhaEmpresa(data: UpdateCompanyDto) {
    const user = this.obterUsuarioLogado();
    if (!user) throw new UnauthorizedError('Usuário não autenticado');

    this.permissionService.validarAction(this.entityNameCasl, 'update');

    let companyId = this.tenantService.getCompanyId();

    if (!companyId) {
      const userData = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { companyId: true },
      });
      if (!userData?.companyId) {
        throw new ValidationError('Usuário não possui empresa vinculada');
      }
      companyId = userData.companyId;
    }

    if (data.cnpj) await this.validarCnpjUnico(data.cnpj, companyId);

    const { status: _status, ...dataSemStatus } = data;

    const updated = await this.repository.atualizar(
      this.entityName,
      { id: companyId },
      dataSemStatus as UpdateCompanyDto,
    );
    if (!updated) throw new NotFoundError(this.entityName, companyId, 'id');

    return { data: this.transformData(updated) };
  }

  // ============================================================================
  // LISTAGENS PARA ADMIN
  // ============================================================================

  async listarParaAdmin(
    activeOnly = true,
    page = 1,
    limit = 50,
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const searchTrim = search?.trim() ?? '';

    const searchOr =
      searchTrim.length > 0
        ? {
            OR: [
              { name: { contains: searchTrim, mode: 'insensitive' as const } },
              { specialty: { contains: searchTrim, mode: 'insensitive' as const } },
              { cnpj: { contains: searchTrim.replace(/\D/g, '') } },
            ],
          }
        : null;

    const where = {
      AND: [
        { deletedAt: activeOnly ? null : { not: null as unknown as Date } },
        ...(searchOr ? [searchOr] : []),
      ],
    };

    const [list, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        include: { _count: { select: { users: true } } },
      }),
      this.prisma.company.count({ where }),
    ]);

    const data = list.map(({ _count, ...rest }) => ({
      ...rest,
      usersCount: _count?.users ?? 0,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async obterDetalheParaAdmin(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { _count: { select: { users: true, appointments: true } } },
    });
    if (!company) throw new NotFoundError(this.entityName, companyId, 'id');

    const { _count, ...rest } = company;
    return {
      data: {
        ...rest,
        usersCount: _count?.users ?? 0,
        appointmentsCount: _count?.appointments ?? 0,
      },
    };
  }

  async desativarParaAdmin(companyId: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'delete');

    const existing = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
    });
    if (!existing) throw new NotFoundError(this.entityName, companyId, 'id');

    await this.prisma.company.update({
      where: { id: companyId },
      data: { deletedAt: new Date() },
    });

    return { message: SUCCESS_MESSAGES.CRUD.DELETED };
  }

  async reativarParaAdmin(companyId: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'delete');

    const row = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, deletedAt: true },
    });
    if (!row) throw new NotFoundError(this.entityName, companyId, 'id');
    if (!row.deletedAt) throw new ValidationError('Empresa já está ativa.');

    await this.prisma.company.update({
      where: { id: companyId },
      data: { deletedAt: null },
    });

    return this.obterDetalheParaAdmin(companyId);
  }
}
