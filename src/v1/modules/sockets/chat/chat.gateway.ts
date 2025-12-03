import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatSocketService } from './chat-socket.service';
import { SocketClientRegistry } from '../socket-client-registry.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly chatService: ChatSocketService,
    private readonly registry: SocketClientRegistry,
  ) {}

  afterInit() {
    this.chatService.attachServer(this.server);
  }

  handleConnection(client: Socket) {
    const userId = this.extractUserId(client);
    if (!userId) {
      client.emit('chat:error', { message: 'Missing userId query param' });
      client.disconnect(true);
      return;
    }
    this.registry.register(client, userId, ChatSocketService.roomForUser(userId));
  }

  handleDisconnect(client: Socket) {
    this.registry.unregister(client.id);
  }

  private extractUserId(client: Socket) {
    const raw = client.handshake.query.userId;
    if (typeof raw === 'string' && raw.trim().length) {
      return raw.trim();
    }
    if (Array.isArray(raw) && raw.length && raw[0]?.trim().length) {
      return raw[0].trim();
    }
    this.logger.warn('Socket connection rejected due to missing userId');
    return undefined;
  }
}
