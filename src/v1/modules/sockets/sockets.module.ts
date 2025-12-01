import { Global, Module } from '@nestjs/common';
import { ChatSocketModule } from './chat/chat.module';
import { QuoteRequestSocketModule } from './quote-requests/quote-request.module';
import { QuoteOfferSocketModule } from './quote-offers/quote-offer.module';

@Global()
@Module({
  imports: [ChatSocketModule, QuoteRequestSocketModule, QuoteOfferSocketModule],
  exports: [ChatSocketModule, QuoteRequestSocketModule, QuoteOfferSocketModule],
})
export class SocketsModule {}
