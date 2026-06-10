import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles, CatalogItemStatus } from '@prisma/client';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleByMethodGuard } from 'src/shared/auth/guards/role-by-method.guard';
import { RoleByMethod } from 'src/shared/auth/role-by-method.decorator';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';
import { UniversalController } from 'src/shared/universal';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AdministratorServicesService } from './administrator-services.service';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER - Services (Administrator)
// ═══════════════════════════════════════════════════════════════════════════════

@ApiTags('admin/services')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({
  GET: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  POST: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  PATCH: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  DELETE: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
})
@Controller('admin/services')
export class AdministratorServicesController extends UniversalController<
  CreateServiceDto,
  UpdateServiceDto,
  AdministratorServicesService
> {
  constructor(service: AdministratorServicesService) {
    super(service);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTES CUSTOM
  // ═══════════════════════════════════════════════════════════════════════════

  @Get()
  @ApiOperation({ summary: 'Lista serviços com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'specialtyId', required: false, type: String })
  listarServicos(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('specialtyId') specialtyId?: string,
  ) {
    return this.service.listarServicos(
      Number(page) || 1,
      Number(limit) || 20,
      specialtyId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca serviço por ID' })
  buscarPorId(@Param('id') id: string) {
    return this.service.buscarServicoPorId(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria novo serviço' })
  criarServico(@Body() dto: CreateServiceDto) {
    return this.service.criarServico(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza serviço' })
  atualizarServico(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.service.atualizarServico(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativa serviço (soft delete)' })
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  desativarServico(@Param('id') id: string) {
    return this.service.desativarServico(id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTES DE STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':id/activate')
  @ApiOperation({ summary: 'Ativar serviço' })
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  activate(@Param('id') id: string) {
    return this.service.atualizarServico(id, { status: CatalogItemStatus.ACTIVE } as any);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Desativar serviço' })
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  deactivate(@Param('id') id: string) {
    return this.service.atualizarServico(id, { status: CatalogItemStatus.INACTIVE } as any);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Reativar serviço' })
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  reativarServico(@Param('id') id: string) {
    return this.service.reativarServico(id);
  }
}