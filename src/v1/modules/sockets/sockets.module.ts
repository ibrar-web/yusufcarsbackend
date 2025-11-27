import { Global, Module } from '@nestjs/common';
import { ChatSocketModule } from './chat/chat.module';

@Global()
@Module({
  imports: [ChatSocketModule],
  exports: [ChatSocketModule],
})
export class SocketsModule {}
