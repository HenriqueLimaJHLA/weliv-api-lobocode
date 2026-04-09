import {
  Body,
  Controller,
  Post,
  UseGuards,
  HttpCode,
  Get,
  Query,
  Req,
} from '@nestjs/common';
import {
  LoginDto,
  RefreshDto,
  LogoutDto,
  ForgotPasswordDto,
  ValidateResetTokenDto,
  ResetPasswordDto,
} from './dto';
import { AuthService } from './services';
import { AuthGuard, RefreshGuard, RateLimitGuard } from './guards';
import { Public } from './decorators';
import { PasswordResetService } from './services/password-reset.service';
import { MetricsService } from './services/metrics.service';
import { MessagesService } from '../common/messages/messages.service';
import { Request } from 'express';
import { UnauthorizedError } from '../common/errors';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
    private readonly metricsService: MetricsService,
    private readonly messagesService: MessagesService,
  ) {}

  @Post('login')
  @Public()
  @UseGuards(RateLimitGuard)
  async login(@Body() loginDto: LoginDto, @Req() request: Request) {
    return this.authService.login(loginDto, request);
  }

  @Post('refresh')
  @Public()
  @UseGuards(RefreshGuard, RateLimitGuard)
  async refresh(@Body() refreshDto: RefreshDto, @Req() request: Request) {
    return this.authService.refresh(refreshDto.refreshToken, request);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  async logout(@Body() logoutDto: LogoutDto, @Req() request: Request) {
    try {
      await this.authService.logout(logoutDto.refreshToken, request);
    } catch (error) {
      // Logout sempre retorna sucesso, mesmo se o token for inválido
      console.warn('Logout warning:', error.message);
    }
  }

  @Post('logout-all')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  async logoutAll(@Body() logoutDto: LogoutDto, @Req() request: Request) {
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedError(
        this.messagesService.getErrorMessage('AUTH', 'USER_NOT_FOUND')
      );
    }
    return this.authService.logoutAll(userId, request);
  }

  /**
   * Solicita reset de senha
   */
  @Post('forgot-password')
  @Public()
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    await this.passwordResetService.requestPasswordReset(dto);
    return {
      message: this.messagesService.getSuccessMessage('OPERATIONS', 'EMAIL_SENT'),
    };
  }

  /**
   * Valida token de reset
   */
  @Post('validate-reset-token')
  @Public()
  async validateResetToken(
    @Body() dto: ValidateResetTokenDto,
  ): Promise<{ isValid: boolean }> {
    const isValid = await this.passwordResetService.validateResetToken(dto);
    return { isValid };
  }

  /**
   * Reseta senha
   */
  @Post('reset-password')
  @Public()
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.passwordResetService.resetPassword(dto);
    return { 
      message: this.messagesService.getSuccessMessage('OPERATIONS', 'PASSWORD_CHANGED')
    };
  }

  /**
   * Obtém métricas de autenticação
   */
  @Get('metrics')
  @UseGuards(AuthGuard)
  async getAuthMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.metricsService.getAuthMetrics(start, end);
  }

  /**
   * Obtém métricas de segurança
   */
  @Get('security-metrics')
  @UseGuards(AuthGuard)
  async getSecurityMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.metricsService.getSecurityMetrics(start, end);
  }

  /**
   * Obtém métricas em tempo real
   */
  @Get('real-time-metrics')
  @UseGuards(AuthGuard)
  async getRealTimeMetrics() {
    return await this.metricsService.getRealTimeMetrics();
  }

  /**
   * Obtém alertas de segurança
   */
  @Get('security-alerts')
  @UseGuards(AuthGuard)
  async getSecurityAlerts() {
    return await this.metricsService.getSecurityAlerts();
  }

  /**
   * Obtém top usuários ativos
   */
  @Get('top-active-users')
  @UseGuards(AuthGuard)
  async getTopActiveUsers(@Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit) : 10;
    return await this.metricsService.getTopActiveUsers(limitNumber);
  }

  /**
   * Exporta métricas
   */
  @Get('export-metrics')
  @UseGuards(AuthGuard)
  async exportMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format: 'json' | 'csv' = 'json',
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return await this.metricsService.exportMetrics(start, end, format);
  }
}
