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
import { Roles, ProfessionalStatus } from '@prisma/client';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleByMethodGuard } from 'src/shared/auth/guards/role-by-method.guard';
import { RoleByMethod } from 'src/shared/auth/role-by-method.decorator';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';
import { UniversalController } from 'src/shared/universal';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { AdministratorProfessionalsService } from './administrator-professionals.service';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER - Professionals (Administrator)
// ═══════════════════════════════════════════════════════════════════════════════

@ApiTags('admin/professionals')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({
  GET: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  POST: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  PATCH: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  DELETE: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
})
@Controller('admin/professionals')
export class AdministratorProfessionalsController extends UniversalController<
  CreateProfessionalDto,
  UpdateProfessionalDto,
  AdministratorProfessionalsService
> {
  constructor(service: AdministratorProfessionalsService) {
    super(service);
  }

  @Get()
  @ApiOperation({ summary: 'Lista profissionais com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'specialtyId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  listarProfissionais(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('specialtyId') specialtyId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.listarProfissionais(
      Number(page) || 1,
      Number(limit) || 20,
      specialtyId,
      status,
    );
  }

  @Get('by-user/:userId')
  @ApiOperation({ summary: 'Busca profissional por userId' })
  buscarPorUserId(@Param('userId') userId: string) {
    return this.service.buscarPorUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca profissional por ID' })
  buscarPorId(@Param('id') id: string) {
    return this.service.buscarProfissionalPorId(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria novo profissional' })
  criarProfissional(@Body() dto: CreateProfessionalDto) {
    return this.service.criarProfissional(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza profissional' })
  atualizarProfissional(@Param('id') id: string, @Body() dto: UpdateProfessionalDto) {
    return this.service.atualizarProfissional(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativa profissional (soft delete)' })
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  desativarProfissional(@Param('id') id: string) {
    return this.service.desativarProfissional(id);
  }

  // Status routes
  @Post(':id/activate')
  @ApiOperation({ summary: 'Ativar profissional' })
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  activate(@Param('id') id: string) {
    return this.service.ativarProfissional(id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Desativar profissional' })
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  deactivate(@Param('id') id: string) {
    return this.service.desativarProfissional(id);
  }

  @Post(':id/vacation')
  @ApiOperation({ summary: 'Marcar como em férias' })
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  vacation(@Param('id') id: string) {
    return this.service.marcarFerias(id);
  }
}