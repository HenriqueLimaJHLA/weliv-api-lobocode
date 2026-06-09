import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AUTH_MESSAGES, AUTH_CONSTANTS } from '../constants';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private rateLimitStore = new Map<string, RateLimitEntry>();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const clientId = this.getClientId(request);
    const endpoint = this.getEndpoint(request);

    // Configurações específicas por endpoint
    const config = this.getRateLimitConfig(endpoint);

    if (!config) {
      return true; // Sem rate limit para este endpoint
    }

    const key = `${clientId}:${endpoint}`;
    const now = Date.now();

    // Limpa entradas expiradas
    this.cleanupExpiredEntries();

    // Verifica rate limit
    const entry = this.rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      // Primeira requisição ou janela expirada
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    if (entry.count >= config.maxAttempts) {
      throw new UnauthorizedException(AUTH_MESSAGES.ERROR.TOO_MANY_ATTEMPTS);
    }

    // Incrementa contador
    entry.count++;
    return true;
  }

  /**
   * Obtém identificador único do cliente
   */
  private getClientId(request: Request): string {
    // Prioriza IP real (considerando proxy)
    const ip =
      request.ip ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown';

    return ip.toString();
  }

  /**
   * Obtém o endpoint da requisição
   */
  private getEndpoint(request: Request): string {
    return `${request.method}:${request.path}`;
  }

  /**
   * Obtém configuração de rate limit por endpoint
   */
  private getRateLimitConfig(endpoint: string) {
    const configs = {
      'POST:/auth/login': {
        maxAttempts: AUTH_CONSTANTS.RATE_LIMIT.LOGIN_MAX_ATTEMPTS,
        windowMs: AUTH_CONSTANTS.RATE_LIMIT.LOGIN_WINDOW_MS,
      },
      'POST:/auth/refresh': {
        maxAttempts: AUTH_CONSTANTS.RATE_LIMIT.REFRESH_MAX_ATTEMPTS,
        windowMs: AUTH_CONSTANTS.RATE_LIMIT.REFRESH_WINDOW_MS,
      },
      'POST:/auth/forgot-password': {
        maxAttempts: 20, 
        windowMs: 15 * 60 * 1000, // 15 minutos
      },
      'POST:/auth/reset-password': {
        maxAttempts: 20,
        windowMs: 15 * 60 * 1000, // 15 minutos
      },
    };

    return configs[endpoint];
  }

  /**
   * Limpa entradas expiradas do store
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();

    this.rateLimitStore.forEach((entry, key) => {
      if (now > entry.resetTime) {
        this.rateLimitStore.delete(key);
      }
    });
  }

  /**
   * Reseta rate limit para um cliente específico (útil para testes)
   */
  resetClient(clientId: string): void {
    this.rateLimitStore.forEach((entry, key) => {
      if (key.startsWith(clientId)) {
        this.rateLimitStore.delete(key);
      }
    });
  }
}
