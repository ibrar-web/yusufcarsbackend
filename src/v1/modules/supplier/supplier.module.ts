import { Module } from '@nestjs/common';
import { SupplierAnalyticsModule } from './analytics/analytics.module';
import { SupplierMessagesModule } from './messages/messages.module';
import { SupplierProfileModule } from './profile/profile.module';
import { SupplierQuotesModule } from './quotesrequest/quotesrequest.module';
import { SupplierQuoteOffersModule } from './quoteoffers/quote-offers.module';

@Module({
  imports: [
    SupplierAnalyticsModule,
    SupplierMessagesModule,
    SupplierProfileModule,
    SupplierQuotesModule,
    SupplierQuoteOffersModule,
  ],
})
export class SupplierModule {}
