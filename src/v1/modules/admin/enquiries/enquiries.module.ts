import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteRequest } from '../../quotes/quote-request.entity';
import { AdminEnquiriesController } from './enquiries.controller';
import { AdminEnquiriesService } from './enquiries.service';
import { JwtCookieGuard } from '../guards/jwt-cookie.guard';
import { RolesGuard } from '../guards/roles.guard';
import { JwtCookieStrategy } from '../strategies/jwt-cookie.strategy';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [TypeOrmModule.forFeature([QuoteRequest])],
  controllers: [AdminEnquiriesController],
  providers: [AdminEnquiriesService, JwtCookieGuard, RolesGuard, JwtCookieStrategy, JoseService],
})
export class AdminEnquiriesModule {}
