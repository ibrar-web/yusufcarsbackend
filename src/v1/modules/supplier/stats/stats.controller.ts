import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupplierStatsService } from './stats.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../admin/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';

@Controller('supplier/stats')
@UseGuards(AuthGuard, RolesGuard)
@Roles('supplier')
export class SupplierStatsController {
  constructor(private readonly stats: SupplierStatsService) {}

  @Get('/')
  overview(@CurrentUser() user: AuthenticatedUser) {
    return this.stats.overview(user.sub);
  }
}
