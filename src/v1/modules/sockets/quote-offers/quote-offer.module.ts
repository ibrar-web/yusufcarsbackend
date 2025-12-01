import { Module } from '@nestjs/common';
import { QuoteOfferGateway } from './quote-offer.gateway';
import { QuoteOfferSocketService } from './quote-offer-socket.service';

@Module({
  providers: [QuoteOfferGateway, QuoteOfferSocketService],
  exports: [QuoteOfferSocketService],
})
export class QuoteOfferSocketModule {}
