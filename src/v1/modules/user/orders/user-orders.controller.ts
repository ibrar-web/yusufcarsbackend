import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserOrdersService } from './user-orders.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../admin/decorators/current-user.decorator';
import { CompleteOrderDto } from './dto/complete-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';

@Controller('user/orders')
@UseGuards(AuthGuard, RolesGuard)
@Roles('user')
export class UserOrdersController {
  constructor(private readonly orders: UserOrdersService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.orders.list(user.sub, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      sortDir: 'DESC',
      search,
    });
  }

  @Get(':id')
  detail(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.orders.detail(user.sub, id);
  }

  @Post(':id/complete')
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CompleteOrderDto,
  ) {
    return this.orders.complete(user.sub, id, dto);
  }

  @Post(':id/cancel')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orders.cancel(user.sub, id, dto);
  }
}
