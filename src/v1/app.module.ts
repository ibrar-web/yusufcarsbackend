import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './config/ormconfig';
import { User } from './entities/user.entity';
import { Supplier } from './entities/supplier.entity';
import { QuoteRequest } from './entities/quote-request.entity';
import { Quote } from './entities/quote.entity';
import { QuotesGateway } from './modules/realtime/quotes.gateway';
import { S3Service } from './common/aws/s3.service';
import { KycDocsService } from './common/aws/kyc-docs.service';
import { AdminModule } from './modules/admin/admin.module';
import { SupplierQuotesModule } from './modules/supplier/quotes/quotes.module';
import { SupplierAnalyticsModule } from './modules/supplier/analytics/analytics.module';
import { SupplierMessagesModule } from './modules/supplier/messages/messages.module';
import { SupplierProfileModule } from './modules/supplier/profile/profile.module';
import { UserMessagesModule } from './modules/user/messages/user-messages.module';
import { UserOrdersModule } from './modules/user/orders/user-orders.module';
import { UserSettingsModule } from './modules/user/settings/user-settings.module';
import { UserNotificationsModule } from './modules/user/notifications/user-notifications.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      autoLoadEntities: true,
    }),
    AdminModule,
    SupplierQuotesModule,
    SupplierAnalyticsModule,
    SupplierMessagesModule,
    SupplierProfileModule,
    UserMessagesModule,
    UserOrdersModule,
    UserSettingsModule,
    UserNotificationsModule,
    AuthModule,
  ],
  controllers: [],
  providers: [QuotesGateway, S3Service, KycDocsService],
})
export class AppModule {}
