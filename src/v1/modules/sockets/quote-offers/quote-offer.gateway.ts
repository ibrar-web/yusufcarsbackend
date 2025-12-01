import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { QuoteOfferSocketService } from './quote-offer-socket.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class QuoteOfferGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(QuoteOfferGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly sockets: QuoteOfferSocketService) {}

  afterInit() {
    this.sockets.attachServer(this.server);
  }

  handleConnection(client: Socket) {
    const userId = this.extractUserId(client);
    if (!userId) {
      client.emit('quote:offer:error', { message: 'Missing userId query param' });
      client.disconnect(true);
      return;
    }
    this.sockets.registerClient(client, userId);
  }

  handleDisconnect(client: Socket) {
    this.sockets.unregisterClient(client.id);
  }

  private extractUserId(client: Socket) {
    const raw = client.handshake.query.userId;
    if (typeof raw === 'string' && raw.trim().length) {
      return raw.trim();
    }
    if (Array.isArray(raw) && raw.length && raw[0]?.trim().length) {
      return raw[0].trim();
    }
    this.logger.warn('Quote offer socket missing userId');
    return undefined;
  }
}
