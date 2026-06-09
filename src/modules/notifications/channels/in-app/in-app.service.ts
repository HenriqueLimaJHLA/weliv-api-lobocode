import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { InAppPayload, InAppProviderInterface } from '../../common/interfaces/notification-provider.interface';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE - In-App (WebSocket)
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class NotificationsInAppService implements InAppProviderInterface {
  readonly name = 'InApp';
  private server: Server | null = null;

  private readonly logger = new Logger(NotificationsInAppService.name);

  setServer(server: Server) {
    this.server = server;
  }

  async send(payload: InAppPayload): Promise<void> {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }

    const room = `user:${payload.userId}`;
    const notification = {
      title: payload.title,
      body: payload.body,
      data: payload.data,
      imageUrl: payload.imageUrl,
      actionUrl: payload.actionUrl,
      actionType: payload.actionType,
      timestamp: new Date().toISOString(),
    };

    this.server.to(room).emit('notification', notification);
    this.logger.debug(`Notification sent to user ${payload.userId}`);
  }

  async sendMultiple(payloads: InAppPayload[]): Promise<void> {
    await Promise.all(payloads.map(p => this.send(p)));
  }

  async emitToUser(userId: string, event: string, data: any): Promise<void> {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }

    const room = `user:${userId}`;
    this.server.to(room).emit(event, data);
    this.logger.debug(`Event ${event} emitted to user ${userId}`);
  }

  async emitToRoom(room: string, event: string, data: any): Promise<void> {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return;
    }

    this.server.to(room).emit(event, data);
    this.logger.debug(`Event ${event} emitted to room ${room}`);
  }
}
