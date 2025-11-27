import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatSocketService } from './chat-socket.service';

@Module({
  providers: [ChatGateway, ChatSocketService],
  exports: [ChatSocketService],
})
export class ChatSocketModule {}
