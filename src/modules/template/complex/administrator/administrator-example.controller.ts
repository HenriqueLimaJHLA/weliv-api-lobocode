import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '@prisma/client';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleByMethodGuard } from 'src/shared/auth/guards/role-by-method.guard';
import { RoleByMethod } from 'src/shared/auth/role-by-method.decorator';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';
import { UniversalController } from 'src/shared/universal';
import {
  CreateExampleDto,
  ExampleStatus,
  ExampleType,
} from './dto/create-example.dto';
import { UpdateExampleDto } from './dto/update-example.dto';
import { AdministratorExampleService } from './administrator-example.service';

@ApiTags('admin/examples')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({
  GET: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  POST: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  PATCH: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  DELETE: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
})
@Controller('admin/examples')
export class AdministratorExampleController extends UniversalController<
  CreateExampleDto,
  UpdateExampleDto,
  AdministratorExampleService
> {
  constructor(service: AdministratorExampleService) {
    super(service);
  }

  // Ordem: /admin/* → /stats → /:id (herdado)

  @Get('list')
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  @ApiOperation({ summary: 'Lista todos os registros com filtros avançados (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ExampleStatus })
  @ApiQuery({ name: 'type', required: false, enum: ExampleType })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  listarParaAdmin(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: ExampleStatus,
    @Query('type') type?: ExampleType,
    @Query('search') search?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.service.listarParaAdmin({
      page: page != null ? Number(page) : 1,
      limit: limit != null ? Number(limit) : 20,
      status,
      type,
      search,
      companyId,
    });
  }

  @Get('detail/:id')
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  @ApiOperation({ summary: 'Detalhe completo de um registro (admin)' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  obterDetalhesParaAdmin(@Param('id') id: string) {
    return this.service.obterDetalhesParaAdmin(id);
  }

  @Get('stats')
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  @ApiOperation({ summary: 'Resumo de estatísticas da empresa corrente (admin)' })
  obterResumoEstatisticas() {
    return this.service.obterResumoEstatisticas();
  }
}
