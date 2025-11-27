import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { validatePayload } from '../socket-validation';
import { ChatDeliveredPayload } from './dto/chat-delivered.payload';
import { ChatMessagePayload } from './dto/chat-message.payload';
import { SocketUserContext } from '../socket.types';

@Injectable()
export class ChatSocketService {
  private readonly logger = new Logger(ChatSocketService.name);
  private server?: Server;

  attachServer(server: Server) {
    this.server = server;
  }

  registerClientRooms(client: Socket, user: SocketUserContext) {
    client.join(this.roomForUser(user.id));
    if (user.role === 'supplier') {
      client.join(this.roomForSupplier(user.id));
    }
  }

  emitMessage(payload: ChatMessagePayload) {
    if (!this.server) {
      this.logger.warn('Chat server not initialized');
      return;
    }
    const dto = validatePayload(ChatMessagePayload, payload);
    this.server
      .to([
        this.roomForUser(dto.recipientId),
        this.roomForUser(dto.senderId),
        this.roomForSupplier(dto.recipientId),
      ])
      .emit('chat:message', dto);
  }

  emitDelivered(payload: ChatDeliveredPayload) {
    if (!this.server) {
      this.logger.warn('Chat server not initialized');
      return;
    }
    const dto = validatePayload(ChatDeliveredPayload, payload);
    this.server
      .to([this.roomForUser(dto.recipientId), this.roomForSupplier(dto.recipientId)])
      .emit('chat:delivered', dto);
  }

  private roomForUser(userId: string) {
    return `chat:user:${userId}`;
  }

  private roomForSupplier(supplierUserId: string) {
    return `chat:supplier:${supplierUserId}`;
  }
}
