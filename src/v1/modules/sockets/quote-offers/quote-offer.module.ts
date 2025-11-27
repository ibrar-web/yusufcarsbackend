import { Module } from '@nestjs/common';
import { SocketCoreModule } from '../socket-core.module';
import { QuoteOfferGateway } from './quote-offer.gateway';
import { QuoteOfferSocketService } from './quote-offer-socket.service';

@Module({
  imports: [SocketCoreModule],
  providers: [QuoteOfferGateway, QuoteOfferSocketService],
  exports: [QuoteOfferSocketService],
})
export class QuoteOfferSocketModule {}
