import { Module } from '@nestjs/common';
import { AdministratorExampleService } from './administrator-example.service';
import { AdministratorExampleController } from './administrator-example.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';

@Module({
  imports: [
    // UniversalModule é @Global() e provê automaticamente:
    // UniversalRepository, UniversalQueryService, UniversalPermissionService,
    // UniversalMetricsService e PrismaModule (via export)
    UniversalModule,
  ],
  controllers: [AdministratorExampleController],
  providers: [AdministratorExampleService],
  exports: [AdministratorExampleService],
})
export class AdministratorExampleModule {}
