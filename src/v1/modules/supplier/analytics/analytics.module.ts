import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quote } from '../../../entities/quote-offers.entity';
import { QuoteRequest } from '../../../entities/quotes/quote-request.entity';
import { SupplierAnalyticsController } from './analytics.controller';
import { SupplierAnalyticsService } from './analytics.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [TypeOrmModule.forFeature([Quote, QuoteRequest])],
  controllers: [SupplierAnalyticsController],
  providers: [SupplierAnalyticsService, AuthGuard, RolesGuard, JoseService],
})
export class SupplierAnalyticsModule {}
