import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PushPayload, PushProviderInterface, NotificationResult } from '../../../common/interfaces/notification-provider.interface';

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER - Firebase Cloud Messaging (FCM)
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class FcmProvider implements PushProviderInterface {
  readonly name = 'Firebase Cloud Messaging';
  readonly provider = 'FCM';

  private readonly logger = new Logger(FcmProvider.name);
  private initialized = false;

  constructor(private readonly configService: ConfigService) {
    this.initialize();
  }

  private initialize() {
    // Firebase desabilitado - requer firebase-admin package
    this.logger.warn('Firebase FCM desabilitado - instale firebase-admin se necessário');
    this.initialized = false;
  }

  async send(payload: PushPayload): Promise<NotificationResult> {
    return {
      success: false,
      error: 'Firebase FCM não configurado',
      provider: this.provider,
    };
  }

  async sendMultiple(payloads: PushPayload[]): Promise<NotificationResult[]> {
    return payloads.map(() => ({
      success: false,
      error: 'Firebase FCM não configurado',
      provider: this.provider,
    }));
  }

  async validateToken(token: string): Promise<boolean> {
    return false;
  }

  async unsubscribe(token: string): Promise<void> {
    this.logger.debug(`Token unsubscribed: ${token.substring(0, 20)}...`);
  }
}
