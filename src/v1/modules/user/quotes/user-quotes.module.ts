import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteRequest } from '../../../entities/quotes/quote-request.entity';
import { QuoteOffer } from '../../../entities/quote-offers.entity';
import { Order } from '../../../entities/quotes/order.entity';
import { SupplierQuoteNotification } from '../../../entities/quotes/supplier-quote-notification.entity';
import { UserQuotesController } from './user-quotes.controller';
import { UserQuotesService } from './user-quotes.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuoteRequest,
      QuoteOffer,
      Order,
      SupplierQuoteNotification,
    ]),
  ],
  controllers: [UserQuotesController],
  providers: [UserQuotesService, AuthGuard, RolesGuard, JoseService],
})
export class UserQuotesModule {}
