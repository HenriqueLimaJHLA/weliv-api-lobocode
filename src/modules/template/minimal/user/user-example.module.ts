import { Module } from '@nestjs/common';
import { UserExampleService } from './user-example.service';
import { UserExampleController } from './user-example.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';

@Module({
  imports: [
    // UniversalModule é @Global() e provê automaticamente:
    // UniversalRepository, UniversalQueryService, UniversalPermissionService,
    // UniversalMetricsService e PrismaModule (via export)
    UniversalModule,
  ],
  controllers: [UserExampleController],
  providers: [UserExampleService],
  exports: [UserExampleService],
})
export class UserExampleModule {}
