import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UniversalQueryService } from './services/query.service';
import { UniversalRepository } from './repositories/universal.repository';
import { UniversalPermissionService } from './services/permission.service';

import { UniversalMetricsService } from './services/metrics.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    // Serviços universais - VERSÃO SIMPLES
    UniversalRepository,
    UniversalQueryService,
    UniversalPermissionService,
    UniversalMetricsService,
  ],
  exports: [
    UniversalRepository,
    UniversalQueryService,
    UniversalPermissionService,
    UniversalMetricsService,
    PrismaModule,
  ],
})
export class UniversalModule {}
