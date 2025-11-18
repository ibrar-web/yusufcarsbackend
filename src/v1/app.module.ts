import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './config/ormconfig';
import { UsersController } from './modules/users/users.controller';
import { UsersService } from './modules/users/users.service';
import { User } from './modules/users/user.entity';
import { Supplier } from './modules/suppliers/supplier.entity';
import { SuppliersService } from './modules/suppliers/suppliers.service';
import { SuppliersController } from './modules/suppliers/suppliers.controller';
import { QuoteRequest } from './modules/quotes/quote-request.entity';
import { Quote } from './modules/quotes/quote.entity';
import { QuotesService } from './modules/quotes/quotes.service';
import { QuotesController } from './modules/quotes/quotes.controller';
import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';
import { JoseService } from './modules/auth/jose.service';
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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      autoLoadEntities: true,
    }),
    TypeOrmModule.forFeature([User, Supplier, QuoteRequest, Quote]),
    AdminModule,
    SupplierQuotesModule,
    SupplierAnalyticsModule,
    SupplierMessagesModule,
    SupplierProfileModule,
    UserMessagesModule,
    UserOrdersModule,
    UserSettingsModule,
    UserNotificationsModule,
  ],
  controllers: [
    UsersController,
    SuppliersController,
    QuotesController,
    AuthController,
  ],
  providers: [
    UsersService,
    SuppliersService,
    QuotesService,
    AuthService,
    JoseService,
    QuotesGateway,
    S3Service,
    KycDocsService,
  ],
})
export class AppModule {}
