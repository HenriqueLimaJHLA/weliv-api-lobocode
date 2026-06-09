import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailDispatchService {
  private readonly logger = new Logger(EmailDispatchService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getTransporter(): Transporter | null {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT') || 465);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const secureConfig = this.configService.get<string>('SMTP_SECURE');
    const secure = secureConfig ? secureConfig === 'true' : port === 465;

    if (!host || !user || !pass) {
      this.logger.error(
        'SMTP não configurado corretamente. Defina SMTP_HOST, SMTP_USER e SMTP_PASS.',
      );
      return null;
    }

    this.transporter = createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    return this.transporter;
  }

  async send(params: SendEmailParams): Promise<boolean> {
    const from = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER');
    const transporter = this.getTransporter();
    if (!transporter || !from || !params.to) {
      this.logger.warn('Envio de e-mail ignorado por configuração SMTP incompleta.');
      return false;
    }

    try {
      await transporter.sendMail({
        from,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Falha ao enviar e-mail via SMTP: ${message}`);
      return false;
    }

    this.logger.log(`E-mail enviado com sucesso via SMTP. to=${params.to}`);
    return true;
  }
}
