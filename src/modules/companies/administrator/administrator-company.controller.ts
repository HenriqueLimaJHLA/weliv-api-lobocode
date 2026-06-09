import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '@prisma/client';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleByMethodGuard } from 'src/shared/auth/guards/role-by-method.guard';
import { RoleByMethod } from 'src/shared/auth/role-by-method.decorator';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';
import { UniversalController } from 'src/shared/universal';
import { CreateCompanyDto, CompanyStatus } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { AdministratorCompanyService } from './administrator-company.service';

@ApiTags('admin/companies')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({
  GET: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  POST: [Roles.SYSTEM_ADMIN],
  PATCH: [Roles.SYSTEM_ADMIN],
  DELETE: [Roles.SYSTEM_ADMIN],
})
@Controller('admin/companies')
export class AdministratorCompanyController extends UniversalController<
  CreateCompanyDto,
  UpdateCompanyDto,
  AdministratorCompanyService
> {
  constructor(service: AdministratorCompanyService) {
    super(service);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTES CUSTOM - Vêm ANTES das rotas com :id do UniversalController
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('by-cnpj')
  @ApiOperation({ summary: 'Busca empresa pelo CNPJ' })
  @ApiQuery({ name: 'cnpj', required: true, description: 'CNPJ da empresa' })
  buscarPorCNPJ(@Query('cnpj') cnpj: string) {
    if (!cnpj?.trim()) {
      throw new BadRequestException('CNPJ é obrigatório');
    }
    return this.service.buscarPorCNPJ(cnpj);
  }

  @Get('by-name')
  @ApiOperation({ summary: 'Busca empresa pelo nome (contém)' })
  @ApiQuery({ name: 'name', required: true, description: 'Nome da empresa' })
  buscarPorNome(@Query('name') name: string) {
    if (!name?.trim()) {
      throw new BadRequestException('Nome é obrigatório');
    }
    return this.service.buscarPorNome(name);
  }

  @Get('by-status')
  @ApiOperation({ summary: 'Busca empresas por status' })
  @ApiQuery({ name: 'status', required: true, enum: CompanyStatus })
  buscarPorStatus(@Query('status') status: CompanyStatus) {
    if (!Object.values(CompanyStatus).includes(status)) {
      throw new BadRequestException(
        `Status inválido. Use: ${Object.values(CompanyStatus).join(', ')}`,
      );
    }
    return this.service.buscarPorStatus(status);
  }

  @Get('stats')
  @RequiredRoles(Roles.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Resumo de estatísticas' })
  obterResumoEstatisticas() {
    return this.service.obterResumoEstatisticas();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTES DE STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':id/approve')
  @RequiredRoles(Roles.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Aprovar empresa (PENDING → APPROVED)' })
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  @Post(':id/reject')
  @RequiredRoles(Roles.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Rejeitar empresa (PENDING → CANCELLED)' })
  reject(@Param('id') id: string) {
    return this.service.reject(id);
  }

  @Post(':id/activate')
  @RequiredRoles(Roles.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Ativar empresa (APPROVED/TRIAL → ACTIVE)' })
  activate(@Param('id') id: string) {
    return this.service.activate(id);
  }

  @Post(':id/suspend')
  @RequiredRoles(Roles.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Suspender empresa (ACTIVE → SUSPENDED)' })
  suspend(@Param('id') id: string) {
    return this.service.suspend(id);
  }

  @Post(':id/block')
  @RequiredRoles(Roles.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Bloquear empresa (ACTIVE → BLOCKED)' })
  block(@Param('id') id: string) {
    return this.service.block(id);
  }

  @Post(':id/cancel')
  @RequiredRoles(Roles.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Cancelar empresa (qualquer status → CANCELLED)' })
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }

  @Post(':id/start-trial')
  @RequiredRoles(Roles.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Iniciar trial (APPROVED → TRIAL)' })
  startTrial(@Param('id') id: string) {
    return this.service.startTrial(id);
  }
}
