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
import { QuoteRequestSocketService } from './quote-request-socket.service';

@WebSocketGateway({ namespace: '/quote-requests', cors: { origin: '*' } })
@UseGuards(SocketAuthGuard)
export class QuoteRequestGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly auth: SocketAuthService,
    private readonly registry: SocketConnectionRegistry,
    private readonly requestSocketService: QuoteRequestSocketService,
  ) {}

  afterInit() {
    this.requestSocketService.attachServer(this.server);
  }

  async handleConnection(client: Socket) {
    const user = await this.auth.authenticate(client);
    if (user.role !== 'supplier' || !user.supplierId) {
      client.disconnect(true);
      return;
    }
    this.registry.register(client, user);
    this.requestSocketService.registerSupplierRoom(client, user.supplierId);
  }

  handleDisconnect(client: Socket) {
    this.registry.unregister(client.id);
  }
}
