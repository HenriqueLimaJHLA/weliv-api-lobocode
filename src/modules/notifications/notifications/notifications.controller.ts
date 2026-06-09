import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '@prisma/client';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleByMethodGuard } from 'src/shared/auth/guards/role-by-method.guard';
import { RoleByMethod } from 'src/shared/auth/role-by-method.decorator';
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  SendNotificationToUsersDto,
  SendNotificationToAllDto,
  UpdateNotificationDto,
  NotificationType,
  NotificationPriority,
} from '../common/dto/notification.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER - Notifications
// ═══════════════════════════════════════════════════════════════════════════════

@ApiTags('notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({
  GET: [Roles.SYSTEM_ADMIN, Roles.ADMIN, Roles.USER],
  POST: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  PATCH: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  DELETE: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
})
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD (Admin)
  // ═══════════════════════════════════════════════════════════════════════════

  @Post()
  @ApiOperation({ summary: 'Criar notificação' })
  criar(@Body() data: CreateNotificationDto) {
    return this.service.criar(data);
  }

  @Get()
  @ApiOperation({ summary: 'Listar notificações' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  @ApiQuery({ name: 'priority', required: false, enum: NotificationPriority })
  listar(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: NotificationType,
    @Query('priority') priority?: NotificationPriority,
  ) {
    return this.service.buscarComPaginacao({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      type,
      priority,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar notificação por ID' })
  buscarPorId(@Param('id') id: string) {
    return this.service.buscarPorId(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar notificação' })
  atualizar(@Param('id') id: string, @Body() data: UpdateNotificationDto) {
    return this.service.atualizar(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancelar/remover notificação' })
  remover(@Param('id') id: string) {
    return this.service.desativar(id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENVIO (Admin)
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('send')
  @ApiOperation({ summary: 'Enviar notificação para usuários específicos' })
  enviar(@Body() data: SendNotificationToUsersDto) {
    if (!data.userIds?.length) {
      throw new BadRequestException('userIds é obrigatório');
    }
    return this.service.enviar(data);
  }

  @Post('send-to-all')
  @ApiOperation({ summary: 'Enviar para todos os usuários (SYSTEM_ADMIN)' })
  enviarParaTodos(@Body() data: SendNotificationToAllDto) {
    return this.service.enviarParaTodos(data);
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Agendar notificação' })
  agendar(@Body() data: SendNotificationToUsersDto) {
    if (!data.scheduledAt) {
      throw new BadRequestException('scheduledAt é obrigatório');
    }
    if (!data.userIds?.length) {
      throw new BadRequestException('userIds é obrigatório');
    }
    return this.service.agendar(data);
  }

  @Delete(':id/cancel')
  @ApiOperation({ summary: 'Cancelar notificação agendada' })
  cancelar(@Param('id') id: string) {
    return this.service.cancelar(id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTATÍSTICAS (Admin)
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('stats/summary')
  @ApiOperation({ summary: 'Estatísticas gerais' })
  estatisticas() {
    return this.service.obterEstatisticas();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICAÇÕES DO USUÁRIO LOGADO
  // ═══════════════════════════════════════════════════════════════════════════
  // Nota: Rotas simplificadas sem /me - o backend já identifica o usuário via JWT

  @Get('my/notifications')
  @ApiOperation({ summary: 'Minhas notificações' })
  minhasNotificacoes(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const userId = 'current-user'; // TODO: pegar do contexto JWT
    return this.service.buscarMinhasNotificacoes(userId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('my/unread-count')
  @ApiOperation({ summary: 'Contagem de não lidas' })
  contarNaoLidas() {
    const userId = 'current-user'; // TODO: pegar do contexto JWT
    return this.service.contarNaoLidas(userId);
  }

  @Post('my/mark-all-read')
  @ApiOperation({ summary: 'Marcar todas como lidas' })
  marcarTodasComoLidas() {
    const userId = 'current-user'; // TODO: pegar do contexto JWT
    return this.service.marcarTodasComoLidas(userId);
  }

  @Post('my/:recipientId/read')
  @ApiOperation({ summary: 'Marcar como lida' })
  marcarComoLida(@Param('recipientId') recipientId: string) {
    return this.service.marcarComoLida(recipientId);
  }
}
