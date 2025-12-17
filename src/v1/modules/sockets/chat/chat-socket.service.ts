import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { ChatMessagePayload } from './dto/chat-message.payload';

export type ChatMessageEnvelope = ChatMessagePayload & {
  __recipientId: string;
};

@Injectable()
export class ChatSocketService {
  private readonly logger = new Logger(ChatSocketService.name);
  private server?: Server;

  attachServer(server: Server) {
    this.server = server;
  }

  emitMessage(payload: ChatMessageEnvelope) {
    if (!this.server) {
      this.logger.warn('Chat server not initialized');
      return;
    }
    const recipientId = payload.__recipientId;
    if (typeof recipientId !== 'string' || recipientId.length === 0) {
      this.logger.warn('Socket payload missing recipientId');
      return;
    }
    this.server
      .to(ChatSocketService.roomForUser(recipientId))
      .emit('chat:message', payload);
  }

  static roomForUser(userId: string) {
    return `chat:user:${userId}`;
  }
}
