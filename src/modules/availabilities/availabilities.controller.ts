import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Roles } from '@prisma/client';
import { AvailabilitiesService } from './availabilities.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleGuard } from 'src/shared/auth/guards/role.guard';
import { TenantInterceptor } from 'src/shared/tenant/tenant.interceptor';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';

@UseGuards(AuthGuard, RoleGuard)
@UseInterceptors(TenantInterceptor)
@Controller('availabilities')
export class AvailabilitiesController {
  constructor(private readonly service: AvailabilitiesService) {}

  // Bloqueios do profissional logado
  @Get('me')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  listarMeusBloqueios(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.service.listarMeusBloqueios(Number(page), Number(limit));
  }

  @Post()
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  criar(@Body() dto: CreateAvailabilityDto) {
    return this.service.criar(dto);
  }

  @Patch(':id')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  atualizar(@Param('id') id: string, @Body() dto: UpdateAvailabilityDto) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  remover(@Param('id') id: string) {
    return this.service.remover(id);
  }

  // Por profissional (admin/PRO)
  @Get('professional/:id')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  listarPorProfissional(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.service.listarPorProfissional(id, Number(page), Number(limit));
  }

  @Get('professional/:id/date/:date')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  listarBloqueadosPorData(@Param('id') id: string, @Param('date') date: string) {
    return this.service.listarBloqueadosPorData(id, date);
  }

  @Get(':id')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  buscarPorId(@Param('id') id: string) {
    return this.service.buscarPorId(id);
  }
}
