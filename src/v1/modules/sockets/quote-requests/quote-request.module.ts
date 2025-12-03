import { Module } from '@nestjs/common';
import { QuoteRequestGateway } from './quote-request.gateway';
import { QuoteRequestSocketService } from './quote-request-socket.service';
import { SocketRegistryModule } from '../socket-registry.module';

@Module({
  imports: [SocketRegistryModule],
  providers: [QuoteRequestGateway, QuoteRequestSocketService],
  exports: [QuoteRequestSocketService],
})
export class QuoteRequestSocketModule {}
