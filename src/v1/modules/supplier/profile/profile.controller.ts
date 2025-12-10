import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { SupplierProfileService } from './profile.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  UpdateSupplierPasswordDto,
  UpdateSupplierProfileDto,
} from './profile.dto';
import { CurrentUser } from '../../admin/decorators/current-user.decorator';

@Controller('supplier/profile')
@UseGuards(AuthGuard, RolesGuard)
@Roles('supplier')
export class SupplierProfileController {
  constructor(private readonly profile: SupplierProfileService) {}

  @Get()
  me(@CurrentUser() user: any) {
    return this.profile.getProfile(user.sub);
  }

  @Put()
  update(@CurrentUser() user: any, @Body() dto: UpdateSupplierProfileDto) {
    return this.profile.updateProfile(user.sub, dto);
  }

  @Put('password')
  updatePassword(
    @CurrentUser() user: any,
    @Body() dto: UpdateSupplierPasswordDto,
  ) {
    return this.profile.updatePassword(user.sub, dto);
  }
}
