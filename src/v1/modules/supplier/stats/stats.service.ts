import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Order,
  OrderStatus,
} from '../../../entities/quotes/order.entity';
import { ReviewRating } from '../../../entities/reviews_rating.entity';

@Injectable()
export class SupplierStatsService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(ReviewRating)
    private readonly reviews: Repository<ReviewRating>,
  ) {}

  async overview(supplierId: string) {
    const [totalOrders, activeOrders, completedOrders] = await Promise.all([
      this.orders.count({ where: { supplierId } }),
      this.orders.count({
        where: { supplierId, status: OrderStatus.IN_TRANSIT },
      }),
      this.orders.count({
        where: { supplierId, status: OrderStatus.COMPLETED },
      }),
    ]);

    const reviewAggregate = await this.reviews
      .createQueryBuilder('review')
      .select('COUNT(review.id)', 'total')
      .addSelect('COALESCE(AVG(review.rating), 0)', 'average')
      .where('review.supplierId = :supplierId', { supplierId })
      .getRawOne<{ total: string; average: string | null }>();

    const totalReviews = reviewAggregate ? Number(reviewAggregate.total) : 0;
    const averageRatingRaw = reviewAggregate?.average
      ? Number(reviewAggregate.average)
      : 0;
    const averageRating = Math.round(averageRatingRaw * 100) / 100;

    return {
      totalOrders,
      activeOrders,
      completedOrders,
      totalReviews,
      averageRating,
    };
  }
}
