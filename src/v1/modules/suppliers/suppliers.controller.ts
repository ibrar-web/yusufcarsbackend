import { Body, Controller, Delete, Get, Param, Put, Query, Req, UseGuards, Post } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Roles, AppRole } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('/api/v1/suppliers')
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Get()
  async list(
    @Query('isVerified') isVerified?: string,
    @Query('postCode') postCode?: string,
    @Query('category') category?: string,
  ) {
    return this.suppliers.list({
      isVerified: isVerified === undefined ? undefined : isVerified === 'true',
      postCode,
      category,
    });
  }

  @Get('me')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('supplier')
  async me(@Req() req: any) {
    return this.suppliers.getMine(req.user.sub);
  }

  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('supplier', 'admin')
  async update(@Param('id') id: string, @Req() req: any, @Body() body: any) {
    const isAdmin = req.user.role === 'admin';
    return this.suppliers.update(id, req.user.sub, body, isAdmin);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async deactivate(@Param('id') id: string) {
    return this.suppliers.deactivate(id);
  }

  @Post(':id/verify')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async verify(@Param('id') id: string) {
    return this.suppliers.verify(id);
  }
}

