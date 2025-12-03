import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatSocketService } from './chat/chat-socket.service';
import { QuoteOfferSocketService } from './quote-offers/quote-offer-socket.service';
import { QuoteRequestSocketService } from './quote-requests/quote-request-socket.service';
import { SocketClientRegistry } from './socket-client-registry.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class SocketsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(SocketsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly registry: SocketClientRegistry,
    private readonly chatSockets: ChatSocketService,
    private readonly quoteRequestSockets: QuoteRequestSocketService,
    private readonly quoteOfferSockets: QuoteOfferSocketService,
  ) {}

  afterInit() {
    this.chatSockets.attachServer(this.server);
    this.quoteRequestSockets.attachServer(this.server);
    this.quoteOfferSockets.attachServer(this.server);
  }

  handleConnection(client: Socket) {
    const result = this.registry.handleConnection(client);
    if (!result.success) {
      client.emit('socket:error', {
        message: 'Missing userId or supplierId query param',
      });
      client.disconnect(true);
      return;
    }
    this.logger.debug(`Socket client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.registry.handleDisconnect(client.id);
    this.logger.debug(`Socket client disconnected: ${client.id}`);
  }
}
