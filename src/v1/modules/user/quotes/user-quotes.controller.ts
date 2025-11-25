import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserQuotesService } from './user-quotes.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../admin/decorators/current-user.decorator';

@Controller('user/quotes')
@UseGuards(AuthGuard, RolesGuard)
@Roles('user')
export class UserQuotesController {
  constructor(private readonly notifications: UserQuotesService) {}

  @Get()
  availableQuotes(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: 'pending' | 'expired',
  ) {
    return this.notifications.availableQuotes(user.sub, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }
}
