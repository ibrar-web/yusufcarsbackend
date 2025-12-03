import { Module } from '@nestjs/common';
import { QuoteOfferGateway } from './quote-offer.gateway';
import { QuoteOfferSocketService } from './quote-offer-socket.service';
import { SocketRegistryModule } from '../socket-registry.module';

@Module({
  imports: [SocketRegistryModule],
  providers: [QuoteOfferGateway, QuoteOfferSocketService],
  exports: [QuoteOfferSocketService],
})
export class QuoteOfferSocketModule {}
