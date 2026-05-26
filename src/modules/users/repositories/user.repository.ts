import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TenantService } from 'src/shared/tenant/tenant.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  private obterCompanyIdDoContexto(): string | null {
    const tenant = this.tenantService.getTenant();
    if (tenant?.isGlobal) return null;
    return tenant?.id || null;
  }

  private aplicarCompanyIdAosDadosDeCreate(data: any): any {
    const companyId = this.obterCompanyIdDoContexto();
    if (!companyId) return data;
    return { ...data, company: { connect: { id: companyId } } };
  }

  private get defaultInclude(): Prisma.UserInclude {
    return {
      company: { select: { id: true, name: true } },
    };
  }

  async buscarMuitos(
    where: Prisma.UserWhereInput,
    options?: { skip?: number; take?: number; orderBy?: Prisma.UserOrderByWithRelationInput },
    include?: Prisma.UserInclude,
  ) {
    return this.prisma.user.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy,
      include: include ?? this.defaultInclude,
    });
  }

  async buscarPrimeiro(where: Prisma.UserWhereInput, include?: Prisma.UserInclude) {
    return this.prisma.user.findFirst({
      where,
      include: include ?? this.defaultInclude,
    });
  }

  async buscarUnico(where: Prisma.UserWhereUniqueInput, include?: Prisma.UserInclude) {
    return this.prisma.user.findUnique({
      where,
      include: include ?? this.defaultInclude,
    });
  }

  async buscarMuitosComSelect(
    where: Prisma.UserWhereInput,
    options: { skip?: number; take?: number; orderBy?: Prisma.UserOrderByWithRelationInput },
    select: Prisma.UserSelect,
  ) {
    return this.prisma.user.findMany({ where, ...options, select });
  }

  async criar(data: any) {
    return this.prisma.user.create({
      data: this.aplicarCompanyIdAosDadosDeCreate(data),
      include: this.defaultInclude,
    });
  }

  async atualizar(where: Prisma.UserWhereUniqueInput, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where, data, include: this.defaultInclude });
  }

  async contar(where: Prisma.UserWhereInput) {
    return this.prisma.user.count({ where });
  }
}
