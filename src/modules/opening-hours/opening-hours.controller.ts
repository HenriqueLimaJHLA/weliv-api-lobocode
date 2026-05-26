import { Controller, Get, Put, Body, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { Roles } from '@prisma/client';
import { OpeningHoursService } from './opening-hours.service';
import { SkipValidationPipe } from './pipes/skip-validation.pipe';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleGuard } from 'src/shared/auth/guards/role.guard';
import { TenantInterceptor } from 'src/shared/tenant/tenant.interceptor';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';
import { ValidationError } from 'src/shared/common/errors';

@UseGuards(AuthGuard, RoleGuard)
@UseInterceptors(TenantInterceptor)
@RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN, Roles.PROFESSIONAL)
@Controller('opening-hours')
export class OpeningHoursController {
  constructor(private readonly service: OpeningHoursService) {}

  @Get()
  obterHorarios() {
    return this.service.obterHorarios();
  }

  @Put()
  @UsePipes(SkipValidationPipe)
  atualizarHorarios(@Body() body: any) {
    if (!body?.availability || typeof body.availability !== 'object' || Array.isArray(body.availability)) {
      throw new ValidationError('Campo availability é obrigatório e deve ser um objeto');
    }
    return this.service.atualizarHorarios({ availability: body.availability });
  }
}
