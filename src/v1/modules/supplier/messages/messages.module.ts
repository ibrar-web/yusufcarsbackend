import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { Supplier } from '../../suppliers/supplier.entity';
import { User } from '../../users/user.entity';
import { QuoteRequest } from '../../quotes/quote-request.entity';
import { SupplierMessagesController } from './messages.controller';
import { SupplierMessagesService } from './messages.service';
import { QuotesGateway } from '../../realtime/quotes.gateway';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Supplier, User, QuoteRequest])],
  controllers: [SupplierMessagesController],
  providers: [SupplierMessagesService, QuotesGateway, AuthGuard, RolesGuard, JoseService],
})
export class SupplierMessagesModule {}
