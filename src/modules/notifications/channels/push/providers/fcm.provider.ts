import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PushPayload, PushProviderInterface, NotificationResult } from '../../common/interfaces/notification-provider.interface';

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
    try {
      // Verificar se já foi inicializado
      if (admin.apps.length > 0) {
        this.initialized = true;
        return;
      }

      // Firebase Admin SDK
      const serviceAccount = this.configService.get('FIREBASE_SERVICE_ACCOUNT');

      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(serviceAccount)),
        });
        this.initialized = true;
        this.logger.log('Firebase Admin SDK initialized');
      } else {
        this.logger.warn('Firebase service account not configured');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase', error);
    }
  }

  async send(payload: PushPayload): Promise<NotificationResult> {
    if (!this.initialized) {
      return {
        success: false,
        error: 'Firebase not initialized',
        provider: this.provider,
      };
    }

    try {
      const message: admin.messaging.Message = {
        token: payload.token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        android: {
          priority: payload.priority === 'high' ? 'high' : 'normal',
          ttl: payload.ttl ? payload.ttl * 1000 : undefined,
          notification: {
            imageUrl: payload.image,
            icon: payload.icon,
            clickAction: payload.clickAction,
          },
        },
        apns: {
          payload: {
            aps: {
              badge: payload.badge,
              sound: payload.sound || 'default',
            },
          },
        },
        data: payload.data,
      };

      const response = await admin.messaging().send(message);

      return {
        success: true,
        messageId: response,
        provider: this.provider,
      };
    } catch (error: any) {
      this.logger.error(`FCM send error: ${error.message}`);

      return {
        success: false,
        error: error.message,
        errorCode: error.code,
        provider: this.provider,
      };
    }
  }

  async sendMultiple(payloads: PushPayload[]): Promise<NotificationResult[]> {
    return Promise.all(payloads.map(p => this.send(p)));
  }

  async validateToken(token: string): Promise<boolean> {
    if (!this.initialized) return false;

    try {
      await admin.messaging().send({
        token,
        notification: { title: 'Test', body: 'Test' },
      }, true); // dryRun
      return true;
    } catch {
      return false;
    }
  }

  async unsubscribe(token: string): Promise<void> {
    // FCM não tem unsubscribe via API, o token é removido pelo app
    this.logger.debug(`Token unsubscribed: ${token.substring(0, 20)}...`);
  }
}
