import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailDispatchService } from '../../email/services/email-dispatch.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly appDisplayName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailDispatchService: EmailDispatchService,
  ) {
    this.appDisplayName = this.configService.get<string>(
      'APP_DISPLAY_NAME',
      'Lobocode Template',
    );
  }

  /**
   * Envia email de reset de senha
   */
  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    const frontUrl =
      this.configService.get<string>('AUTH_RESET_PASSWORD_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      '';
    const resetUrl = frontUrl
      ? `${frontUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`
      : token;
    const supportEmail =
      this.configService.get<string>('SUPPORT_EMAIL') || 'support@lobocode.local';
    const subject = `Recuperacao de senha - ${this.appDisplayName}`;
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Redefinicao de senha</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden;">
                <tr>
                  <td style="background:#FBAB2A; padding:20px; text-align:center; color:#ffffff;">
                    <h1 style="margin:0; font-size:22px;">${this.appDisplayName} 🐾</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px;">
                    <h2 style="margin-top:0; color:#333;">Esqueceu sua senha?</h2>
                    <p style="color:#555; font-size:14px;">
                      Ola, <strong>${name}</strong> 👋
                    </p>
                    <p style="color:#555; font-size:14px;">
                      Recebemos uma solicitacao para redefinir sua senha.
                      Clique no botao abaixo para criar uma nova senha:
                    </p>
                    <table cellpadding="0" cellspacing="0" style="margin:20px 0;">
                      <tr>
                        <td align="center" style="background:#FBAB2A; border-radius:5px;">
                          <a href="${resetUrl}" style="display:inline-block; padding:12px 24px; color:#ffffff; text-decoration:none; font-weight:bold;">
                            Redefinir senha
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color:#999; font-size:12px;">
                      Se voce nao solicitou essa alteracao, pode ignorar este e-mail.
                    </p>
                    <p style="color:#999; font-size:12px;">
                      Este link expira em 30 minutos por seguranca.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb; padding:20px; text-align:center;">
                    <p style="margin:0; font-size:12px; color:#999;">
                      Precisa de ajuda? Fale com a gente:
                      <br />
                      <a href="mailto:${supportEmail}" style="color:#4f46e5;">
                        ${supportEmail}
                      </a>
                    </p>
                    <p style="margin-top:10px; font-size:11px; color:#bbb;">
                      © ${this.appDisplayName} - Todos os direitos reservados
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    const text = [
      `Ola, ${name}!`,
      'Recebemos uma solicitacao para redefinir sua senha.',
      `Acesse o link para criar uma nova senha: ${resetUrl}`,
      `Suporte: ${supportEmail}`,
    ].join('\n');
    this.logger.log(
      `Enviando e-mail de reset via SMTP para=${email} support_email=${supportEmail}`,
    );
    const enviado = await this.emailDispatchService.send({
      to: email,
      subject,
      html,
      text,
    });
    if (!enviado) {
      throw new ServiceUnavailableException(
        'Não foi possível enviar o e-mail de recuperação. Verifique a configuração do serviço de e-mail ou tente novamente mais tarde.',
      );
    }
  }

  /**
   * Envia email de confirmação de mudança de senha
   */
  async sendPasswordChangedEmail(email: string, name: string): Promise<void> {
    await this.emailDispatchService.send({
      to: email,
      subject: `Sua senha foi alterada - ${this.appDisplayName}`,
      html: `<p>Ola, ${name}.</p><p>Sua senha foi alterada com sucesso.</p>`,
      text: `Ola, ${name}. Sua senha foi alterada com sucesso.`,
    });
  }

  /**
   * Envia email de boas-vindas
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.emailDispatchService.send({
      to: email,
      subject: `Bem-vindo(a) ao ${this.appDisplayName}`,
      html: `<p>Ola, ${name}!</p><p>Bem-vindo(a) ao ${this.appDisplayName}.</p>`,
      text: `Ola, ${name}! Bem-vindo(a) ao ${this.appDisplayName}.`,
    });
  }

  /**
   * Envia email de notificação de login suspeito
   */
  async sendSuspiciousLoginEmail(email: string, name: string, location: string): Promise<void> {
    await this.emailDispatchService.send({
      to: email,
      subject: `Alerta de login suspeito - ${this.appDisplayName}`,
      html: `<p>Ola, ${name}.</p><p>Detectamos um login suspeito em: ${location}.</p>`,
      text: `Ola, ${name}. Detectamos um login suspeito em: ${location}.`,
    });
  }

  /**
   * Envia email de convite para tutor compartilhado
   */
  async sendSharedTutorInviteEmail(
    inviteEmail: string,
    ownerName: string,
    petNames: string[],
    inviteId: string,
  ): Promise<void> {
    const petNamesText = petNames.join(', ');
    await this.emailDispatchService.send({
      to: inviteEmail,
      subject: `Convite para tutor compartilhado - ${this.appDisplayName}`,
      html: `<p>${ownerName} convidou voce para acompanhar: ${petNamesText}.</p><p>Codigo do convite: ${inviteId}</p>`,
      text: `${ownerName} convidou voce para acompanhar: ${petNamesText}. Codigo do convite: ${inviteId}`,
    });
    this.logger.log(`Convite de tutor compartilhado enviado para ${inviteEmail}`);
  }
} 