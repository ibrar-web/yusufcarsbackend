import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { UserProfileService } from './profile.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../admin/decorators/current-user.decorator';
import { UpdateUserPasswordDto, UpdateUserProfileDto } from './profile.dto';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';

@Controller('user/profile')
@UseGuards(AuthGuard, RolesGuard)
@Roles('user')
export class UserProfileController {
  constructor(private readonly profile: UserProfileService) {}

  @Get()
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.profile.getProfile(user.sub);
  }

  @Put()
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserProfileDto,
  ) {
    return this.profile.updateProfile(user.sub, dto);
  }

  @Put('password')
  updatePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserPasswordDto,
  ) {
    return this.profile.updatePassword(user.sub, dto);
  }
}
