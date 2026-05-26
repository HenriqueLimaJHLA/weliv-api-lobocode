import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Prisma, NotificationTargetType } from '@prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TenantService } from 'src/shared/tenant/tenant.service';
import { NotFoundError, UnauthorizedError, ValidationError } from 'src/shared/common/errors';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CreateNotificationGroupDto } from './dto/create-notification-group.dto';

const NOTIFICATION_SELECT: Prisma.NotificationSelect = {
  id: true,
  title: true,
  message: true,
  category: true,
  actionUrl: true,
  entityType: true,
  entityId: true,
  createdAt: true,
  company: { select: { id: true, name: true } },
};

const GROUP_SELECT: Prisma.NotificationGroupSelect = {
  id: true,
  name: true,
  description: true,
  type: true,
  isActive: true,
  roleFilter: true,
  sectorFilter: true,
  createdAt: true,
};

@Injectable({ scope: Scope.REQUEST })
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
    @Optional() @Inject(REQUEST) private readonly request: any,
  ) {}

  // ============================================================================
  // INBOX DO USUÁRIO
  // ============================================================================

  async listarMinhasNotificacoes(page = 1, limit = 20, apenasNaoLidas = false) {
    const userId = this.extrairUserId();
    const where: Prisma.NotificationRecipientWhereInput = { userId };
    if (apenasNaoLidas) where.isRead = false;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.notificationRecipient.findMany({
        where,
        select: {
          id: true,
          isRead: true,
          readAt: true,
          notification: { select: NOTIFICATION_SELECT },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notificationRecipient.count({ where }),
    ]);

    return { data, pagination: this.paginar(page, limit, total) };
  }

  async marcarComoLida(notificationId: string) {
    const userId = this.extrairUserId();
    const recipient = await this.prisma.notificationRecipient.findUnique({
      where: { notificationId_userId: { notificationId, userId } },
    });
    if (!recipient) throw new NotFoundError('NotificationRecipient', notificationId, 'notificationId');

    const data = await this.prisma.notificationRecipient.update({
      where: { notificationId_userId: { notificationId, userId } },
      data: { isRead: true, readAt: new Date() },
    });

    return { data };
  }

  async marcarTodasComoLidas() {
    const userId = this.extrairUserId();
    await this.prisma.notificationRecipient.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { message: 'Todas as notificações marcadas como lidas' };
  }

  // ============================================================================
  // GESTÃO (ADMIN)
  // ============================================================================

  async listarNotificacoes(page = 1, limit = 20) {
    const companyId = await this.resolverCompanyId();
    const where: Prisma.NotificationWhereInput = { companyId, deletedAt: null };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({ where, select: NOTIFICATION_SELECT, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, pagination: this.paginar(page, limit, total) };
  }

  async enviar(dto: CreateNotificationDto) {
    const companyId = await this.resolverCompanyId();
    const userId = this.extrairUserId();

    const notification = await this.prisma.notification.create({
      data: {
        title: dto.title,
        message: dto.message,
        companyId,
        createdByUserId: userId,
        ...(dto.category && { category: dto.category }),
        ...(dto.actionUrl && { actionUrl: dto.actionUrl }),
        ...(dto.entityType && { entityType: dto.entityType }),
        ...(dto.entityId && { entityId: dto.entityId }),
      },
      select: { id: true },
    });

    // Criar destinatários diretos
    if (dto.recipientIds?.length) {
      await this.prisma.notificationRecipient.createMany({
        data: dto.recipientIds.map((uid) => ({ notificationId: notification.id, userId: uid })),
        skipDuplicates: true,
      });
    }

    // Alvo por papel
    if (dto.targetRole) {
      await this.prisma.notificationTarget.create({
        data: { notificationId: notification.id, type: NotificationTargetType.ROLE, roleId: dto.targetRole },
      });
      await this.dispararParaPapel(notification.id, dto.targetRole, companyId);
    }

    // Alvo por grupo
    if (dto.targetGroupId) {
      await this.prisma.notificationTarget.create({
        data: { notificationId: notification.id, type: NotificationTargetType.GROUP, groupId: dto.targetGroupId },
      });
      await this.dispararParaGrupo(notification.id, dto.targetGroupId);
    }

    const data = await this.prisma.notification.findUnique({ where: { id: notification.id }, select: NOTIFICATION_SELECT });
    return { data };
  }

  async desativar(id: string) {
    const exists = await this.prisma.notification.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundError('Notification', id, 'id');

    await this.prisma.notification.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Notificação removida com sucesso' };
  }

  // ============================================================================
  // GRUPOS
  // ============================================================================

  async listarGrupos(page = 1, limit = 20) {
    const companyId = await this.resolverCompanyId();
    const where: Prisma.NotificationGroupWhereInput = { companyId, deletedAt: null };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.notificationGroup.findMany({ where, select: GROUP_SELECT, orderBy: { name: 'asc' }, skip, take: limit }),
      this.prisma.notificationGroup.count({ where }),
    ]);

    return { data, pagination: this.paginar(page, limit, total) };
  }

  async criarGrupo(dto: CreateNotificationGroupDto) {
    const companyId = await this.resolverCompanyId();
    const userId = this.extrairUserId();

    const data = await this.prisma.notificationGroup.create({
      data: {
        name: dto.name,
        companyId,
        type: dto.type,
        createdBy: userId,
        ...(dto.description && { description: dto.description }),
        ...(dto.roleFilter && { roleFilter: dto.roleFilter }),
        ...(dto.sectorFilter && { sectorFilter: dto.sectorFilter }),
      },
      select: GROUP_SELECT,
    });

    return { data };
  }

  async adicionarMembroAoGrupo(groupId: string, userId: string) {
    const group = await this.prisma.notificationGroup.findUnique({ where: { id: groupId }, select: { id: true } });
    if (!group) throw new NotFoundError('NotificationGroup', groupId, 'id');

    const data = await this.prisma.notificationGroupMember.create({
      data: { groupId, userId, addedBy: this.extrairUserId() },
    });

    return { data };
  }

  async removerMembroDoGrupo(groupId: string, userId: string) {
    await this.prisma.notificationGroupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });
    return { message: 'Membro removido do grupo' };
  }

  async desativarGrupo(groupId: string) {
    const group = await this.prisma.notificationGroup.findUnique({ where: { id: groupId }, select: { id: true } });
    if (!group) throw new NotFoundError('NotificationGroup', groupId, 'id');

    await this.prisma.notificationGroup.update({ where: { id: groupId }, data: { deletedAt: new Date() } });
    return { message: 'Grupo removido com sucesso' };
  }

  // ============================================================================
  // PRIVADOS
  // ============================================================================

  private async dispararParaPapel(notificationId: string, role: string, companyId: string) {
    const users = await this.prisma.user.findMany({
      where: { role: role as any, companyId, deletedAt: null },
      select: { id: true },
    });
    if (!users.length) return;

    await this.prisma.notificationRecipient.createMany({
      data: users.map((u) => ({ notificationId, userId: u.id })),
      skipDuplicates: true,
    });
  }

  private async dispararParaGrupo(notificationId: string, groupId: string) {
    const members = await this.prisma.notificationGroupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });
    if (!members.length) return;

    await this.prisma.notificationRecipient.createMany({
      data: members.map((m) => ({ notificationId, userId: m.userId })),
      skipDuplicates: true,
    });
  }

  private extrairUserId(): string {
    const id = this.request?.user?.id;
    if (!id) throw new UnauthorizedError('Usuário não autenticado');
    return id;
  }

  private async resolverCompanyId(): Promise<string> {
    const companyId = this.tenantService.getCompanyId();
    if (companyId) return companyId;

    const user = this.request?.user;
    if (!user) throw new UnauthorizedError('Usuário não autenticado');

    const userData = await this.prisma.user.findUnique({ where: { id: user.id }, select: { companyId: true } });
    if (!userData?.companyId) throw new ValidationError('Usuário não possui empresa vinculada');
    return userData.companyId;
  }

  private paginar(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
  }
}
