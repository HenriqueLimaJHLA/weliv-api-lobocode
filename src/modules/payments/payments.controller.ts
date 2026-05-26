import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Roles, PaymentStatus } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleGuard } from 'src/shared/auth/guards/role.guard';
import { TenantInterceptor } from 'src/shared/tenant/tenant.interceptor';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';

@UseGuards(AuthGuard, RoleGuard)
@UseInterceptors(TenantInterceptor)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Get()
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  listarPagamentos(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: PaymentStatus,
  ) {
    return this.service.listarPagamentos(Number(page), Number(limit), status);
  }

  @Get('me')
  @RequiredRoles(Roles.PATIENT, Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  listarMeusPagamentos(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.service.listarMeusPagamentos(Number(page), Number(limit));
  }

  @Post()
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN, Roles.PROFESSIONAL)
  criar(@Body() dto: CreatePaymentDto) {
    return this.service.criar(dto);
  }

  @Patch(':id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  atualizar(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.service.atualizar(id, dto);
  }

  @Post(':id/confirmar')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN, Roles.PROFESSIONAL)
  confirmarPagamento(@Param('id') id: string) {
    return this.service.confirmarPagamento(id);
  }

  @Post(':id/cancelar')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  cancelar(@Param('id') id: string) {
    return this.service.cancelar(id);
  }

  @Delete(':id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  desativar(@Param('id') id: string) {
    return this.service.desativar(id);
  }

  @Get(':id')
  @RequiredRoles(Roles.PATIENT, Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  buscarPorId(@Param('id') id: string) {
    return this.service.buscarPorId(id);
  }
}
