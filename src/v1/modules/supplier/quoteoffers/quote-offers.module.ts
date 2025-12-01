import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quote } from '../../../entities/quote-offers.entity';
import { QuoteRequest } from '../../../entities/quotes/quote-request.entity';
import { Supplier } from '../../../entities/supplier.entity';
import { SupplierQuoteOffersController } from './quote-offers.controller';
import { SupplierQuoteOffersService } from './quote-offers.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [TypeOrmModule.forFeature([Quote, QuoteRequest, Supplier])],
  controllers: [SupplierQuoteOffersController],
  providers: [SupplierQuoteOffersService, AuthGuard, RolesGuard, JoseService],
})
export class SupplierQuoteOffersModule {}
