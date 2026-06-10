import { Module } from '@nestjs/common';
import { UniversalModule } from 'src/shared/universal';
import { UserDocumentsService } from './user-documents.service';
import { UserDocumentsController } from './user-documents.controller';

@Module({ imports: [UniversalModule], controllers: [UserDocumentsController], providers: [UserDocumentsService], exports: [UserDocumentsService] })
export class UserDocumentsModule {}