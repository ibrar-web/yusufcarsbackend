import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SupplierQuotesService } from './quotesrequest.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import type { QuoteStatus } from './quotesrequest.types';

@Controller('supplier/quotes/request')
@UseGuards(AuthGuard, RolesGuard)
@Roles('supplier')
export class SupplierQuotesController {
  constructor(private readonly quotes: SupplierQuotesService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: QuoteStatus,
    @Query('sortDir') sortDir?: 'ASC' | 'DESC',
    @Query('query') search?: string,
  ) {
    return this.quotes.listForSupplier({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      sortDir: sortDir || 'DESC',
      search,
    });
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.quotes.detail(id);
  }
}
