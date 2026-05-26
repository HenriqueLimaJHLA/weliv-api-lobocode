import { Controller, Get, Patch, Body, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { Roles } from '@prisma/client';
import { ProviderSettingsService } from './provider-settings.service';
import { UpdateProviderSettingsDto } from './dto/update-provider-settings.dto';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleGuard } from 'src/shared/auth/guards/role.guard';
import { TenantInterceptor } from 'src/shared/tenant/tenant.interceptor';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';

@UseGuards(AuthGuard, RoleGuard)
@UseInterceptors(TenantInterceptor)
@Controller('provider-settings')
export class ProviderSettingsController {
  constructor(private readonly service: ProviderSettingsService) {}

  @Get('me')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  obterMinhasConfiguracoes() {
    return this.service.obterMinhasConfiguracoes();
  }

  @Patch('me')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  atualizarMinhasConfiguracoes(@Body() dto: UpdateProviderSettingsDto) {
    return this.service.atualizarMinhasConfiguracoes(dto);
  }

  @Get('professional/:id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  obterConfiguracoesPorProfissional(@Param('id') id: string) {
    return this.service.obterConfiguracoesPorProfissional(id);
  }

  @Patch('professional/:id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  atualizarConfiguracoesPorProfissional(@Param('id') id: string, @Body() dto: UpdateProviderSettingsDto) {
    return this.service.atualizarConfiguracoesPorProfissional(id, dto);
  }
}
