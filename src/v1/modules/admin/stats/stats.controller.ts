import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminStatsService } from './stats.service';
import { JwtCookieGuard } from '../guards/jwt-cookie.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('admin/stats')
@UseGuards(JwtCookieGuard, RolesGuard)
@Roles('admin')
export class AdminStatsController {
  constructor(private readonly stats: AdminStatsService) {}

  @Get('/')
  dashboard() {
    return this.stats.dashboard();
  }
}
