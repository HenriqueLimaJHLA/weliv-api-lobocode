import { Module } from '@nestjs/common';
import { AdministratorCompanyModule } from './administrator/administrator-company.module';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPANIES MODULE
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [AdministratorCompanyModule],
  exports: [AdministratorCompanyModule],
})
export class CompaniesModule {}
