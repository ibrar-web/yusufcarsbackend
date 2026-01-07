import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadgeAllocationService } from './badge-allocation.service';
import { User } from '../../entities/user.entity';
import { UserBadge } from '../../entities/user-badge.entity';
import { SupplierQuoteNotification } from '../../entities/quotes/supplier-quote-notification.entity';
import { Order } from '../../entities/quotes/order.entity';
import { ReviewRating } from '../../entities/reviews_rating.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserBadge,
      SupplierQuoteNotification,
      Order,
      ReviewRating,
    ]),
  ],
  providers: [BadgeAllocationService],
})
export class BadgesModule {}
