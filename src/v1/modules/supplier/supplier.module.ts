import { Module } from '@nestjs/common';
import { SupplierAnalyticsModule } from './analytics/analytics.module';
import { SupplierMessagesModule } from './messages/messages.module';
import { SupplierProfileModule } from './profile/profile.module';
import { SupplierQuotesModule } from './quotesrequest/quotesrequest.module';
import { SupplierQuoteOffersModule } from './quoteoffers/quote-offers.module';
import { SupplierOrdersModule } from './orders/orders.module';

@Module({
  imports: [
    SupplierAnalyticsModule,
    SupplierMessagesModule,
    SupplierProfileModule,
    SupplierQuotesModule,
    SupplierQuoteOffersModule,
    SupplierOrdersModule,
  ],
  controllers: [],
})
export class SupplierModule {}
