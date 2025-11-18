import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { UserSettingsService } from './user-settings.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../admin/decorators/current-user.decorator';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';

@Controller('user/settings')
@UseGuards(AuthGuard, RolesGuard)
@Roles('user')
export class UserSettingsController {
  constructor(private readonly settings: UserSettingsService) {}

  @Get()
  me(@CurrentUser() user: any) {
    return this.settings.get(user.sub);
  }

  @Put()
  update(@CurrentUser() user: any, @Body() dto: UpdateUserSettingsDto) {
    return this.settings.update(user.sub, dto);
  }
}
