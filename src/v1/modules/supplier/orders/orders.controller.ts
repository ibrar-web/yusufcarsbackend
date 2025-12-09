import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SupplierOrdersService } from './orders.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../admin/decorators/current-user.decorator';

@Controller('supplier/orders')
@UseGuards(AuthGuard, RolesGuard)
@Roles('supplier')
export class SupplierOrdersController {
  constructor(private readonly orders: SupplierOrdersService) {}

  @Get()
  list(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.orders.list(user.sub, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      sortDir: 'DESC',
    });
  }

  @Get(':id')
  detail(@CurrentUser() user: any, @Param('id') id: string) {
    return this.orders.detail(user.sub, id);
  }
}
