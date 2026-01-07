import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteOffer } from '../../../entities/quote-offers.entity';
import { QuoteRequest } from '../../../entities/quotes/quote-request.entity';
import { Supplier } from '../../../entities/supplier.entity';
import { SupplierQuoteNotification } from '../../../entities/quotes/supplier-quote-notification.entity';
import { SupplierPromotion } from '../../../entities/supplier-promotion.entity';
import { SupplierQuoteOffersController } from './quote-offers.controller';
import { SupplierQuoteOffersService } from './quote-offers.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuoteOffer,
      QuoteRequest,
      Supplier,
      SupplierQuoteNotification,
      SupplierPromotion,
    ]),
  ],
  controllers: [SupplierQuoteOffersController],
  providers: [SupplierQuoteOffersService, AuthGuard, RolesGuard, JoseService],
})
export class SupplierQuoteOffersModule {}
