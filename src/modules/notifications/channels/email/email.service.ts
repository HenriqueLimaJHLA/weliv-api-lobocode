import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { SendGridProvider } from './providers/sendgrid.provider';
import { EmailPayload, NotificationResult } from '../../common/interfaces/notification-provider.interface';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE - Email Notifications
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class NotificationsEmailService {
  private readonly logger = new Logger(NotificationsEmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: SendGridProvider,
  ) {}

  async sendToUser(userId: string, payload: Omit<EmailPayload, 'to'>): Promise<NotificationResult> {
    // Buscar email do usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { email: true },
    });

    if (!user?.email) {
      return { success: false, error: 'User email not found', provider: 'EMAIL' };
    }

    return this.provider.send({
      ...payload,
      to: user.email,
    });
  }

  async sendToUsers(userIds: string[], payload: Omit<EmailPayload, 'to'>): Promise<NotificationResult[]> {
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, deletedAt: null },
      select: { email: true },
    });

    const emails = users.map(u => u.email).filter(Boolean) as string[];

    if (emails.length === 0) {
      return [{ success: false, error: 'No valid emails found', provider: 'EMAIL' }];
    }

    return [
      await this.provider.send({
        ...payload,
        to: emails,
      }),
    ];
  }

  async send(payload: EmailPayload): Promise<NotificationResult> {
    return this.provider.send(payload);
  }

  async sendTemplate(
    templateId: string,
    userIds: string[],
    variables: Record<string, string>,
  ): Promise<NotificationResult[]> {
    // TODO: Implementar com template engine
    this.logger.debug(`Sending template ${templateId} to ${userIds.length} users`);
    return userIds.map(() => ({ success: true, provider: 'EMAIL' }));
  }
}
