import { Global, Module } from '@nestjs/common';
import { SocketClientRegistry } from './socket-client-registry.service';

@Global()
@Module({
  providers: [SocketClientRegistry],
  exports: [SocketClientRegistry],
})
export class SocketRegistryModule {}
