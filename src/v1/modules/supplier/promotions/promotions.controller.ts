import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SupplierPromotionsService } from './promotions.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { CurrentUser } from '../../admin/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';

@Controller('supplier/promotions')
@UseGuards(AuthGuard, RolesGuard)
@Roles('supplier')
export class SupplierPromotionsController {
  constructor(private readonly promotions: SupplierPromotionsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.promotions.listForSupplier(user.sub);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePromotionDto,
  ) {
    return this.promotions.createPromotion(user.sub, dto);
  }

  @Patch(':promotionId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('promotionId') promotionId: string,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.promotions.updatePromotion(user.sub, promotionId, dto);
  }
}
