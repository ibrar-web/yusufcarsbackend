import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from '../../../entities/messages.entity';
import { Supplier } from '../../../entities/supplier.entity';
import { User } from '../../../entities/user.entity';
import { Chats } from '../../../entities/chats.entity';
import { SupplierMessagesController } from './messages.controller';
import { SupplierMessagesService } from './messages.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Supplier, User, Chats])],
  controllers: [SupplierMessagesController],
  providers: [
    SupplierMessagesService,
    AuthGuard,
    RolesGuard,
    JoseService,
  ],
})
export class SupplierMessagesModule {}
