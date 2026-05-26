import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Roles, ChargeStatus } from '@prisma/client';
import { ChargesService } from './charges.service';
import { CreateChargeDto } from './dto/create-charge.dto';
import { UpdateChargeDto } from './dto/update-charge.dto';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleGuard } from 'src/shared/auth/guards/role.guard';
import { TenantInterceptor } from 'src/shared/tenant/tenant.interceptor';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';

@UseGuards(AuthGuard, RoleGuard)
@UseInterceptors(TenantInterceptor)
@Controller('charges')
export class ChargesController {
  constructor(private readonly service: ChargesService) {}

  @Get()
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  listarCobrancas(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: ChargeStatus,
  ) {
    return this.service.listarCobrancas(Number(page), Number(limit), status);
  }

  @Get('patient/:patientId')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  listarCobrancasPorPaciente(
    @Param('patientId') patientId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.service.listarCobrancasPorPaciente(patientId, Number(page), Number(limit));
  }

  @Post()
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  criar(@Body() dto: CreateChargeDto) {
    return this.service.criar(dto);
  }

  @Patch(':id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  atualizar(@Param('id') id: string, @Body() dto: UpdateChargeDto) {
    return this.service.atualizar(id, dto);
  }

  @Post(':id/pagar')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  marcarComoPago(@Param('id') id: string) {
    return this.service.marcarComoPago(id);
  }

  @Delete(':id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  desativar(@Param('id') id: string) {
    return this.service.desativar(id);
  }

  @Get(':id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  buscarPorId(@Param('id') id: string) {
    return this.service.buscarPorId(id);
  }
}
