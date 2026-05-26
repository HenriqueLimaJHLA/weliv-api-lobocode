import { Controller, Get, Patch, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Roles } from '@prisma/client';
import { ProfessionalsService } from './professionals.service';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleGuard } from 'src/shared/auth/guards/role.guard';
import { TenantInterceptor } from 'src/shared/tenant/tenant.interceptor';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';

@UseGuards(AuthGuard, RoleGuard)
@UseInterceptors(TenantInterceptor)
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly service: ProfessionalsService) {}

  // Busca pública (paciente)
  @Get()
  buscarProfissionaisDisponiveis(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('specialty') specialty?: string,
    @Query('name') name?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.service.buscarProfissionaisDisponiveis(Number(page), Number(limit), { specialty, name, companyId });
  }

  // Perfil do profissional logado — antes de :id
  @Get('me')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  obterMeuPerfil() {
    return this.service.obterMeuPerfil();
  }

  @Patch('me')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  atualizarMeuPerfil(@Body() dto: UpdateProfessionalDto) {
    return this.service.atualizarMeuPerfil(dto);
  }

  // Por empresa (admin)
  @Get('company')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN, Roles.PROFESSIONAL)
  listarPorEmpresa(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.service.listarPorEmpresa(Number(page), Number(limit), search);
  }

  // Detalhe por ID
  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.service.buscarPorId(id);
  }
}
