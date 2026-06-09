import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { EmailPayload, EmailProviderInterface, NotificationResult } from '../../common/interfaces/notification-provider.interface';

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER - SendGrid / SMTP
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class SendGridProvider implements EmailProviderInterface {
  readonly name = 'SendGrid / SMTP';

  private transporter: Transporter;
  private readonly logger = new Logger(SendGridProvider.name);

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Configurar transporter
    const host = this.configService.get('SMTP_HOST');
    const port = this.configService.get('SMTP_PORT');
    const user = this.configService.get('SMTP_USER');
    const pass = this.configService.get('SMTP_PASS');

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: { user, pass },
      });
      this.logger.log('SMTP transporter initialized');
    } else {
      this.logger.warn('SMTP not configured');
    }
  }

  async send(payload: EmailPayload): Promise<NotificationResult> {
    if (!this.transporter) {
      return {
        success: false,
        error: 'SMTP not configured',
        provider: 'SMTP',
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from: payload.from || this.configService.get('SMTP_FROM'),
        to: Array.isArray(payload.to) ? payload.to.join(', ') : payload.to,
        cc: payload.cc ? (Array.isArray(payload.cc) ? payload.cc.join(', ') : payload.cc) : undefined,
        bcc: payload.bcc ? (Array.isArray(payload.bcc) ? payload.bcc.join(', ') : payload.bcc) : undefined,
        subject: payload.subject,
        text: payload.body,
        html: payload.body.replace(/\n/g, '<br>'),
        attachments: payload.attachments?.map(a => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
          cid: a.cid,
        })),
      });

      return {
        success: true,
        messageId: info.messageId,
        provider: 'SMTP',
      };
    } catch (error: any) {
      this.logger.error(`Email send error: ${error.message}`);

      return {
        success: false,
        error: error.message,
        provider: 'SMTP',
      };
    }
  }

  async sendTemplate(templateId: string, payload: EmailPayload): Promise<NotificationResult> {
    // TODO: Implementar com SendGrid Templates
    this.logger.debug(`Sending template ${templateId}`);
    return this.send(payload);
  }

  async validateEmail(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async unsubscribe(email: string): Promise<void> {
    // TODO: Implementar unsubscribe
    this.logger.debug(`Email unsubscribed: ${email}`);
  }
}