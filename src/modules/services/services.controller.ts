import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Roles } from '@prisma/client';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleGuard } from 'src/shared/auth/guards/role.guard';
import { TenantInterceptor } from 'src/shared/tenant/tenant.interceptor';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';

@UseGuards(AuthGuard, RoleGuard)
@UseInterceptors(TenantInterceptor)
@Controller('services')
export class ServicesController {
  constructor(private readonly service: ServicesService) {}

  // ============================================================================
  // ESPECIALIDADES
  // ============================================================================

  @Get('specialties')
  listarEspecialidades(@Query('page') page = '1', @Query('limit') limit = '50') {
    return this.service.listarEspecialidades(Number(page), Number(limit));
  }

  @Get('specialties/:id')
  buscarEspecialidadePorId(@Param('id') id: string) {
    return this.service.buscarEspecialidadePorId(id);
  }

  @Post('specialties')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  criarEspecialidade(@Body() dto: CreateSpecialtyDto) {
    return this.service.criarEspecialidade(dto);
  }

  @Patch('specialties/:id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  atualizarEspecialidade(@Param('id') id: string, @Body() dto: Partial<CreateSpecialtyDto>) {
    return this.service.atualizarEspecialidade(id, dto);
  }

  @Delete('specialties/:id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  desativarEspecialidade(@Param('id') id: string) {
    return this.service.desativarEspecialidade(id);
  }

  // ============================================================================
  // SERVIÇOS (catálogo de procedimentos)
  // ============================================================================

  @Get()
  listarServicos(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('specialtyId') specialtyId?: string,
  ) {
    return this.service.listarServicos(Number(page), Number(limit), specialtyId);
  }

  @Post()
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  criarServico(@Body() dto: CreateServiceDto) {
    return this.service.criarServico(dto);
  }

  @Patch(':id')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  atualizarServico(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.service.atualizarServico(id, dto);
  }

  @Delete(':id')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  desativarServico(@Param('id') id: string) {
    return this.service.desativarServico(id);
  }

  @Post(':id/reativar')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  reativarServico(@Param('id') id: string) {
    return this.service.reativarServico(id);
  }

  @Get(':id')
  buscarServicoPorId(@Param('id') id: string) {
    return this.service.buscarServicoPorId(id);
  }
}
