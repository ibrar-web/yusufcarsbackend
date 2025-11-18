import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { QuoteRequest } from '../quotes/quote-request.entity';
import { Quote } from '../quotes/quote.entity';
import { JoseService } from '../auth/jose.service';
import { JwtCookieStrategy } from './strategies/jwt-cookie.strategy';
import { JwtCookieGuard } from './guards/jwt-cookie.guard';
import { RolesGuard } from './guards/roles.guard';
import { AdminUsersModule } from './users/users.module';
import { AdminSuppliersModule } from './suppliers/suppliers.module';
import { AdminEnquiriesModule } from './enquiries/enquiries.module';
import { AdminReportsModule } from './reports/reports.module';
import { AdminStatsModule } from './stats/stats.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Supplier, QuoteRequest, Quote]),
    AdminUsersModule,
    AdminSuppliersModule,
    AdminEnquiriesModule,
    AdminReportsModule,
    AdminStatsModule,
  ],
  providers: [JoseService, JwtCookieStrategy, JwtCookieGuard, RolesGuard],
  exports: [JwtCookieGuard, RolesGuard],
})
export class AdminModule {}
