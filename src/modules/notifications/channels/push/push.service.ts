import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { FcmProvider } from './providers/fcm.provider';
import { PushPayload, NotificationResult } from '../../common/interfaces/notification-provider.interface';
import { PushProvider } from '../../common/enums/notification.enums';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE - Push Notifications
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class NotificationsPushService {
  private readonly logger = new Logger(NotificationsPushService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fcmProvider: FcmProvider,
  ) {}

  async sendToUser(userId: string, payload: Omit<PushPayload, 'token'>): Promise<NotificationResult> {
    // Buscar tokens ativos do usuário
    const devices = await this.prisma.deviceToken.findMany({
      where: {
        userId,
        isActive: true,
        provider: PushProvider.FCM,
      },
    });

    if (devices.length === 0) {
      this.logger.debug(`No FCM tokens found for user ${userId}`);
      return { success: false, error: 'No tokens found', provider: 'FCM' };
    }

    // Enviar para todos os dispositivos
    const results = await Promise.all(
      devices.map(device =>
        this.fcmProvider.send({
          ...payload,
          token: device.token,
        }),
      ),
    );

    // Atualizar lastUsedAt dos tokens
    await this.prisma.deviceToken.updateMany({
      where: { id: { in: devices.map(d => d.id) } },
      data: { lastUsedAt: new Date() },
    });

    // Retornar resultado consolidado
    const successCount = results.filter(r => r.success).length;
    return {
      success: successCount > 0,
      messageId: `${successCount}/${devices.length} sent`,
      provider: 'FCM',
    };
  }

  async sendToUsers(userIds: string[], payload: Omit<PushPayload, 'token'>): Promise<NotificationResult[]> {
    return Promise.all(userIds.map(userId => this.sendToUser(userId, payload)));
  }

  async sendToToken(token: string, payload: PushPayload): Promise<NotificationResult> {
    return this.fcmProvider.send(payload);
  }
}
