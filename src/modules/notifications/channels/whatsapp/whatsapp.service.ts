import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ZApiProvider } from './providers/zapi.provider';
import { WhatsAppPayload, NotificationResult } from '../../common/interfaces/notification-provider.interface';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE - WhatsApp Notifications
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class NotificationsWhatsAppService {
  private readonly logger = new Logger(NotificationsWhatsAppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: ZApiProvider,
  ) {}

  async sendToUser(userId: string, message: string): Promise<NotificationResult> {
    // Buscar WhatsApp do usuário (campo phone)
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { phone: true },
    });

    const phone = user?.phone;

    if (!phone) {
      return { success: false, error: 'User WhatsApp not found', provider: 'WHATSAPP' };
    }

    return this.provider.send({
      to: this.formatPhone(phone),
      message,
    });
  }

  async sendToUsers(userIds: string[], message: string): Promise<NotificationResult[]> {
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, deletedAt: null },
      select: { phone: true },
    });

    const phones = users
      .map(u => u.phone)
      .filter(Boolean) as string[];

    if (phones.length === 0) {
      return [{ success: false, error: 'No valid WhatsApp found', provider: 'WHATSAPP' }];
    }

    return Promise.all(
      phones.map(phone =>
        this.provider.send({
          to: this.formatPhone(phone),
          message,
        }),
      ),
    );
  }

  async send(payload: WhatsAppPayload): Promise<NotificationResult> {
    return this.provider.send({
      ...payload,
      to: this.formatPhone(payload.to),
    });
  }

  async sendTemplate(
    templateName: string,
    userIds: string[],
    variables: Record<string, string>,
    message: string,
  ): Promise<NotificationResult[]> {
    return Promise.all(
      userIds.map(userId =>
        this.provider.sendTemplate(
          templateName,
          variables,
          { to: '', message },
        ),
      ),
    );
  }

  private formatPhone(phone: string): string {
    // Remove tudo exceto números
    const numbers = phone.replace(/\D/g, '');

    // Adiciona DDI se não tiver
    if (numbers.length === 10 || numbers.length === 11) {
      return `+55${numbers}`;
    }

    return numbers.startsWith('+') ? numbers : `+${numbers}`;
  }
}
