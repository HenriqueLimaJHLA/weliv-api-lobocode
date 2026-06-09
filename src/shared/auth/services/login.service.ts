import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CaslAbilityService } from '../../casl/casl-ability/casl-ability.service';
import { packRules } from '@casl/ability/extra';
import { LoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { RegisterDto } from '../dto/register.dto';
import { RegisterCompanyDto } from '../dto/register-company.dto';
import { IAuthResponse, IRegisterResponse, ITokenPayload } from '../interfaces';
import { RefreshTokenService } from './refresh-token.service';
import { AuditService } from './audit.service';
import { SecurityService } from './security.service';
import { AuthValidator } from '../validators/auth.validator';
import { MessagesService } from '../../common/messages/messages.service';
import { Request } from 'express';
import { Roles } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UnauthorizedError } from '../../common/errors';

@Injectable()
export class LoginService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly abilityService: CaslAbilityService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly auditService: AuditService,
    private readonly securityService: SecurityService,
    private readonly authValidator: AuthValidator,
    private readonly prisma: PrismaService,
    private readonly messagesService: MessagesService,
  ) {}

  /**
   * Realiza login do usuário
   */
  async login(loginDto: LoginDto, request?: Request): Promise<IAuthResponse> {
    try {
      // Validar credenciais usando AuthValidator
      const user = await this.authValidator.validateCredentials(loginDto);

      // Análise de segurança se request estiver disponível
      if (request) {
        const securityEvents = await this.securityService.analyzeLoginActivity(
          user.id,
          request,
          true,
        );

        if (securityEvents.length > 0) {
          await this.securityService.processSecurityEvents(
            securityEvents,
            request,
          );
        }
      }

      // Gerar abilities do usuário
      const ability = this.abilityService.createForUser(user);

      // Criar payload do token
      const payload: ITokenPayload = {
        name: user.name,
        email: user.email,
        role: user.role,
        sub: user.id,
        permissions: packRules(ability.rules),
        companyId: user.companyId || undefined,
      };

      // Gerar access token
      const access_token = this.jwtService.sign(payload);
      const expires_in = 2 * 60 * 60; // 2h em segundos

      // Gerar refresh token
      const { refresh_token } = this.refreshTokenService.generate(user);

      // Log de sucesso
      if (request) {
        await this.auditService.logLoginSuccess(user.id, request, {
          role: user.role,
          companyId: user.companyId || null,
        });
      }

      return {
        access_token,
        refresh_token,
        expires_in,
        token_type: 'Bearer',
        // user: {
        //   id: user.id,
        //   name: user.name,
        //   email: user.email,
        //   role: user.role,
        // },
      };
    } catch (error) {
      // Log de falha se request estiver disponível
      if (request) {
        await this.auditService.logLoginFailed(
          loginDto.login,
          request,
          error.message,
        );
      }
      throw error;
    }
  }

  /**
   * Registra um novo usuário
   */
  async register(
    registerDto: RegisterDto,
    request?: Request,
  ): Promise<IRegisterResponse> {
    try {
      // Validar se email já existe
      await this.userValidator.validarSeEmailEhUnico(registerDto.email);

      // Hash da senha
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // Criar dados do usuário
      const userData = {
        name: this.normalizeName(registerDto.name),
        email: registerDto.email.trim().toLowerCase(),
        password: hashedPassword,
        role: Roles.USER, // Usuário comum do app
        phone: registerDto.phone || null,
        status: 'ACTIVE' as const,
      };

      // Criar usuário no banco
      const user = await this.userRepository.criar(userData);

      // Log de sucesso do registro
      if (request) {
        await this.auditService.logLoginSuccess(user.id, request, {
          role: user.role,
          companyId: user.companyId || null,
        });
      }

      // Retornar apenas confirmação de sucesso
      return {
        success: true,
        message: 'Usuário registrado com sucesso',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      // Log de falha se request estiver disponível
      if (request) {
        await this.auditService.logLoginFailed(
          registerDto.email,
          request,
          error.message,
        );
      }
      throw error;
    }
  }

  /**
   * Cadastro profissional simplificado:
   * - cria Company (empresa)
   * - cria User ligado à Company
   * - retorna tokens (mesmo formato do login)
   */
  async registerCompany(
    registerDto: RegisterCompanyDto,
    request?: Request,
  ): Promise<IAuthResponse> {
    // Validar se email já existe
    await this.userValidator.validarSeEmailEhUnico(registerDto.email);

    const email = registerDto.email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: registerDto.businessName.trim(),
          contactEmail: email,
          contactPhone: registerDto.phone || null,
          cnpj: registerDto.cnpj?.replace(/\D/g, '') || null, // Remove formatação (pode ser CNPJ ou CPF)
          website: registerDto.website?.trim() || null,
          address: registerDto.address?.trim() || null,
          addressNumber: registerDto.addressNumber?.trim() || null,
          city: registerDto.city?.trim() || null,
          state: registerDto.state?.trim() || null,
          zipCode: registerDto.zipCode?.replace(/\D/g, '') || null,
        },
        select: { id: true },
      });

      await tx.user.create({
        data: {
          name: this.normalizeName(registerDto.name),
          email,
          password: hashedPassword,
          role: Roles.ADMIN,
          phone: registerDto.phone || null,
          status: 'ACTIVE',
          company: { connect: { id: company.id } },
        },
        select: { id: true },
      });
    });

    // Reutiliza o fluxo de login (mesmo payload/tokens/auditoria)
    return this.login({ login: email, password: registerDto.password }, request);
  }

  /**
   * Altera a senha do usuário autenticado (senha atual + nova senha).
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true, status: true },
    });

    if (!user) {
      throw new UnauthorizedError(
        this.messagesService.getErrorMessage('AUTH', 'USER_NOT_FOUND'),
      );
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError(
        this.messagesService.getErrorMessage('RESOURCE', 'INACTIVE'),
      );
    }

    const isCurrentValid = bcrypt.compareSync(dto.currentPassword, user.password);
    if (!isCurrentValid) {
      throw new UnauthorizedError(
        this.messagesService.getErrorMessage('AUTH', 'INVALID_CREDENTIALS'),
      );
    }

    const hashedNew = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNew },
    });
  }

  private normalizeName(name: string): string {
    if (!name) {
      return '';
    }

    return name
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
