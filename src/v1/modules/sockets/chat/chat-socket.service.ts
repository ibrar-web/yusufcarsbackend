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

    this.server.to(this.roomForUser(recipientId)).emit('chat:message', payload);
  }

  private roomForUser(userId: string) {
    return `chat:user:${userId}`;
  }

  private toIsoString(value: Date | string) {
    return value instanceof Date ? value.toISOString() : value;
  }
}
