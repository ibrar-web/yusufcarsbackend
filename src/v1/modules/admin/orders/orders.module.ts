import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../../entities/quotes/order.entity';
import { ReviewRating } from '../../../entities/reviews_rating.entity';
import { AdminOrdersController } from './orders.controller';
import { AdminOrdersService } from './orders.service';
import { JwtCookieGuard } from '../guards/jwt-cookie.guard';
import { RolesGuard } from '../guards/roles.guard';
import { JwtCookieStrategy } from '../strategies/jwt-cookie.strategy';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, ReviewRating])],
  controllers: [AdminOrdersController],
  providers: [
    AdminOrdersService,
    JwtCookieGuard,
    RolesGuard,
    JwtCookieStrategy,
    JoseService,
  ],
})
export class AdminOrdersModule {}
