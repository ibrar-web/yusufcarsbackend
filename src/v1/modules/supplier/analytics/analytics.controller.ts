import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SupplierAnalyticsService } from './analytics.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@Controller('supplier/analytics')
@UseGuards(AuthGuard, RolesGuard)
@Roles('supplier')
export class SupplierAnalyticsController {
  constructor(private readonly analytics: SupplierAnalyticsService) {}

  @Get()
  summary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analytics.summary({ from, to });
  }
}
