import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dto';
import { IAuthResponse } from '../interfaces';
import { LoginPortal } from '../login-portal';
import { RefreshTokenService } from './refresh-token.service';
import { AuditService } from './audit.service';
import { LoginService } from './login.service';
import { AuthValidator } from '../validators/auth.validator';
import { Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly auditService: AuditService,
    private readonly loginService: LoginService,
    private readonly authValidator: AuthValidator,
  ) {}

  async login(
    loginDto: LoginDto,
    portal: LoginPortal,
    request?: Request,
  ): Promise<IAuthResponse> {
    return this.loginService.login(loginDto, portal, request);
  }

  /**
   * Renova o access token usando refresh token
   */
  async refresh(
    refreshToken: string,
    request?: Request,
  ): Promise<IAuthResponse> {
    const refreshResponse = this.refreshTokenService.refresh(refreshToken);

    // Validar se o usuário existe e está ativo
    const user = await this.authValidator.validateUserExists(refreshResponse.userId);

    if (request) {
      await this.auditService.logTokenRefresh(user.id, request, true);
    }

    return {
      access_token: refreshResponse.access_token,
      refresh_token: refreshResponse.refresh_token,
      expires_in: refreshResponse.expires_in,
      token_type: 'Bearer',
      // user: {
      //   id: user.id,
      //   name: user.name,
      //   email: user.email,
      //   role: user.role, 
      //   userPermissions: user.permissions.map((permission) => permission.permissionType),
      // },
    };
  }

  /**
   * Faz logout revogando o refresh token
   */
  async logout(refreshToken: string, request?: Request): Promise<void> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      if (request) {
        await this.auditService.logLogout(payload.sub, request, 'single');
      }
    } catch (error) {
      // Logout sempre retorna sucesso, mesmo se o token for inválido
      console.warn('Logout warning:', error.message);
    }
    await this.refreshTokenService.revoke(refreshToken);
  }

  /**
   * Faz logout em todos os dispositivos do usuário
   */
  async logoutAll(userId: string, request?: Request): Promise<void> {
    try {
      if (request) {
        await this.auditService.logLogout(userId, request, 'all');
      }
    } catch (error) {
      console.warn('Logout all warning:', error.message);
    }
    await this.refreshTokenService.revokeAll(userId);
  }
}
