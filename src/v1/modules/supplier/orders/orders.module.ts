import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../../entities/quotes/order.entity';
import { ReviewRating } from '../../../entities/reviews_rating.entity';
import { SupplierOrdersController } from './orders.controller';
import { SupplierOrdersService } from './orders.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JoseService } from '../../auth/jose.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, ReviewRating])],
  controllers: [SupplierOrdersController],
  providers: [SupplierOrdersService, AuthGuard, RolesGuard, JoseService],
})
export class SupplierOrdersModule {}
