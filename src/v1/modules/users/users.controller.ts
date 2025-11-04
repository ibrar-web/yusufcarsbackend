import {
  Controller,
  Get,
  Param,
  Query,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('/api/v1/users')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async list(@Query('role') role?: any, @Query('active') active?: string) {
    const isActive = active === undefined ? undefined : active === 'true';
    const data = await this.users.findAll({ role, isActive } as any);
    return data.map((u) => u.toPublic());
  }

  @Get(':id')
  async details(@Param('id') id: string) {
    return (await this.users.findOne(id)).toPublic();
  }

  @Patch(':id/role')
  async setRole(
    @Param('id') id: string,
    @Body() body: { role: 'admin' | 'user' | 'supplier' | 'garage' },
  ) {
    return await this.users.setRole(id, body.role);
  }

  @Patch(':id/active')
  async setActive(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    return await this.users.setActive(id, body.isActive);
  }
}
