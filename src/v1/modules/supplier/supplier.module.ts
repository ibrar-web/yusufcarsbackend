import { Module } from '@nestjs/common';
import { SupplierAnalyticsModule } from './analytics/analytics.module';
import { SupplierMessagesModule } from './messages/messages.module';
import { SupplierProfileModule } from './profile/profile.module';
import { SupplierQuotesModule } from './quotesrequest/quotesrequest.module';
import { SupplierQuoteOffersModule } from './quoteoffers/quote-offers.module';
import { SupplierOrdersModule } from './orders/orders.module';
import { SupplierStatsModule } from './stats/stats.module';
import { SupplierPromotionsModule } from './promotions/promotions.module';
import { SupplierReportsModule } from './reports/reports.module';

@Module({
  imports: [
    SupplierAnalyticsModule,
    SupplierMessagesModule,
    SupplierProfileModule,
    SupplierQuotesModule,
    SupplierQuoteOffersModule,
    SupplierOrdersModule,
    SupplierStatsModule,
    SupplierPromotionsModule,
    SupplierReportsModule,
  ],
  controllers: [],
})
export class SupplierModule {}
