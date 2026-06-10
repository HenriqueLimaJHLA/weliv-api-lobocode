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

// modules core
import { AuthModule } from './shared/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FilesModule } from './shared/files/files.module';
import { SpecialtiesModule } from './modules/specialties/specialties.module';
import { ServicesModule } from './modules/services/services.module';
import { ProfessionalsModule } from './modules/professionals/professionals.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ChargesModule } from './modules/charges/charges.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { DocumentsModule } from './modules/documents/documents.module';

// modules globais
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { SoftDeleteInterceptor } from './shared/interceptors/soft-delete.interceptor';
import { TenantModule } from './shared/tenant/tenant.module';
import { LoggerModule } from './shared/common/logger/logger.module';
import { MessagesModule } from './shared/common/messages/messages.module';
import { PrismaModule } from './shared/prisma/prisma.module';
import { CaslModule } from './shared/casl/casl.module';
import { UniversalModule } from './shared/universal/universal.module';
import { GeocodingModule } from './shared/geocoding/geocoding.module';

import { RateLimitMiddleware } from './shared/common/middleware/rate-limit.middleware';

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

/**
 * Bootstrap do template LoboCode.
 *
 * - Core: módulos essenciais (users, companies, settings, notifications, files)
 * - Plugins: adicionar aqui conforme necessidade do projeto
 * - Integrações opcionais: geocoding (remover se não usar)
 */
@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.ENV_FILE || '.env',
    }),

    // Globais
    LoggerModule,
    MessagesModule,
    PrismaModule,
    CaslModule,
    TenantModule,
    UniversalModule,
    ScheduleModule.forRoot(),
    PrometheusModule.register(),

    // Auth
    AuthModule,

    // Core modules
    UsersModule,
    CompaniesModule,
    SettingsModule,
    NotificationsModule,
    FilesModule,
    SpecialtiesModule,
    ServicesModule,
    ProfessionalsModule,
    PatientsModule,
    AppointmentsModule,
    PaymentsModule,
    ChargesModule,
    MedicalRecordsModule,
    DocumentsModule,

    // --- Plugins (adicionar conforme necessidade) ---
    GeocodingModule,
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
    // Filtros
    { provide: APP_FILTER, useClass: PrismaErrorFilter },
    { provide: APP_FILTER, useClass: ForbiddenErrorFilter },
    { provide: APP_FILTER, useClass: RequiredFieldErrorFilter },
    { provide: APP_FILTER, useClass: NotFoundErrorFilter },
    { provide: APP_FILTER, useClass: ConflictErrorFilter },
    { provide: APP_FILTER, useClass: UnauthorizedErrorFilter },
    { provide: APP_FILTER, useClass: ValidationErrorFilter },
    { provide: APP_FILTER, useClass: InvalidCredentialsErrorFilter },
    { provide: APP_FILTER, useClass: AuthErrorFilter },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes('*');
  }
}
