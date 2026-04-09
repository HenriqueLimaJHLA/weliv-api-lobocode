import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  /**
   * Envia email de reset de senha
   */
  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    // TODO: Implementar integração com serviço de email (SendGrid, AWS SES, etc.)
    this.logger.log(`Email de reset de senha enviado para ${email}`);
    this.logger.log(`Token: ${token}`);
    
    // Por enquanto, apenas loga a ação
    // Em produção, integrar com serviço de email real
  }

  /**
   * Envia email de confirmação de mudança de senha
   */
  async sendPasswordChangedEmail(email: string, name: string): Promise<void> {
    // TODO: Implementar integração com serviço de email
    this.logger.log(`Email de confirmação de mudança de senha enviado para ${email}`);
    
    // Por enquanto, apenas loga a ação
    // Em produção, integrar com serviço de email real
  }

  /**
   * Envia email de boas-vindas
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    // TODO: Implementar integração com serviço de email
    this.logger.log(`Email de boas-vindas enviado para ${email}`);
    
    // Por enquanto, apenas loga a ação
    // Em produção, integrar com serviço de email real
  }

  /**
   * Envia email de notificação de login suspeito
   */
  async sendSuspiciousLoginEmail(email: string, name: string, location: string): Promise<void> {
    // TODO: Implementar integração com serviço de email
    this.logger.log(`Email de login suspeito enviado para ${email} - Localização: ${location}`);
    
    // Por enquanto, apenas loga a ação
    // Em produção, integrar com serviço de email real
  }
} 