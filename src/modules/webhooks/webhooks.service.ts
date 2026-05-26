import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { PaymentStatus, ChargeStatus } from '@prisma/client';

@Injectable()
export class WebhooksService {
  constructor(private readonly prisma: PrismaService) {}

  async processarEventoAsaas(payload: Record<string, any>) {
    const { event, payment } = payload;
    if (!event || !payment) return { received: true };

    const externalId: string = payment.id;

    switch (event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        await this.atualizarPagamentoPorReferencia(externalId, PaymentStatus.PAID);
        await this.atualizarCobrancaPorReferencia(externalId, ChargeStatus.PAID);
        break;
      case 'PAYMENT_DELETED':
      case 'PAYMENT_REFUNDED':
        await this.atualizarPagamentoPorReferencia(externalId, PaymentStatus.CANCELLED);
        break;
      case 'PAYMENT_OVERDUE':
        await this.atualizarCobrancaPorReferencia(externalId, ChargeStatus.OVERDUE);
        break;
    }

    return { received: true };
  }

  async processarEventoStripe(payload: Record<string, any>) {
    const type: string = payload.type;
    const data = payload.data?.object;
    if (!type || !data) return { received: true };

    const externalId: string = data.id;

    switch (type) {
      case 'payment_intent.succeeded':
        await this.atualizarPagamentoPorReferencia(externalId, PaymentStatus.PAID);
        break;
      case 'payment_intent.payment_failed':
        await this.atualizarPagamentoPorReferencia(externalId, PaymentStatus.CANCELLED);
        break;
    }

    return { received: true };
  }

  private async atualizarPagamentoPorReferencia(externalId: string, status: PaymentStatus) {
    // O campo externalReference pode ser o id do gateway
    const pagamento = await this.prisma.payment.findFirst({
      where: { deletedAt: null },
      select: { id: true },
    });
    if (!pagamento) return;

    await this.prisma.payment.update({
      where: { id: pagamento.id },
      data: {
        status,
        ...(status === PaymentStatus.PAID && { paidAt: new Date() }),
      },
    });
  }

  private async atualizarCobrancaPorReferencia(externalId: string, status: ChargeStatus) {
    const cobranca = await this.prisma.charge.findFirst({
      where: { externalReference: externalId, deletedAt: null },
      select: { id: true },
    });
    if (!cobranca) return;

    await this.prisma.charge.update({
      where: { id: cobranca.id },
      data: {
        status,
        ...(status === ChargeStatus.PAID && { paidAt: new Date() }),
      },
    });
  }
}
