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
import { QuoteOfferSocketService } from './quote-offer-socket.service';

@WebSocketGateway({ namespace: '/quote-offers', cors: { origin: '*' } })
@UseGuards(SocketAuthGuard)
export class QuoteOfferGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly auth: SocketAuthService,
    private readonly registry: SocketConnectionRegistry,
    private readonly offerService: QuoteOfferSocketService,
  ) {}

  afterInit() {
    this.offerService.attachServer(this.server);
  }

  async handleConnection(client: Socket) {
    const user = await this.auth.authenticate(client);
    if (user.role === 'supplier') {
      client.disconnect(true);
      return;
    }
    this.registry.register(client, user);
    this.offerService.registerClientRooms(client, user);
  }

  handleDisconnect(client: Socket) {
    this.registry.unregister(client.id);
  }
}
