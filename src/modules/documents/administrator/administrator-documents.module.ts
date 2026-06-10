import { Module } from '@nestjs/common';
import { AdministratorDocumentsService } from './administrator-documents.service';
import { AdministratorDocumentsController } from './administrator-documents.controller';
import { UniversalModule } from 'src/shared/universal/universal.module';

@Module({ imports: [UniversalModule], controllers: [AdministratorDocumentsController], providers: [AdministratorDocumentsService], exports: [AdministratorDocumentsService] })
export class AdministratorDocumentsModule {}