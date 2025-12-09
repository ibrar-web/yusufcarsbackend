import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Supplier } from '../../entities/supplier.entity';
import { QuoteRequest } from '../../entities/quotes/quote-request.entity';
import { QuoteOffer } from '../../entities/quote-offers.entity';
import { JoseService } from '../auth/jose.service';
import { JwtCookieStrategy } from './strategies/jwt-cookie.strategy';
import { JwtCookieGuard } from './guards/jwt-cookie.guard';
import { RolesGuard } from './guards/roles.guard';
import { AdminUsersModule } from './users/users.module';
import { AdminSuppliersModule } from './suppliers/suppliers.module';
import { AdminEnquiriesModule } from './inquiries/inquiries.module';
import { AdminReportsModule } from './reports/reports.module';
import { AdminStatsModule } from './stats/stats.module';
import { AdminOrdersModule } from './orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Supplier, QuoteRequest, QuoteOffer]),
    AdminUsersModule,
    AdminSuppliersModule,
    AdminEnquiriesModule,
    AdminReportsModule,
    AdminOrdersModule,
    AdminStatsModule,
  ],
  providers: [JoseService, JwtCookieStrategy, JwtCookieGuard, RolesGuard],
  exports: [JwtCookieGuard, RolesGuard],
})
export class AdminModule {}
