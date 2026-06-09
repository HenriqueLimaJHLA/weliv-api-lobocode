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
import { CreateUserDto, UserStatus, UserRole } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdministratorUserService } from './administrator-user.service';

@ApiTags('admin/users')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({
  GET: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  POST: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  PATCH: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  DELETE: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
})
@Controller('admin/users')
export class AdministratorUserController extends UniversalController<
  CreateUserDto,
  UpdateUserDto,
  AdministratorUserService
> {
  constructor(service: AdministratorUserService) {
    super(service);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTES CUSTOM - Vêm ANTES das rotas com :id do UniversalController
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('by-email')
  @ApiOperation({ summary: 'Busca usuário pelo email' })
  @ApiQuery({ name: 'email', required: true, description: 'Email do usuário' })
  buscarPorEmail(@Query('email') email: string) {
    if (!email?.trim()) {
      throw new BadRequestException('Email é obrigatório');
    }
    return this.service.buscarPorEmail(email);
  }

  @Get('by-role')
  @ApiOperation({ summary: 'Busca usuários por role' })
  @ApiQuery({ name: 'role', required: true, enum: UserRole })
  buscarPorRole(@Query('role') role: UserRole) {
    if (!Object.values(UserRole).includes(role)) {
      throw new BadRequestException(
        `Role inválido. Use: ${Object.values(UserRole).join(', ')}`,
      );
    }
    return this.service.buscarPorRole(role);
  }

  @Get('by-status')
  @ApiOperation({ summary: 'Busca usuários por status' })
  @ApiQuery({ name: 'status', required: true, enum: UserStatus })
  buscarPorStatus(@Query('status') status: UserStatus) {
    if (!Object.values(UserStatus).includes(status)) {
      throw new BadRequestException(
        `Status inválido. Use: ${Object.values(UserStatus).join(', ')}`,
      );
    }
    return this.service.buscarPorStatus(status);
  }

  @Get('stats')
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  @ApiOperation({ summary: 'Resumo de estatísticas' })
  obterResumoEstatisticas() {
    return this.service.obterResumoEstatisticas();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTES DE STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':id/activate')
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  @ApiOperation({ summary: 'Ativar usuário' })
  activate(@Param('id') id: string) {
    return this.service.activate(id);
  }

  @Post(':id/deactivate')
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  @ApiOperation({ summary: 'Desativar usuário' })
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }

  @Post(':id/suspend')
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  @ApiOperation({ summary: 'Suspender usuário' })
  suspend(@Param('id') id: string) {
    return this.service.suspend(id);
  }

  @Post(':id/unlock')
  @RequiredRoles(Roles.SYSTEM_ADMIN, Roles.ADMIN)
  @ApiOperation({ summary: 'Desbloquear usuário' })
  unlock(@Param('id') id: string) {
    return this.service.unlock(id);
  }

  @Post(':id/change-role')
  @RequiredRoles(Roles.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Alterar role do usuário' })
  changeRole(@Param('id') id: string, @Body('role') role: UserRole) {
    if (!role || !Object.values(UserRole).includes(role)) {
      throw new BadRequestException('Role inválido');
    }
    return this.service.changeRole(id, role);
  }
}
