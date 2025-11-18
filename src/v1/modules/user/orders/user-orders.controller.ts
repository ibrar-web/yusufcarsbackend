import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserOrdersService } from './user-orders.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../admin/decorators/current-user.decorator';

@Controller('user/orders')
@UseGuards(AuthGuard, RolesGuard)
@Roles('user')
export class UserOrdersController {
  constructor(private readonly orders: UserOrdersService) {}

  @Get()
  list(@CurrentUser() user: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.orders.list(user.sub, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      sortDir: 'DESC',
    });
  }
}
