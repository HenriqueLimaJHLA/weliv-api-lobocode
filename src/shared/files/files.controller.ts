import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '@prisma/client';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleByMethodGuard } from 'src/shared/auth/guards/role-by-method.guard';
import { RoleByMethod } from 'src/shared/auth/role-by-method.decorator';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';
import { UniversalController } from 'src/shared/universal';
import { CreateFileDto, FileType } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { FilesService } from './files.service';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER - Files (shared)
// ═══════════════════════════════════════════════════════════════════════════════

@ApiTags('admin/files')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({
  GET: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  POST: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  PATCH: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  DELETE: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
})
@Controller('admin/files')
export class FilesController extends UniversalController<
  CreateFileDto,
  UpdateFileDto,
  FilesService
> {
  constructor(service: FilesService) {
    super(service);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UPLOAD (Custom - não usa CRUD do UniversalController)
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload de arquivo' })
  upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 100MB
        ],
      }),
    )
    file: any,
    @Query('type') type: string,
    @Query('description') description?: string,
  ) {
    if (!type || !Object.values(FileType).includes(type as FileType)) {
      throw new BadRequestException(
        `Tipo inválido. Use: ${Object.values(FileType).join(', ')}`,
      );
    }
    return this.service.upload(file, type as FileType, description);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ROTAS CUSTOM (antes das rotas com :id)
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('by-type')
  @ApiOperation({ summary: 'Busca arquivos por tipo' })
  @ApiQuery({ name: 'type', required: true, enum: FileType })
  buscarPorTipo(@Query('type') type: FileType) {
    if (!Object.values(FileType).includes(type)) {
      throw new BadRequestException(
        `Tipo inválido. Use: ${Object.values(FileType).join(', ')}`,
      );
    }
    return this.service.buscarPorTipo(type);
  }

  @Get('by-uploaded-by')
  @ApiOperation({ summary: 'Busca arquivos por usuário que fez upload' })
  @ApiQuery({ name: 'uploadedBy', required: true, description: 'ID do usuário' })
  buscarPorUploadedBy(@Query('uploadedBy') uploadedBy: string) {
    if (!uploadedBy?.trim()) {
      throw new BadRequestException('uploadedBy é obrigatório');
    }
    return this.service.buscarPorUploadedBy(uploadedBy);
  }

  @Get('stats')
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  @ApiOperation({ summary: 'Estatísticas de arquivos' })
  obterResumoEstatisticas() {
    return this.service.obterResumoEstatisticas();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETE CUSTOM (MinIO + Soft Delete)
  // ═══════════════════════════════════════════════════════════════════════════

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar arquivo (MinIO + soft delete)' })
  async deleteFile(@Param('id') id: string) {
    return this.service.deleteFile(id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ROTAS HERDADAS DO UniversalController:
  // GET / → buscarComPaginacao
  // GET /all → buscarTodos
  // GET /:id       → buscarPorId
  // POST /         → criar (não usar para upload, usar /upload)
  // PATCH /:id     → atualizar
  // DELETE /:id    → desativar (customizado acima)
  // ═══════════════════════════════════════════════════════════════════════════
}
