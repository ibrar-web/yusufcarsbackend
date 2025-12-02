import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SupplierQuotesService } from './quotesrequest.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../admin/decorators/current-user.decorator';
@Controller('supplier/quotes/request')
@UseGuards(AuthGuard, RolesGuard)
@Roles('supplier')
export class SupplierQuotesController {
  constructor(private readonly quotes: SupplierQuotesService) {}

  @Get()
  list(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('query') search?: string,
  ) {
    return this.quotes.listSupplierNotifications(user.sub, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
  }

  @Get(':id')
  detail(@CurrentUser() user: any, @Param('id') id: string) {
    return this.quotes.detail(user.sub, id);
  }
}
