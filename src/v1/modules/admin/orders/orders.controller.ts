import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AdminOrdersService } from './orders.service';
import { JwtCookieGuard } from '../guards/jwt-cookie.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('admin/orders')
@UseGuards(JwtCookieGuard, RolesGuard)
@Roles('admin')
export class AdminOrdersController {
  constructor(private readonly orders: AdminOrdersService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.orders.list({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      sortDir: 'DESC',
    });
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.orders.detail(id);
  }
}
