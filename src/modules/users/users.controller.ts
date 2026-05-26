import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from '@prisma/client';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { InviteCompanyUserDto } from './dto/invite-company-user.dto';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleGuard } from 'src/shared/auth/guards/role.guard';
import { TenantInterceptor } from 'src/shared/tenant/tenant.interceptor';
import { CaslInterceptor } from 'src/shared/casl/interceptors/casl.interceptor';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';

@UseGuards(AuthGuard, RoleGuard)
@UseInterceptors(TenantInterceptor, CaslInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // ============================================================================
  // LISTAGENS ADMIN
  // ============================================================================

  @Get()
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  buscarTodos(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('orderBy') orderBy = 'name',
    @Query('orderDirection') orderDirection: 'asc' | 'desc' = 'asc',
  ) {
    return this.service.buscarTodos(Number(page), Number(limit), orderBy, orderDirection);
  }

  @Get('pacientes')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  buscarPacientes(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.service.buscarPacientes(Number(page), Number(limit), search);
  }

  @Get('profissionais')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN, Roles.PROFESSIONAL)
  buscarProfissionais(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.service.buscarProfissionais(Number(page), Number(limit), search);
  }

  // ============================================================================
  // PERFIL DO USUÁRIO LOGADO — antes das rotas com :id
  // ============================================================================

  @Get('me')
  obterMeuPerfil(@Request() req: any) {
    return this.service.obterMeuPerfil(req);
  }

  @Patch('me')
  atualizarMeuPerfil(@Request() req: any, @Body() dto: UpdateUserDto) {
    return this.service.atualizarMeuPerfil(req, dto);
  }

  // ============================================================================
  // GESTÃO DE USUÁRIOS DA EMPRESA (painel PRO/ADMIN)
  // ============================================================================

  @Get('company/me')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  listarUsuariosDaMinhaEmpresa(@Request() req: any) {
    return this.service.listarUsuariosDaMinhaEmpresa(req);
  }

  @Post('company/me')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  criarUsuarioDaMinhaEmpresa(@Request() req: any, @Body() dto: any) {
    return this.service.criarUsuarioDaMinhaEmpresa(req, dto);
  }

  @Patch('company/me/:id')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  atualizarUsuarioDaMinhaEmpresa(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.service.atualizarUsuarioDaMinhaEmpresa(req, id, dto);
  }

  @Delete('company/me/:id')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  desativarUsuarioDaMinhaEmpresa(@Request() req: any, @Param('id') id: string) {
    return this.service.desativarUsuarioDaMinhaEmpresa(req, id);
  }

  @Post('company/me/:id/reativar')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  reativarUsuarioDaMinhaEmpresa(@Request() req: any, @Param('id') id: string) {
    return this.service.reativarUsuarioDaMinhaEmpresa(req, id);
  }

  @Post('company/me/invite')
  @RequiredRoles(Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  convidarProfissionalParaMinhaEmpresa(@Request() req: any, @Body() dto: InviteCompanyUserDto) {
    return this.service.convidarProfissionalParaMinhaEmpresa(req, dto.email);
  }

  // ============================================================================
  // CRIAÇÃO POR TIPO
  // ============================================================================

  @Post('admin')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  criarNovoAdmin(@Body() dto: CreateAdminDto) {
    return this.service.criarNovoAdmin(dto);
  }

  @Post('paciente')
  criarNovoPaciente(@Body() dto: any) {
    return this.service.criarNovoPaciente(dto);
  }

  // ============================================================================
  // BUSCAS POR CRITÉRIOS (admin)
  // ============================================================================

  @Get('email/:email')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  buscarPorEmail(@Param('email') email: string) {
    return this.service.buscarPorEmail(email);
  }

  @Get('company/:companyId')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  buscarPorCompany(@Param('companyId') companyId: string) {
    return this.service.buscarPorCompany(companyId);
  }

  @Get('role/:role')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  buscarPorRole(@Param('role') role: Roles) {
    return this.service.buscarPorRole(role);
  }

  // ============================================================================
  // CRUD ADMIN — depois de todas as rotas específicas
  // ============================================================================

  @Get(':id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  buscarPorId(@Param('id') id: string) {
    return this.service.buscarPorId(id);
  }

  @Patch(':id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  atualizar(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  desativar(@Param('id') id: string) {
    return this.service.desativar(id);
  }

  @Post(':id/reativar')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  reativar(@Param('id') id: string) {
    return this.service.reativar(id);
  }
}
