import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { QuoteRequestSocketService } from './quote-request-socket.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class QuoteRequestGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(QuoteRequestGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly sockets: QuoteRequestSocketService) {}

  afterInit() {
    this.sockets.attachServer(this.server);
  }

  handleConnection(client: Socket) {
    const supplierId = this.extractSupplierId(client);
    if (!supplierId) {
      client.emit('quote:request:error', {
        message: 'Missing supplierId query param',
      });
      client.disconnect(true);
      return;
    }
    this.sockets.registerSupplier(client, supplierId);
  }

  handleDisconnect(client: Socket) {
    this.sockets.unregisterClient(client.id);
  }

  private extractSupplierId(client: Socket) {
    const raw = client.handshake.query.supplierId;
    if (typeof raw === 'string' && raw.trim().length) {
      return raw.trim();
    }
    if (Array.isArray(raw) && raw.length && raw[0]?.trim().length) {
      return raw[0].trim();
    }
    this.logger.warn('Quote request socket missing supplierId');
    return undefined;
  }
}
