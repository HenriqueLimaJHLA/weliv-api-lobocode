import { Module } from '@nestjs/common';
import { AdministratorDocumentsModule } from './administrator/administrator-documents.module';
import { UserDocumentsModule } from './user/user-documents.module';

@Module({ imports: [AdministratorDocumentsModule, UserDocumentsModule], exports: [AdministratorDocumentsModule, UserDocumentsModule] })
export class DocumentsModule {}