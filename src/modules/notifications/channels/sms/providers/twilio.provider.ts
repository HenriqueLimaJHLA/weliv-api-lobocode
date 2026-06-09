import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsPayload, SmsProviderInterface, NotificationResult } from '../../common/interfaces/notification-provider.interface';

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER - Twilio SMS
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class TwilioProvider implements SmsProviderInterface {
  readonly name = 'Twilio SMS';

  private readonly logger = new Logger(TwilioProvider.name);
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;
  private initialized = false;

  constructor(private readonly configService: ConfigService) {
    this.accountSid = this.configService.get('TWILIO_ACCOUNT_SID') || '';
    this.authToken = this.configService.get('TWILIO_AUTH_TOKEN') || '';
    this.fromNumber = this.configService.get('TWILIO_FROM_NUMBER') || '';

    this.initialized = !!(this.accountSid && this.authToken && this.fromNumber);

    if (this.initialized) {
      this.logger.log('Twilio provider initialized');
    } else {
      this.logger.warn('Twilio not configured');
    }
  }

  async send(payload: SmsPayload): Promise<NotificationResult> {
    if (!this.initialized) {
      return { success: false, error: 'Twilio not configured', provider: 'TWILIO' };
    }

    try {
      // Usar Twilio SDK
      // const client = require('twilio')(this.accountSid, this.authToken);
      // const message = await client.messages.create({
      //   body: payload.message,
      //   from: payload.from || this.fromNumber,
      //   to: payload.to,
      // });

      // Por enquanto, mock
      this.logger.debug(`SMS to ${payload.to}: ${payload.message.substring(0, 50)}...`);

      return {
        success: true,
        messageId: `mock-${Date.now()}`,
        provider: 'TWILIO',
      };
    } catch (error: any) {
      this.logger.error(`Twilio send error: ${error.message}`);

      return {
        success: false,
        error: error.message,
        provider: 'TWILIO',
      };
    }
  }

  async sendMultiple(payloads: SmsPayload[]): Promise<NotificationResult[]> {
    return Promise.all(payloads.map(p => this.send(p)));
  }

  async validatePhone(phone: string): Promise<boolean> {
    // Validar formato brasileiro
    const phoneRegex = /^\(\d{2}\)\s?\d{5}-\d{4}$/;
    return phoneRegex.test(phone);
  }
}
