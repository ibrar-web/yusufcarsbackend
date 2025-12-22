import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../../entities/quotes/order.entity';
import { ReviewRating } from '../../../entities/reviews_rating.entity';
import { SupplierStatsController } from './stats.controller';
import { SupplierStatsService } from './stats.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, ReviewRating])],
  controllers: [SupplierStatsController],
  providers: [SupplierStatsService, AuthGuard, RolesGuard, JoseService],
})
export class SupplierStatsModule {}
