import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE - Files (shared)
// Módulo de armazenamento de arquivos usando MinIO
// ═══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [
    UniversalModule,
    MulterModule.register({
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
