import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { SupplierProfileService } from './profile.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  UpdateSupplierBusinesDto,
  UpdateSupplierPasswordDto,
} from './profile.dto';
import { CurrentUser } from '../../admin/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';

@Controller('supplier/profile')
@UseGuards(AuthGuard, RolesGuard)
@Roles('supplier')
export class SupplierProfileController {
  constructor(private readonly profile: SupplierProfileService) {}

  @Get()
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.profile.getProfile(user.sub);
  }

  @Put()
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSupplierBusinesDto,
  ) {
    return this.profile.updateProfile(user.sub, dto);
  }

  @Put('password')
  updatePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSupplierPasswordDto,
  ) {
    return this.profile.updatePassword(user.sub, dto);
  }
}
