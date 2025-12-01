import { Module } from '@nestjs/common';
import { QuoteRequestGateway } from './quote-request.gateway';
import { QuoteRequestSocketService } from './quote-request-socket.service';

@Module({
  providers: [QuoteRequestGateway, QuoteRequestSocketService],
  exports: [QuoteRequestSocketService],
})
export class QuoteRequestSocketModule {}
