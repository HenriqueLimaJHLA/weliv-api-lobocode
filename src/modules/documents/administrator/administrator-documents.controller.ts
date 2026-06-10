import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@prisma/client';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleByMethodGuard } from 'src/shared/auth/guards/role-by-method.guard';
import { RoleByMethod } from 'src/shared/auth/role-by-method.decorator';
import { UniversalController } from 'src/shared/universal';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { AdministratorDocumentsService } from './administrator-documents.service';

@ApiTags('admin/documents')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({ GET: [Roles.SYSTEM_ADMIN, Roles.ADMIN], POST: [Roles.SYSTEM_ADMIN, Roles.ADMIN], PATCH: [Roles.SYSTEM_ADMIN, Roles.ADMIN] })
@Controller('admin/documents')
export class AdministratorDocumentsController extends UniversalController<CreateDocumentDto, UpdateDocumentDto, AdministratorDocumentsService> {
  constructor(service: AdministratorDocumentsService) { super(service); }

  @Get()
  @ApiOperation({ summary: 'Lista documentos' })
  listar(@Query() query: any) {
    return this.service.listarDocumentos(query.page ? Number(query.page) : 1, query.limit ? Number(query.limit) : 20, query.patientId, query.type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca documento por ID' })
  buscarPorId(@Param('id') id: string) { return this.service.buscarDocumentoPorId(id); }

  @Post()
  @ApiOperation({ summary: 'Cria documento' })
  criarDocumento(@Body() dto: CreateDocumentDto) { return this.service.criarDocumento(dto); }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza documento' })
  atualizarDocumento(@Param('id') id: string, @Body() dto: UpdateDocumentDto) { return this.service.atualizarDocumento(id, dto); }
}