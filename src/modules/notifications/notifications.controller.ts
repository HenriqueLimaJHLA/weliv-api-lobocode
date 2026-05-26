import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Roles } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CreateNotificationGroupDto } from './dto/create-notification-group.dto';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleGuard } from 'src/shared/auth/guards/role.guard';
import { TenantInterceptor } from 'src/shared/tenant/tenant.interceptor';
import { RequiredRoles } from 'src/shared/auth/required-roles.decorator';

@UseGuards(AuthGuard, RoleGuard)
@UseInterceptors(TenantInterceptor)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  // Inbox do usuário
  @Get('me')
  @RequiredRoles(Roles.PATIENT, Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  listarMinhasNotificacoes(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('unread') unread?: string,
  ) {
    return this.service.listarMinhasNotificacoes(Number(page), Number(limit), unread === 'true');
  }

  @Post('me/:notificationId/ler')
  @RequiredRoles(Roles.PATIENT, Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  marcarComoLida(@Param('notificationId') notificationId: string) {
    return this.service.marcarComoLida(notificationId);
  }

  @Post('me/ler-todas')
  @RequiredRoles(Roles.PATIENT, Roles.PROFESSIONAL, Roles.ADMIN, Roles.SYSTEM_ADMIN)
  marcarTodasComoLidas() {
    return this.service.marcarTodasComoLidas();
  }

  // Gestão (admin)
  @Get()
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  listarNotificacoes(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.service.listarNotificacoes(Number(page), Number(limit));
  }

  @Post('enviar')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  enviar(@Body() dto: CreateNotificationDto) {
    return this.service.enviar(dto);
  }

  @Delete(':id')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  desativar(@Param('id') id: string) {
    return this.service.desativar(id);
  }

  // Grupos
  @Get('groups')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  listarGrupos(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.service.listarGrupos(Number(page), Number(limit));
  }

  @Post('groups')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  criarGrupo(@Body() dto: CreateNotificationGroupDto) {
    return this.service.criarGrupo(dto);
  }

  @Post('groups/:groupId/members/:userId')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  adicionarMembro(@Param('groupId') groupId: string, @Param('userId') userId: string) {
    return this.service.adicionarMembroAoGrupo(groupId, userId);
  }

  @Delete('groups/:groupId/members/:userId')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  removerMembro(@Param('groupId') groupId: string, @Param('userId') userId: string) {
    return this.service.removerMembroDoGrupo(groupId, userId);
  }

  @Delete('groups/:groupId')
  @RequiredRoles(Roles.ADMIN, Roles.SYSTEM_ADMIN)
  desativarGrupo(@Param('groupId') groupId: string) {
    return this.service.desativarGrupo(groupId);
  }
}
