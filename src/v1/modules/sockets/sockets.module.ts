import { Global, Module } from '@nestjs/common';
import { ChatSocketService } from './chat/chat-socket.service';
import { QuoteRequestSocketService } from './quote-requests/quote-request-socket.service';
import { QuoteOfferSocketService } from './quote-offers/quote-offer-socket.service';
import { SocketClientRegistry } from './socket-client-registry.service';
import { SocketsGateway } from './sockets.gateway';

@Global()
@Module({
  providers: [
    SocketClientRegistry,
    ChatSocketService,
    QuoteRequestSocketService,
    QuoteOfferSocketService,
    SocketsGateway,
  ],
  exports: [
    ChatSocketService,
    QuoteRequestSocketService,
    QuoteOfferSocketService,
  ],
})
export class SocketsModule {}
