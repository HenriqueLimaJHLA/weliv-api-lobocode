import {
  Module,
  NestModule,
  MiddlewareConsumer,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_PIPE, APP_FILTER } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// modules
import { AuthModule } from './shared/auth/auth.module';
import { RateLimitMiddleware } from './shared/common/middleware/rate-limit.middleware';

// modules globais
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { SoftDeleteInterceptor } from './shared/interceptors/soft-delete.interceptor';
import { TenantModule } from './shared/tenant/tenant.module';
import { LoggerModule } from './shared/common/logger/logger.module';
import { MessagesModule } from './shared/common/messages/messages.module';
import { PrismaModule } from './shared/prisma/prisma.module';
import { CaslModule } from './shared/casl/casl.module';
import { UniversalModule } from './shared/universal/universal.module';

import {
  HttpExceptionFilter,
  ForbiddenErrorFilter,
  NotFoundErrorFilter,
  ConflictErrorFilter,
  UnauthorizedErrorFilter,
  ValidationErrorFilter,
  InvalidCredentialsErrorFilter,
  AuthErrorFilter,
  RequiredFieldErrorFilter,
  PrismaErrorFilter,
} from './shared/common/filters';
import { FilesModule } from './shared/files/files.module';
//javascript es7

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule,
    MessagesModule,
    PrismaModule,
    CaslModule,
    TenantModule,
    UniversalModule,
    PrometheusModule.register(),
    AuthModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          transformOptions: {
            enableImplicitConversion: true,
          },
        }),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SoftDeleteInterceptor,
    },
    // Filtros específicos para erros customizados
    {
      provide: APP_FILTER,
      useClass: PrismaErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ForbiddenErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: RequiredFieldErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: NotFoundErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ConflictErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: UnauthorizedErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ValidationErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: InvalidCredentialsErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: AuthErrorFilter,
    },
    // Filtro para exceções HTTP padrão do NestJS
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes('*');
  }
}