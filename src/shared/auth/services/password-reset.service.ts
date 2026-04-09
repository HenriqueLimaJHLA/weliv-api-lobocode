import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordService } from './password.service';
import { EmailService } from './email.service';
import { MessagesService } from '../../common/messages/messages.service';
import { AuthValidator } from '../validators/auth.validator';
import {
  CreatePasswordResetDto,
  ResetPasswordDto,
  ValidateResetTokenDto,
} from '../dto';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly passwordService: PasswordService,
    private readonly emailService: EmailService,
    private readonly messagesService: MessagesService,
    private readonly authValidator: AuthValidator,
  ) {}

  /**
   * Solicita reset de senha
   */
  async requestPasswordReset(dto: CreatePasswordResetDto): Promise<void> {
    const { email } = dto;

    // Validar se o email existe e está ativo
    const user = await this.authValidator.validateEmailForReset(email);

    if (!user) {
      // Por segurança, não revelamos se o email existe ou não
      return;
    }

    // Gera token de reset
    const resetToken = await this.generateResetToken(user.id, user.email);

    // Envia email
    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken,
    );
  }

  /**
   * Valida token de reset
   */
  async validateResetToken(dto: ValidateResetTokenDto): Promise<boolean> {
    const { token } = dto;

    try {
      // Valida JWT
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Verifica se é um token de reset
      if (payload.type !== 'password_reset') {
        return false;
      }

      // Verifica se usuário ainda existe e está ativo
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, status: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Reseta senha com token
   */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = dto;

    // Valida token
    const isValid = await this.validateResetToken({ token });
    if (!isValid) {
      throw new BadRequestException(
        this.messagesService.getErrorMessage('AUTH', 'TOKEN_EXPIRED')
      );
    }

    // Decodifica token para pegar userId
    const payload = this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });

    // Validar se o usuário existe e está ativo
    const user = await this.authValidator.validateUserExists(payload.sub);

    // Hash da nova senha
    const hashedPassword = await this.passwordService.hashPassword(newPassword);

    // Atualiza senha
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    // Envia email de confirmação
    await this.emailService.sendPasswordChangedEmail(user.email, user.name);
  }

  /**
   * Gera token JWT para reset de senha
   */
  private async generateResetToken(
    userId: string,
    email: string,
  ): Promise<string> {
    const payload = {
      sub: userId,
      email,
      type: 'password_reset',
      iat: Math.floor(Date.now() / 1000),
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '1h', // 1 hora
    });
  }
}
