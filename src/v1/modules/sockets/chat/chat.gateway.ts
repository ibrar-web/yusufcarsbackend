import { UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketAuthGuard } from '../socket-auth.guard';
import { SocketAuthService } from '../socket-auth.service';
import { SocketConnectionRegistry } from '../socket-connection.registry';
import { ChatSocketService } from './chat-socket.service';

@WebSocketGateway({ cors: { origin: '*' } })
@UseGuards(SocketAuthGuard)
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly auth: SocketAuthService,
    private readonly registry: SocketConnectionRegistry,
    private readonly chatService: ChatSocketService,
  ) {}

  afterInit() {
    this.chatService.attachServer(this.server);
  }

  async handleConnection(client: Socket) {
    const user = await this.auth.authenticate(client);
    this.registry.register(client, user);
    this.chatService.registerClientRooms(client, user);
  }

  handleDisconnect(client: Socket) {
    this.registry.unregister(client.id);
  }
}
