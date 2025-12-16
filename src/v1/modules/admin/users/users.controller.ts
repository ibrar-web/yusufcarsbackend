import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminUsersService } from './users.service';
import { JwtCookieGuard } from '../guards/jwt-cookie.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { StatusReasonDto } from '../dto/status-reason.dto';
import { UserStatus } from '../../../entities/user.entity';

@Controller('admin/users')
@UseGuards(JwtCookieGuard, RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('query') query?: string,
    @Query('status') status?: UserStatus,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: 'ASC' | 'DESC',
  ) {
    return this.users.list({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      query,
      status,
      sortDir: sortDir || 'DESC',
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminUserDto) {
    return this.users.update(id, dto);
  }

  @Post(':id/enable')
  enable(@Param('id') id: string) {
    return this.users.enable(id);
  }

  @Post(':id/disable')
  disable(@Param('id') id: string, @Body() dto: StatusReasonDto) {
    return this.users.disable(id, dto.reason);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
}
