import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from '../../supplier/messages/entities/message.entity';
import { Supplier } from '../../../entities/supplier.entity';
import { User } from '../../../entities/user.entity';
import { QuoteRequest } from '../../../entities/quote-request.entity';
import { Chats } from '../../../entities/chats.entity';
import { UserMessagesController } from './user-messages.controller';
import { UserMessagesService } from './user-messages.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Supplier, User, QuoteRequest, Chats])],
  controllers: [UserMessagesController],
  providers: [
    UserMessagesService,
    AuthGuard,
    RolesGuard,
    JoseService,
  ],
})
export class UserMessagesModule {}
