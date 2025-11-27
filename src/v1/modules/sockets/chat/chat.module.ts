import { Module } from '@nestjs/common';
import { SocketCoreModule } from '../socket-core.module';
import { ChatGateway } from './chat.gateway';
import { ChatSocketService } from './chat-socket.service';

@Module({
  imports: [SocketCoreModule],
  providers: [ChatGateway, ChatSocketService],
  exports: [ChatSocketService],
})
export class ChatSocketModule {}
