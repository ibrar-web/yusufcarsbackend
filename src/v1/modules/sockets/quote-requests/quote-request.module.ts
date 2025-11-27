import { Module } from '@nestjs/common';
import { SocketCoreModule } from '../socket-core.module';
import { QuoteRequestGateway } from './quote-request.gateway';
import { QuoteRequestSocketService } from './quote-request-socket.service';

@Module({
  imports: [SocketCoreModule],
  providers: [QuoteRequestGateway, QuoteRequestSocketService],
  exports: [QuoteRequestSocketService],
})
export class QuoteRequestSocketModule {}
