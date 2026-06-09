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
import { UniversalController } from 'src/shared/universal';
import { CreateExampleDto, ExampleStatus } from './dto/create-example.dto';
import { UpdateExampleDto } from './dto/update-example.dto';
import { UserExampleService } from './user-example.service';

@ApiTags('user/examples')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({
  GET: [Roles.USER, Roles.ADMIN, Roles.SYSTEM_ADMIN],
  POST: [Roles.ADMIN, Roles.SYSTEM_ADMIN],
  PATCH: [Roles.ADMIN, Roles.SYSTEM_ADMIN],
  DELETE: [Roles.ADMIN, Roles.SYSTEM_ADMIN],
})
@Controller('user/examples')
export class UserExampleController extends UniversalController<
  CreateExampleDto,
  UpdateExampleDto,
  UserExampleService
> {
  constructor(service: UserExampleService) {
    super(service);
  }

  // Rotas literais DEVEM vir ANTES das rotas com :id herdadas do UniversalController.

  @Get('by-code')
  @ApiOperation({ summary: 'Busca registro pelo código único (leitura)' })
  @ApiQuery({ name: 'code', required: true, description: 'Código do exemplo' })
  buscarPorCodigo(@Query('code') code: string) {
    if (!code?.trim()) {
      throw new BadRequestException('O parâmetro code é obrigatório');
    }
    return this.service.buscarPorCodigo(code);
  }

  @Get('by-status')
  @ApiOperation({ summary: 'Busca registros por status (leitura)' })
  @ApiQuery({ name: 'status', required: true, enum: ExampleStatus })
  buscarPorStatus(@Query('status') status: ExampleStatus) {
    if (!Object.values(ExampleStatus).includes(status)) {
      throw new BadRequestException(
        `Status inválido. Use: ${Object.values(ExampleStatus).join(', ')}`,
      );
    }
    return this.service.buscarPorStatus(status);
  }
}
