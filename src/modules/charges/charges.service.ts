import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Prisma, ChargeStatus } from '@prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TenantService } from 'src/shared/tenant/tenant.service';
import { NotFoundError, UnauthorizedError, ValidationError } from 'src/shared/common/errors';
import { CreateChargeDto } from './dto/create-charge.dto';
import { UpdateChargeDto } from './dto/update-charge.dto';

const CHARGE_SELECT: Prisma.ChargeSelect = {
  id: true,
  amount: true,
  dueDate: true,
  method: true,
  status: true,
  externalReference: true,
  lastReminderAt: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
  patient: { select: { id: true, name: true, email: true, phone: true } },
  appointment: { select: { id: true, startsAt: true } },
  company: { select: { id: true, name: true } },
  companyUnit: { select: { id: true, name: true } },
};

@Injectable({ scope: Scope.REQUEST })
export class ChargesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
    @Optional() @Inject(REQUEST) private readonly request: any,
  ) {}

  async listarCobrancas(page = 1, limit = 20, status?: ChargeStatus) {
    const companyId = await this.resolverCompanyId();
    const where: Prisma.ChargeWhereInput = { companyId, deletedAt: null };
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.charge.findMany({ where, select: CHARGE_SELECT, orderBy: { dueDate: 'asc' }, skip, take: limit }),
      this.prisma.charge.count({ where }),
    ]);

    return { data, pagination: this.paginar(page, limit, total) };
  }

  async listarCobrancasPorPaciente(patientId: string, page = 1, limit = 20) {
    const companyId = await this.resolverCompanyId();
    const where: Prisma.ChargeWhereInput = { companyId, patientId, deletedAt: null };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.charge.findMany({ where, select: CHARGE_SELECT, orderBy: { dueDate: 'asc' }, skip, take: limit }),
      this.prisma.charge.count({ where }),
    ]);

    return { data, pagination: this.paginar(page, limit, total) };
  }

  async buscarPorId(id: string) {
    const charge = await this.prisma.charge.findUnique({ where: { id }, select: CHARGE_SELECT });
    if (!charge) throw new NotFoundError('Charge', id, 'id');
    return { data: charge };
  }

  async criar(dto: CreateChargeDto) {
    const companyId = await this.resolverCompanyId();

    const data = await this.prisma.charge.create({
      data: {
        companyId,
        patientId: dto.patientId,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        method: dto.method,
        ...(dto.appointmentId && { appointmentId: dto.appointmentId }),
        ...(dto.companyUnitId && { companyUnitId: dto.companyUnitId }),
        ...(dto.externalReference && { externalReference: dto.externalReference }),
      },
      select: CHARGE_SELECT,
    });

    return { data };
  }

  async atualizar(id: string, dto: UpdateChargeDto) {
    const exists = await this.prisma.charge.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundError('Charge', id, 'id');

    const data = await this.prisma.charge.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.paidAt !== undefined && { paidAt: new Date(dto.paidAt) }),
        ...(dto.lastReminderAt !== undefined && { lastReminderAt: new Date(dto.lastReminderAt) }),
      },
      select: CHARGE_SELECT,
    });

    return { data };
  }

  async marcarComoPago(id: string) {
    const exists = await this.prisma.charge.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundError('Charge', id, 'id');

    const data = await this.prisma.charge.update({
      where: { id },
      data: { status: ChargeStatus.PAID, paidAt: new Date() },
      select: CHARGE_SELECT,
    });

    return { data };
  }

  async desativar(id: string) {
    const exists = await this.prisma.charge.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundError('Charge', id, 'id');

    await this.prisma.charge.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Cobrança removida com sucesso' };
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
