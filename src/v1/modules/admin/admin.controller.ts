import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('/api/v1/admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('users')
  users(
    @Query('role') role?: any,
    @Query('active') active?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.admin.listUsers({
      role,
      active: active === undefined ? undefined : active === 'true',
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 50,
    });
  }

  @Get('suppliers')
  suppliers(
    @Query('isVerified') isVerified?: string,
    @Query('postcode') postcode?: string,
    @Query('category') category?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.admin.listSuppliers({
      isVerified: isVerified === undefined ? undefined : isVerified === 'true',
      postcode,
      category,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 50,
    });
  }

  @Post('suppliers/:id/verify')
  verify(@Param('id') id: string) {
    return this.admin.verifySupplier(id);
  }

  @Post('suppliers/:id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.admin.deactivateSupplier(id);
  }

  @Post('seed-admin')
  seed(@Body() body: { email: string; password: string }) {
    return this.admin.seedAdmin(body.email, body.password);
  }
}
