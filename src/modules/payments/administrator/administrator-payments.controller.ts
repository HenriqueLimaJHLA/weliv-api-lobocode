import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '@prisma/client';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleByMethodGuard } from 'src/shared/auth/guards/role-by-method.guard';
import { RoleByMethod } from 'src/shared/auth/role-by-method.decorator';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';
import { UniversalController } from 'src/shared/universal';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { AdministratorPaymentsService } from './administrator-payments.service';

@ApiTags('admin/payments')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({ GET: [Roles.SYSTEM_ADMIN, Roles.ADMIN], POST: [Roles.SYSTEM_ADMIN, Roles.ADMIN], PATCH: [Roles.SYSTEM_ADMIN, Roles.ADMIN] })
@Controller('admin/payments')
export class AdministratorPaymentsController extends UniversalController<CreatePaymentDto, UpdatePaymentDto, AdministratorPaymentsService> {
  constructor(service: AdministratorPaymentsService) { super(service); }

  @Get()
  @ApiOperation({ summary: 'Lista pagamentos' })
  listar(@Query() query: any) {
    return this.service.listarPagamentos(query.page ? Number(query.page) : 1, query.limit ? Number(query.limit) : 20, query.patientId, query.status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca pagamento por ID' })
  buscarPorId(@Param('id') id: string) { return this.service.buscarPagamentoPorId(id); }

  @Post()
  @ApiOperation({ summary: 'Cria pagamento' })
  criarPagamento(@Body() dto: CreatePaymentDto) { return this.service.criarPagamento(dto); }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza pagamento' })
  atualizarPagamento(@Param('id') id: string, @Body() dto: UpdatePaymentDto) { return this.service.atualizarPagamento(id, dto); }

  @Post(':id/confirm')
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  confirmar(@Param('id') id: string) { return this.service.confirmarPagamento(id); }

  @Post(':id/cancel')
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  cancelar(@Param('id') id: string) { return this.service.cancelarPagamento(id); }
}