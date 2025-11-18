import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../users/user.entity';
import { Supplier } from '../../suppliers/supplier.entity';
import { QuoteRequest } from '../../quotes/quote-request.entity';
import { Quote } from '../../quotes/quote.entity';
import { AdminStatsController } from './stats.controller';
import { AdminStatsService } from './stats.service';
import { JwtCookieGuard } from '../guards/jwt-cookie.guard';
import { RolesGuard } from '../guards/roles.guard';
import { JwtCookieStrategy } from '../strategies/jwt-cookie.strategy';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Supplier, QuoteRequest, Quote])],
  controllers: [AdminStatsController],
  providers: [AdminStatsService, JwtCookieGuard, RolesGuard, JwtCookieStrategy, JoseService],
})
export class AdminStatsModule {}
