import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminReportsService } from './reports.service';
import { JwtCookieGuard } from '../guards/jwt-cookie.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('admin/reports')
@UseGuards(JwtCookieGuard, RolesGuard)
@Roles('admin')
export class AdminReportsController {
  constructor(private readonly reports: AdminReportsService) {}

  @Get()
  GetAllReports () {
    return this.reports.getAllReports();
  }

  @Get('summary')
  summary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reports.summary({ from, to });
  }

  @Get('detailed')
  detailed(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reports.detailed({ from, to });
  }

  @Get('export')
  export(
    @Query('format') format: 'csv' | 'pdf' = 'csv',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reports.export(format, { from, to });
  }
}
