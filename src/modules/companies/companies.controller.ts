import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from '@prisma/client';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleGuard } from 'src/shared/auth/guards/role.guard';
import { TenantInterceptor } from 'src/shared/tenant/tenant.interceptor';
import { UniversalController } from 'src/shared/universal';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';

@UseGuards(AuthGuard, RoleGuard)
@UseInterceptors(TenantInterceptor)
@RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN, Roles.PROFESSIONAL)
@Controller('companies')
export class CompaniesController extends UniversalController<
  CreateCompanyDto,
  UpdateCompanyDto,
  CompaniesService
> {
  constructor(service: CompaniesService) {
    super(service);
  }

  // ============================================================================
  // ROTAS ADMIN — antes de :id para evitar conflito de roteamento
  // ============================================================================

  @Get('admin/list')
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  listarParaAdmin(
    @Query('activeOnly') activeOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.service.listarParaAdmin(
      activeOnly !== 'false',
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
      search?.trim() || undefined,
    );
  }

  @Get('admin/detail/:id')
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  obterDetalheParaAdmin(@Param('id') id: string) {
    return this.service.obterDetalheParaAdmin(id);
  }

  @Delete('admin/:id')
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  desativarParaAdmin(@Param('id') id: string) {
    return this.service.desativarParaAdmin(id);
  }

  @Post('admin/:id/restore')
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  reativarParaAdmin(@Param('id') id: string) {
    return this.service.reativarParaAdmin(id);
  }

  // ============================================================================
  // EMPRESA DO USUÁRIO LOGADO
  // ============================================================================

  @Get('me')
  obterMinhaEmpresa() {
    return this.service.obterMinhaEmpresa();
  }

  @Put('me')
  atualizarMinhaEmpresa(@Body() data: UpdateCompanyDto) {
    return this.service.atualizarMinhaEmpresa(data);
  }

  // As rotas CRUD universais (GET /, GET /:id, POST /, PATCH /:id, DELETE /:id) são herdadas
}
