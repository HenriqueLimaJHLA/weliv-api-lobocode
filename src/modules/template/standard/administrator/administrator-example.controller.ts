import {
  Controller,
  Get,
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
import { CreateExampleDto, ExampleStatus } from './dto/create-example.dto';
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

  @Get('by-code')
  @ApiOperation({ summary: 'Busca registro pelo código único (admin)' })
  @ApiQuery({ name: 'code', required: true, description: 'Código do exemplo' })
  buscarPorCodigo(@Query('code') code: string) {
    if (!code?.trim()) {
      throw new BadRequestException('O parâmetro code é obrigatório');
    }
    return this.service.buscarPorCodigo(code);
  }

  @Get('by-status')
  @ApiOperation({ summary: 'Busca registros por status (admin)' })
  @ApiQuery({ name: 'status', required: true, enum: ExampleStatus })
  buscarPorStatus(@Query('status') status: ExampleStatus) {
    if (!Object.values(ExampleStatus).includes(status)) {
      throw new BadRequestException(
        `Status inválido. Use: ${Object.values(ExampleStatus).join(', ')}`,
      );
    }
    return this.service.buscarPorStatus(status);
  }

  @Get('stats')
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  @ApiOperation({ summary: 'Resumo de estatísticas da empresa corrente (admin)' })
  obterResumoEstatisticas() {
    return this.service.obterResumoEstatisticas();
  }
}
