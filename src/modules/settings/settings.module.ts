import { Module } from '@nestjs/common';
import { AdministratorSettingModule } from './administrator/administrator-setting.module';

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS MODULE
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [AdministratorSettingModule],
  exports: [AdministratorSettingModule],
})
export class SettingsModule {}