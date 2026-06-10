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
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { AdministratorSpecialtiesService } from './administrator-specialties.service';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER - Specialties (Administrator)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Endpoints customizados seguindo padrão do template.
// Rotas CRUD básicas são herdadas do UniversalController.
//
// Rotas customizadas:
// - GET    /admin/specialties              → listarEspecialidades
// - GET    /admin/specialties/:id          → buscarEspecialidadePorId
// - POST   /admin/specialties              → criarEspecialidade
// - PATCH  /admin/specialties/:id          → atualizarEspecialidade
// - DELETE /admin/specialties/:id          → desativarEspecialidade
//
// ============================================================================

@ApiTags('admin/specialties')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({
  GET: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  POST: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  PATCH: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  DELETE: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
})
@Controller('admin/specialties')
export class AdministratorSpecialtiesController extends UniversalController<
  CreateSpecialtyDto,
  UpdateSpecialtyDto,
  AdministratorSpecialtiesService
> {
  constructor(service: AdministratorSpecialtiesService) {
    super(service);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTES CUSTOM - Vêm ANTES das rotas com :id do UniversalController
  // ═══════════════════════════════════════════════════════════════════════════

  @Get()
  @ApiOperation({ summary: 'Lista especialidades com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite (default: 50)' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filtrar por categoria' })
  listarEspecialidades(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
  ) {
    return this.service.listarEspecialidades(
      Number(page) || 1,
      Number(limit) || 50,
      category,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca especialidade por ID' })
  buscarPorId(@Param('id') id: string) {
    return this.service.buscarEspecialidadePorId(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria nova especialidade' })
  criarEspecialidade(@Body() dto: CreateSpecialtyDto) {
    return this.service.criarEspecialidade(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza especialidade' })
  atualizarEspecialidade(@Param('id') id: string, @Body() dto: UpdateSpecialtyDto) {
    return this.service.atualizarEspecialidade(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativa especialidade (soft delete)' })
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  desativar(@Param('id') id: string) {
    return this.service.desativarEspecialidade(id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTES DE STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':id/activate')
  @ApiOperation({ summary: 'Ativar especialidade' })
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  activate(@Param('id') id: string) {
    return this.service.atualizarEspecialidade(id, { status: CatalogItemStatus.ACTIVE } as any);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Desativar especialidade' })
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  deactivate(@Param('id') id: string) {
    return this.service.atualizarEspecialidade(id, { status: CatalogItemStatus.INACTIVE } as any);
  }
}