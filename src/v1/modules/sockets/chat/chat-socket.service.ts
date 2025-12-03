import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { ChatMessagePayload } from './dto/chat-message.payload';

@Injectable()
export class ChatSocketService {
  private readonly logger = new Logger(ChatSocketService.name);
  private server?: Server;

  attachServer(server: Server) {
    this.server = server;
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
    console.log('recipientId:"', recipientId, payload);
    this.server
      .to(ChatSocketService.roomForUser(recipientId))
      .emit('chat:message', payload);
  }

  static roomForUser(userId: string) {
    return `chat:user:${userId}`;
  }
}
