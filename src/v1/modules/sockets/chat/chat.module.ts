import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatSocketService } from './chat-socket.service';
import { SocketRegistryModule } from '../socket-registry.module';

@Module({
  imports: [SocketRegistryModule],
  providers: [ChatGateway, ChatSocketService],
  exports: [ChatSocketService],
})
export class ChatSocketModule {}
