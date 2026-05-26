import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Prisma, PaymentStatus, Roles } from '@prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TenantService } from 'src/shared/tenant/tenant.service';
import { NotFoundError, UnauthorizedError } from 'src/shared/common/errors';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

const PAYMENT_SELECT: Prisma.PaymentSelect = {
  id: true,
  amount: true,
  method: true,
  installments: true,
  status: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
  appointment: { select: { id: true, startsAt: true, status: true } },
  patient: { select: { id: true, name: true, email: true } },
  professional: { select: { id: true, name: true, specialty: true } },
  company: { select: { id: true, name: true } },
};

@Injectable({ scope: Scope.REQUEST })
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
    @Optional() @Inject(REQUEST) private readonly request: any,
  ) {}

  async listarPagamentos(page = 1, limit = 20, status?: PaymentStatus) {
    const companyId = await this.resolverCompanyId();
    const where: Prisma.PaymentWhereInput = { companyId, deletedAt: null };
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({ where, select: PAYMENT_SELECT, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, pagination: this.paginar(page, limit, total) };
  }

  async listarMeusPagamentos(page = 1, limit = 20) {
    const userId = this.extrairUserId();
    const user = this.request?.user;
    const where: Prisma.PaymentWhereInput = { deletedAt: null };

    if (user?.role === Roles.PATIENT) {
      where.patientId = userId;
    } else if (user?.role === Roles.PROFESSIONAL) {
      where.professionalId = userId;
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({ where, select: PAYMENT_SELECT, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, pagination: this.paginar(page, limit, total) };
  }

  async buscarPorId(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id }, select: PAYMENT_SELECT });
    if (!payment || (payment as any).deletedAt) throw new NotFoundError('Payment', id, 'id');
    return { data: payment };
  }

  async criar(dto: CreatePaymentDto) {
    const companyId = await this.resolverCompanyId();

    const data = await this.prisma.payment.create({
      data: {
        appointmentId: dto.appointmentId,
        patientId: dto.patientId,
        professionalId: dto.professionalId,
        companyId: dto.companyId ?? companyId,
        amount: dto.amount,
        method: dto.method,
        ...(dto.installments !== undefined && { installments: dto.installments }),
      },
      select: PAYMENT_SELECT,
    });

    return { data };
  }

  async atualizar(id: string, dto: UpdatePaymentDto) {
    const exists = await this.prisma.payment.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundError('Payment', id, 'id');

    const data = await this.prisma.payment.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.paidAt !== undefined && { paidAt: new Date(dto.paidAt) }),
      },
      select: PAYMENT_SELECT,
    });

    return { data };
  }

  async confirmarPagamento(id: string) {
    const exists = await this.prisma.payment.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundError('Payment', id, 'id');

    const data = await this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.PAID, paidAt: new Date() },
      select: PAYMENT_SELECT,
    });

    return { data };
  }

  async cancelar(id: string) {
    const exists = await this.prisma.payment.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundError('Payment', id, 'id');

    const data = await this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.CANCELLED },
      select: PAYMENT_SELECT,
    });

    return { data };
  }

  async desativar(id: string) {
    const exists = await this.prisma.payment.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundError('Payment', id, 'id');

    await this.prisma.payment.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Pagamento removido com sucesso' };
  }

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
    return userData?.companyId ?? '';
  }

  private paginar(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
  }
}
