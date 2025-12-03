import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../entities/user.entity';
import { Supplier } from '../../../entities/supplier.entity';
import { QuoteRequest } from '../../../entities/quotes/quote-request.entity';
import { QuoteOffer } from '../../../entities/quote-offers.entity';
import { AdminReportsController } from './reports.controller';
import { AdminReportsService } from './reports.service';
import { JwtCookieGuard } from '../guards/jwt-cookie.guard';
import { RolesGuard } from '../guards/roles.guard';
import { JwtCookieStrategy } from '../strategies/jwt-cookie.strategy';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Supplier, QuoteRequest, QuoteOffer]),
  ],
  controllers: [AdminReportsController],
  providers: [
    AdminReportsService,
    JwtCookieGuard,
    RolesGuard,
    JwtCookieStrategy,
    JoseService,
  ],
})
export class AdminReportsModule {}
