import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatMessagePayload } from './dto/chat-message.payload';

@Injectable()
export class ChatSocketService {
  private readonly logger = new Logger(ChatSocketService.name);
  private server?: Server;
  private readonly connections = new Map<string, string>();

  attachServer(server: Server) {
    this.server = server;
  }

  registerClient(client: Socket, userId: string) {
    this.connections.set(client.id, userId);
    client.join(this.roomForUser(userId));
  }

  unregisterClient(socketId: string) {
    this.connections.delete(socketId);
  }

  emitMessage(payload: ChatMessagePayload & Record<string, any>) {
    if (!this.server) {
      this.logger.warn('Chat server not initialized');
      return;
    }
    const recipientId = (payload as any).__recipientId;
    if (!recipientId) {
      this.logger.warn('Socket payload missing recipientId');
      return;
    }
    const wirePayload = this.sanitizePayload(payload);
    this.server
      .to(this.roomForUser(recipientId))
      .emit('chat:message', wirePayload);
  }

  private roomForUser(userId: string) {
    return `chat:user:${userId}`;
  }

  private sanitizePayload(
    payload: ChatMessagePayload & Record<string, any>,
  ): ChatMessagePayload {
    return {
      id: payload.id,
      content: payload.content,
      isRead: payload.isRead,
      createdAt: this.toIsoString(payload.createdAt),
      deletedAt: payload.deletedAt ? this.toIsoString(payload.deletedAt) : null,
      sender: {
        id: payload.sender.id,
        email: payload.sender.email,
        fullName: payload.sender.fullName,
        role: payload.sender.role,
        isActive: payload.sender.isActive,
        suspensionReason: payload.sender.suspensionReason ?? null,
        createdAt: this.toIsoString(payload.sender.createdAt),
        postCode: payload.sender.postCode ?? null,
      },
    };
  }

  private toIsoString(value: Date | string | null | undefined) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value ?? null;
  }
}
