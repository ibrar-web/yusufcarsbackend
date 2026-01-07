import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierPromotion } from '../../../entities/supplier-promotion.entity';
import { SupplierPromotionsController } from './promotions.controller';
import { SupplierPromotionsService } from './promotions.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JoseService } from '../../auth/jose.service';
import { User } from '../../../entities/user.entity';
import { ServiceCategory } from '../../../entities/services/service-category.entity';
import { ServiceItem } from '../../../entities/services/service-item.entity';
import { PromotionLifecycleService } from './promotion-lifecycle.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupplierPromotion,
      User,
      ServiceCategory,
      ServiceItem,
    ]),
  ],
  controllers: [SupplierPromotionsController],
  providers: [
    SupplierPromotionsService,
    PromotionLifecycleService,
    AuthGuard,
    RolesGuard,
    JoseService,
  ],
  exports: [SupplierPromotionsService],
})
export class SupplierPromotionsModule {}
