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

  emitMessage(payload: ChatMessagePayload) {
    if (!this.server) {
      this.logger.warn('Chat server not initialized');
      return;
    }
    this.server.to(this.roomForUser(payload.recipientId)).emit('chat:message', payload);
    console.log('message emitted to recipient:', payload.recipientId);
  }

  private roomForUser(userId: string) {
    return `chat:user:${userId}`;
  }
}
