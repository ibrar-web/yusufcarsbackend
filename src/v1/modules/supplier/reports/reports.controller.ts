import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupplierReportsService } from './reports.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../admin/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';

@Controller('supplier/reports')
@UseGuards(AuthGuard, RolesGuard)
@Roles('supplier')
export class SupplierReportsController {
  constructor(private readonly reports: SupplierReportsService) {}

  @Get()
  getReportedOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.reports.getReportedOrders(user.sub);
  }
}
