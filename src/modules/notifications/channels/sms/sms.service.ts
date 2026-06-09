import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TwilioProvider } from './providers/twilio.provider';
import { SmsPayload, NotificationResult } from '../../common/interfaces/notification-provider.interface';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE - SMS Notifications
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class NotificationsSmsService {
  private readonly logger = new Logger(NotificationsSmsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: TwilioProvider,
  ) {}

  async sendToUser(userId: string, message: string): Promise<NotificationResult> {
    // Buscar telefone do usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { phone: true },
    });

    if (!user?.phone) {
      return { success: false, error: 'User phone not found', provider: 'SMS' };
    }

    return this.provider.send({
      to: user.phone,
      message,
    });
  }

  async sendToUsers(userIds: string[], message: string): Promise<NotificationResult[]> {
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, deletedAt: null },
      select: { phone: true },
    });

    const phones = users.map(u => u.phone).filter(Boolean) as string[];

    if (phones.length === 0) {
      return [{ success: false, error: 'No valid phones found', provider: 'SMS' }];
    }

    return Promise.all(
      phones.map(phone =>
        this.provider.send({ to: phone, message }),
      ),
    );
  }

  async send(payload: SmsPayload): Promise<NotificationResult> {
    return this.provider.send(payload);
  }
}
