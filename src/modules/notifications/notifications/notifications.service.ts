import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ForbiddenError, NotFoundError, ConflictError } from 'src/shared/common/errors';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  NotificationActionType,
  ChannelStatus,
} from './common/enums/notification.enums';
import {
  CreateNotificationDto,
  SendNotificationToUsersDto,
  SendNotificationToAllDto,
  UpdateNotificationDto,
} from './common/dto/notification.dto';
import { NotificationResult } from './common/interfaces/notification-provider.interface';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE - Notifications
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable({ scope: Scope.REQUEST })
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(REQUEST) private readonly request: any,
  ) {
    this.setEntityConfig();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CONFIGURAÇÃO DE ENTITY
  // ═══════════════════════════════════════════════════════════════════════════════

  private entityConfig = {
    includes: {
      recipients: {
        select: {
          id: true,
          userId: true,
          isRead: true,
          isDelivered: true,
          createdAt: true,
        },
      },
      channels: {
        select: {
          id: true,
          channel: true,
          status: true,
          sentAt: true,
          deliveredAt: true,
          failedAt: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    transform: {
      flatten: {
        company: { field: 'name', target: 'companyName' },
      },
      custom: (data: any) => {
        // Calcular métricas
        if (data.recipients) {
          data.totalRecipients = data.recipients.length;
          data.readCount = data.recipients.filter((r: any) => r.isRead).length;
          data.deliveredCount = data.recipients.filter((r: any) => r.isDelivered).length;
          data.readRate = data.totalRecipients > 0
            ? Math.round((data.readCount / data.totalRecipients) * 100)
            : 0;
        }

        // Status resumido
        if (data.channels?.length > 0) {
          const failed = data.channels.filter((c: any) => c.status === 'FAILED').length;
          const sent = data.channels.filter((c: any) => c.status === 'SENT').length;
          const delivered = data.channels.filter((c: any) => c.status === 'DELIVERED').length;

          data.sentCount = sent;
          data.deliveredCount = delivered;
          data.failedCount = failed;
          data.deliveryRate = data.totalRecipients > 0
            ? Math.round((delivered / data.totalRecipients) * 100)
            : 0;
        }

        // Tempo desde criação
        if (data.createdAt) {
          const created = new Date(data.createdAt);
          const now = new Date();
          data.createdAgo = this.getTimeAgo(created, now);
        }

        // Tipo label
        data.typeLabel = this.getTypeLabel(data.type);

        // Prioridade label
        data.priorityLabel = this.getPriorityLabel(data.priority);

        return data;
      },
      exclude: ['data'],
    },
  };

  private setEntityConfig() {
    // Configuração já definida acima
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CRUD BÁSICO
  // ═══════════════════════════════════════════════════════════════════════════════

  async criar(data: CreateNotificationDto) {
    const user = this.obterUsuarioLogado();
    const companyId = this.obterCompanyId();

    let title = data.title;
    let body = data.body;

    if (data.templateId) {
      const template = await this.prisma.notificationTemplate.findUnique({
        where: { id: data.templateId },
      });

      if (!template) {
        throw new NotFoundError('NotificationTemplate', data.templateId, 'id');
      }

      if (template.title) {
        title = this.aplicarVariaveis(template.title, data.templateVariables || {});
      }
      body = this.aplicarVariaveis(template.body, data.templateVariables || {});
    }

    const notification = await this.prisma.notification.create({
      data: {
        title,
        body,
        type: data.type || NotificationType.GENERAL,
        priority: data.priority || NotificationPriority.NORMAL,
        data: data.data,
        imageUrl: data.imageUrl,
        actionUrl: data.actionUrl,
        actionType: data.actionType,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        companyId: data.companyId || companyId,
        createdByUserId: user?.id,
        templateId: data.templateId,
      },
      include: this.entityConfig.includes as any,
    });

    return this.transformData(notification);
  }

  async buscarPorId(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id, deletedAt: null },
      include: this.entityConfig.includes as any,
    });

    if (!notification) {
      throw new NotFoundError('Notification', id, 'id');
    }

    return { data: this.transformData(notification) };
  }

  async buscarComPaginacao(params: {
    page?: number;
    limit?: number;
    companyId?: string;
    type?: NotificationType;
    priority?: NotificationPriority;
    createdByUserId?: string;
  }) {
    const { page = 1, limit = 20, ...filtros } = params;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...filtros,
    };

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.entityConfig.includes as any,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: this.transformData(data),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async atualizar(id: string, data: UpdateNotificationDto) {
    const notification = await this.prisma.notification.findUnique({
      where: { id, deletedAt: null },
    });

    if (!notification) {
      throw new NotFoundError('Notification', id, 'id');
    }

    if (notification.sentAt) {
      throw new ForbiddenError('Não é possível alterar uma notificação já enviada');
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        ...data,
        data: data.data ? data.data : undefined,
      },
      include: this.entityConfig.includes as any,
    });

    return { data: this.transformData(updated) };
  }

  async desativar(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id, deletedAt: null },
    });

    if (!notification) {
      throw new NotFoundError('Notification', id, 'id');
    }

    await this.prisma.notification.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Notificação removida com sucesso' };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ENVIO
  // ═══════════════════════════════════════════════════════════════════════════════

  async enviar(params: SendNotificationToUsersDto): Promise<NotificationResult[]> {
    const user = this.obterUsuarioLogado();
    const companyId = this.obterCompanyId();

    const notification = await this.criar({
      ...params,
      companyId: params.companyId || companyId,
    });

    // Criar destinatários
    await Promise.all(
      params.userIds.map(userId =>
        this.prisma.notificationRecipient.create({
          data: {
            notificationId: (notification as any).id,
            userId,
          },
        }),
      ),
    );

    // TODO: Delegar para os channels (Push, Email, SMS, WhatsApp, In-App)

    return params.userIds.map(userId => ({
      success: true,
      messageId: userId,
      provider: 'internal',
    }));
  }

  async enviarParaTodos(params: SendNotificationToAllDto): Promise<NotificationResult[]> {
    const user = this.obterUsuarioLogado();

    if (user?.role !== 'SYSTEM_ADMIN') {
      throw new ForbiddenError('Apenas SYSTEM_ADMIN pode enviar para todos');
    }

    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        ...(params.filterCompanyId ? { companyId: params.filterCompanyId } : {}),
      },
      select: { id: true },
    });

    const userIds = users.map(u => u.id);

    return this.enviar({ ...params, userIds });
  }

  async agendar(params: SendNotificationToUsersDto): Promise<string> {
    if (!params.scheduledAt) {
      throw new ConflictError('scheduledAt é obrigatório para agendamento');
    }

    const notification = await this.criar(params);
    return (notification as any).id;
  }

  async cancelar(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id, deletedAt: null },
    });

    if (!notification) {
      throw new NotFoundError('Notification', id, 'id');
    }

    if (notification.sentAt) {
      throw new ForbiddenError('Não é possível cancelar uma notificação já enviada');
    }

    await this.prisma.notification.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Notificação cancelada com sucesso' };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RECIPIENTS
  // ═══════════════════════════════════════════════════════════════════════════════

  async marcarComoLida(recipientId: string) {
    const updated = await this.prisma.notificationRecipient.update({
      where: { id: recipientId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { data: updated };
  }

  async marcarTodasComoLidas(userId: string) {
    await this.prisma.notificationRecipient.updateMany({
      where: {
        userId,
        isRead: false,
        deletedAt: null,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { message: 'Todas as notificações marcadas como lidas' };
  }

  async contarNaoLidas(userId: string) {
    const count = await this.prisma.notificationRecipient.count({
      where: {
        userId,
        isRead: false,
        deletedAt: null,
      },
    });

    return { data: { count } };
  }

  async buscarMinhasNotificacoes(userId: string, params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.notificationRecipient.findMany({
        where: {
          userId,
          deletedAt: null,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          notification: {
            include: this.entityConfig.includes as any,
          },
        },
      }),
      this.prisma.notificationRecipient.count({
        where: { userId, deletedAt: null },
      }),
    ]);

    const transformed = data.map(r => ({
      ...this.transformData(r.notification),
      recipientId: r.id,
      isRead: r.isRead,
      readAt: r.readAt,
      isDelivered: r.isDelivered,
      deliveredAt: r.deliveredAt,
    }));

    return {
      data: transformed,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ESTATÍSTICAS
  // ═══════════════════════════════════════════════════════════════════════════════

  async obterEstatisticas(companyId?: string) {
    const where = {
      deletedAt: null,
      ...(companyId ? { companyId } : {}),
    };

    const [total, sent, byChannel, byType] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { ...where, sentAt: { not: null } } }),
      this.prisma.notificationChannelLog.groupBy({
        by: ['channel'],
        where: { notification: where },
        _count: { id: true },
      }),
      this.prisma.notification.groupBy({
        by: ['type'],
        where,
        _count: { id: true },
      }),
    ]);

    return {
      data: {
        total,
        sent,
        byChannel: byChannel.reduce((acc, c) => {
          acc[c.channel] = c._count.id;
          return acc;
        }, {} as Record<string, number>),
        byType: byType.reduce((acc, t) => {
          acc[t.type] = t._count.id;
          return acc;
        }, {} as Record<string, number>),
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // TRANSFORMAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════════

  private transformData(data: any | any[]): any[] {
    const config = this.entityConfig.transform;
    if (!config) return data;

    const transformedData = (Array.isArray(data) ? data : [data]).map((entity) => {
      if (!entity) return null;
      let transformed = { ...entity };

      // Flatten
      if (config.flatten) {
        Object.entries(config.flatten).forEach(([relation, cfg]) => {
          if (transformed[relation]) {
            const { field, target } = cfg as { field: string; target: string };
            transformed[target] = transformed[relation][field];
            delete transformed[relation];
          }
        });
      }

      // Custom
      if (config.custom) {
        transformed = config.custom(transformed);
      }

      // Exclude
      if (config.exclude) {
        config.exclude.forEach((field) => delete transformed[field]);
      }

      return transformed;
    });

    return Array.isArray(data) ? transformedData : transformedData[0];
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════

  private aplicarVariaveis(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  private obterUsuarioLogado() {
    return this.request?.user || null;
  }

  private obterCompanyId() {
    return this.request?.user?.companyId || null;
  }

  private getTimeAgo(created: Date, now: Date): string {
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d atrás`;
    if (diffHours > 0) return `${diffHours}h atrás`;
    if (diffMins > 0) return `${diffMins}min atrás`;
    return 'agora';
  }

  private getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      GENERAL: 'Geral',
      BOOKING: 'Agendamento',
      PAYMENT: 'Pagamento',
      REMINDER: 'Lembrete',
      PROMOTION: 'Promoção',
      SYSTEM: 'Sistema',
      SECURITY: 'Segurança',
      SUPPORT: 'Suporte',
      MARKETING: 'Marketing',
      SOCIAL: 'Social',
    };
    return labels[type] || type;
  }

  private getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      LOW: 'Baixa',
      NORMAL: 'Normal',
      HIGH: 'Alta',
      URGENT: 'Urgente',
    };
    return labels[priority] || priority;
  }
}
