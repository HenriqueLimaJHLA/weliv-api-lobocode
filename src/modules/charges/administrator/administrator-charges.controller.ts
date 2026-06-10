import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@prisma/client';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleByMethodGuard } from 'src/shared/auth/guards/role-by-method.guard';
import { RoleByMethod } from 'src/shared/auth/role-by-method.decorator';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';
import { UniversalController } from 'src/shared/universal';
import { CreateChargeDto } from './dto/create-charge.dto';
import { UpdateChargeDto } from './dto/update-charge.dto';
import { AdministratorChargesService } from './administrator-charges.service';

@ApiTags('admin/charges')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({ GET: [Roles.SYSTEM_ADMIN, Roles.ADMIN], POST: [Roles.SYSTEM_ADMIN, Roles.ADMIN], PATCH: [Roles.SYSTEM_ADMIN, Roles.ADMIN] })
@Controller('admin/charges')
export class AdministratorChargesController extends UniversalController<CreateChargeDto, UpdateChargeDto, AdministratorChargesService> {
  constructor(service: AdministratorChargesService) { super(service); }

  @Get()
  @ApiOperation({ summary: 'Lista cobranças' })
  listar(@Query() query: any) {
    return this.service.listarCobrancas(query.page ? Number(query.page) : 1, query.limit ? Number(query.limit) : 20, query.patientId, query.status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca cobrança por ID' })
  buscarPorId(@Param('id') id: string) { return this.service.buscarCobrancaPorId(id); }

  @Post()
  @ApiOperation({ summary: 'Cria cobrança' })
  criarCobranca(@Body() dto: CreateChargeDto) { return this.service.criarCobranca(dto); }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza cobrança' })
  atualizarCobranca(@Param('id') id: string, @Body() dto: UpdateChargeDto) { return this.service.atualizarCobranca(id, dto); }

  @Post(':id/pay')
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  marcarPago(@Param('id') id: string) { return this.service.marcarComoPago(id); }
}