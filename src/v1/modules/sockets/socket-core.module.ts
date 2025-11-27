import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from '../../entities/supplier.entity';
import { JoseService } from '../auth/jose.service';
import { SocketAuthGuard } from './socket-auth.guard';
import { SocketAuthService } from './socket-auth.service';
import { SocketConnectionRegistry } from './socket-connection.registry';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier])],
  providers: [
    SocketAuthService,
    SocketAuthGuard,
    SocketConnectionRegistry,
    JoseService,
  ],
  exports: [SocketAuthService, SocketAuthGuard, SocketConnectionRegistry],
})
export class SocketCoreModule {}
