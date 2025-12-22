import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../../entities/quotes/order.entity';
import { ReviewRating } from '../../../entities/reviews_rating.entity';
import { SupplierStatsController } from './stats.controller';
import { SupplierStatsService } from './stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, ReviewRating])],
  controllers: [SupplierStatsController],
  providers: [SupplierStatsService],
})
export class SupplierStatsModule {}
