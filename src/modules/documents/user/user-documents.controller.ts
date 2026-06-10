import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { UniversalController } from 'src/shared/universal';
import { CreateDocumentDto } from '../administrator/dto/create-document.dto';
import { UpdateDocumentDto } from '../administrator/dto/update-document.dto';
import { UserDocumentsService } from './user-documents.service';

@ApiTags('documents')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('documents')
export class UserDocumentsController extends UniversalController<CreateDocumentDto, UpdateDocumentDto, UserDocumentsService> {
  constructor(service: UserDocumentsService) { super(service); }

  @Get('my-documents')
  @ApiOperation({ summary: 'Meus documentos' })
  meusDocumentos(@Query() query: any) {
    return this.service.meusDocumentos(query.page ? Number(query.page) : 1, query.limit ? Number(query.limit) : 20);
  }
}