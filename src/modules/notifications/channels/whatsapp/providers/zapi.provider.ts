import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppPayload, WhatsAppProviderInterface, NotificationResult } from '../../common/interfaces/notification-provider.interface';

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER - Z-API WhatsApp
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class ZApiProvider implements WhatsAppProviderInterface {
  readonly name = 'Z-API WhatsApp';

  private readonly logger = new Logger(ZApiProvider.name);
  private baseUrl: string;
  private token: string;
  private instanceId: string;
  private initialized = false;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get('ZAPI_BASE_URL') || '';
    this.token = this.configService.get('ZAPI_TOKEN') || '';
    this.instanceId = this.configService.get('ZAPI_INSTANCE_ID') || '';

    this.initialized = !!(this.baseUrl && this.token && this.instanceId);

    if (this.initialized) {
      this.logger.log('Z-API provider initialized');
    } else {
      this.logger.warn('Z-API not configured');
    }
  }

  async send(payload: WhatsAppPayload): Promise<NotificationResult> {
    if (!this.initialized) {
      return { success: false, error: 'Z-API not configured', provider: 'ZAPI' };
    }

    try {
      // Usar Z-API SDK
      // const zapi = require('zapi-sdk')(this.token, this.instanceId);
      // const result = await zapi.sendTextMessage({
      //   phone: payload.to,
      //   message: payload.message,
      // });

      // Por enquanto, mock
      this.logger.debug(`WhatsApp to ${payload.to}: ${payload.message.substring(0, 50)}...`);

      return {
        success: true,
        messageId: `zapi-${Date.now()}`,
        provider: 'ZAPI',
      };
    } catch (error: any) {
      this.logger.error(`Z-API send error: ${error.message}`);

      return {
        success: false,
        error: error.message,
        provider: 'ZAPI',
      };
    }
  }

  async sendTemplate(
    templateName: string,
    variables: Record<string, string>,
    payload: WhatsAppPayload,
  ): Promise<NotificationResult> {
    if (!this.initialized) {
      return { success: false, error: 'Z-API not configured', provider: 'ZAPI' };
    }

    try {
      // Substituir variáveis no template
      let message = payload.message;
      for (const [key, value] of Object.entries(variables)) {
        message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }

      return this.send({ ...payload, message });
    } catch (error: any) {
      this.logger.error(`Z-API template error: ${error.message}`);

      return {
        success: false,
        error: error.message,
        provider: 'ZAPI',
      };
    }
  }

  async validatePhone(phone: string): Promise<boolean> {
    // Validar formato brasileiro (com DDI)
    const phoneRegex = /^\+?55?\d{10,11}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }
}
