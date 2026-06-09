import {
  Module,
  NestModule,
  MiddlewareConsumer,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_PIPE, APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// modules
import { AuthModule } from './shared/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

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
import { AsaasModule } from './shared/asaas/asaas.module';
import { GeocodingModule } from './shared/geocoding/geocoding.module';
import { NotificationModule } from './modules/infrastructure/notifications/notification.module';
import { DashboardModule } from './modules/infrastructure/dashboard/dashboard.module';
import { WebhooksModule } from './modules/infrastructure/webhooks/webhooks.module';
import { WebhookLogsModule } from './modules/infrastructure/webhook-logs/webhook-logs.module';
import { TicketsModule } from './modules/infrastructure/tickets/tickets.module';
import { TicketRepliesModule } from './modules/infrastructure/ticket-replies/ticket-replies.module';
import { IncidentsModule } from './modules/infrastructure/incidents/incidents.module';
import { IncidentUpdatesModule } from './modules/infrastructure/incident-updates/incident-updates.module';

import { PaymentsModule } from './modules/commercial/payments/payments.module';
import { PayoutsModule } from './modules/commercial/payouts/payouts.module';
import { BookingsModule } from './modules/commercial/bookings/bookings.module';
import { CouponsModule } from './modules/commercial/coupons/coupons.module';
import { AvailabilitiesModule } from './modules/commercial/availabilities/availabilities.module';
import { AvailabilityExceptionsModule } from './modules/commercial/availability-exceptions/availability-exceptions.module';
import { OpeningHoursModule } from './modules/commercial/opening-hours/opening-hours.module';

import { ServicesModule } from './modules/marketplace/services/services.module';
import { ReviewsModule } from './modules/marketplace/reviews/reviews.module';
import { FavoritesModule } from './modules/marketplace/favorites/favorites.module';

import { KycDocumentsModule } from './modules/compliance/kyc-documents/kyc-documents.module';
import { RemindersModule } from './modules/compliance/reminders/reminders.module';


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

/**
 * Bootstrap do template LoboCode.
 *
 * - Core: infra compartilhada + usuários/empresas/arquivos (base de quase todo projeto).
 * - Plugins (domínio): módulos em `src/modules/**` pensados como plugin play — ativados aqui por
 *   padrão para a “galeria” do template; em um projeto real, remova o import e a entrada em
 *   `imports` do que não for usar (não há feature flag por env: o controle é este arquivo).
 * - Notificações: parte do contrato dos módulos que disparam eventos (empresas, agendamentos,
 *   repasses, etc.); mantenha `NotificationModule` no AppModule salvo projeto sem tempo real.
 * - Integrações opcionais por produto: geocoding, Asaas (remover do AppModule se não usar).
 */

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.ENV_FILE || '.env',
    }),
    LoggerModule,
    MessagesModule,
    PrismaModule,
    CaslModule,
    TenantModule,
    UniversalModule,
    ScheduleModule.forRoot(),
    PrometheusModule.register(),
    AuthModule,
    UsersModule,
    CompaniesModule,
    SettingsModule,
    NotificationsModule,
    FilesModule,

    // --- Plugins: integrações (remover se não usar) ---
    NotificationModule,
    GeocodingModule,
    AsaasModule,

    // --- Plugins: infra / suporte ---
    DashboardModule,
    WebhooksModule,
    WebhookLogsModule,
    TicketsModule,
    TicketRepliesModule,
    IncidentsModule,
    IncidentUpdatesModule,

    // --- Plugins: comercial / agenda ---
    PaymentsModule,
    PayoutsModule,
    CouponsModule,
    BookingsModule,
    AvailabilitiesModule,
    AvailabilityExceptionsModule,
    OpeningHoursModule,

    // --- Plugins: marketplace ---
    ServicesModule,
    ReviewsModule,
    FavoritesModule,

    // --- Plugins: compliance ---
    KycDocumentsModule,
    RemindersModule,

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
