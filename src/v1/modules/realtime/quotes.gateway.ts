import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class QuotesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: any) {
    // In production, authenticate via cookie or query token.
    // client.handshake.headers.cookie
  }

  handleDisconnect(client: any) {
    // cleanup
  }

  emitNewRequest(quoteRequest: any) {
    this.server.emit('quotes:new-request', quoteRequest);
  }

  emitNewResponse(quote: any) {
    this.server.emit('quotes:new-response', quote);
  }

  emitQuoteExpired(quote: any) {
    this.server.emit('quotes:expired', quote);
  }
}


