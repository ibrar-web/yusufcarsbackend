import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminSuppliersService } from './suppliers.service';
import { JwtCookieGuard } from '../guards/jwt-cookie.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UpdateAdminSupplierDto } from './dto/update-admin-supplier.dto';

@Controller('admin/suppliers')
@UseGuards(JwtCookieGuard, RolesGuard)
@Roles('admin')
export class AdminSuppliersController {
  constructor(private readonly suppliers: AdminSuppliersService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isVerified') isVerified?: string,
    @Query('isActive') isActive?: string,
    @Query('query') query?: string,
  ) {
    return this.suppliers.list({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      isVerified: isVerified === undefined ? undefined : isVerified === 'true',
      isActive: isActive === undefined ? undefined : isActive === 'true',
      query,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suppliers.findOne(id);
  }

  @Get(':id/documents')
  documents(@Param('id') id: string) {
    return this.suppliers.getDocuments(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminSupplierDto) {
    return this.suppliers.update(id, dto);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.suppliers.approve(id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string) {
    return this.suppliers.reject(id);
  }

  @Post(':id/enable')
  enable(@Param('id') id: string) {
    return this.suppliers.enable(id);
  }

  @Post(':id/disable')
  disable(@Param('id') id: string) {
    return this.suppliers.disable(id);
  }
}
