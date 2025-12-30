import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../../entities/quotes/order.entity';
import { ReviewRating } from '../../../entities/reviews_rating.entity';
import { Report } from '../../../entities/reports.entity';
import { UserOrdersController } from './user-orders.controller';
import { UserOrdersService } from './user-orders.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, ReviewRating, Report])],
  controllers: [UserOrdersController],
  providers: [UserOrdersService, AuthGuard, RolesGuard, JoseService],
})
export class UserOrdersModule {}
