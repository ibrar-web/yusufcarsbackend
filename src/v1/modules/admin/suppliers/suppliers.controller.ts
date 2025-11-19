import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminSuppliersService } from './suppliers.service';
import { JwtCookieGuard } from '../guards/jwt-cookie.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UpdateAdminSupplierDto } from './dto/update-admin-supplier.dto';
import { StatusReasonDto } from '../dto/status-reason.dto';
import { SupplierApprovalStatus } from '../../../entities/supplier.entity';
@Controller('admin/suppliers')
@UseGuards(JwtCookieGuard, RolesGuard)
@Roles('admin')
export class AdminSuppliersController {
  constructor(private readonly suppliers: AdminSuppliersService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('approvalStatus') approvalStatus?: SupplierApprovalStatus,
    @Query('isActive') isActive?: string,
    @Query('query') query?: string,
  ) {
    return this.suppliers.list({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      approvalStatus,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      query,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    console.log('api called for supplier details');
    return this.suppliers.findOne(id);
  }

  @Get(':id/documents')
  documents(@Param('id') id: string) {
    return this.suppliers.getDocuments(id);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.suppliers.approve(id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: StatusReasonDto) {
    return this.suppliers.reject(id, dto.reason);
  }

  @Post(':id/enable')
  enable(@Param('id') id: string) {
    return this.suppliers.enable(id);
  }

  @Post(':id/disable')
  disable(@Param('id') id: string, @Body() dto: StatusReasonDto) {
    return this.suppliers.disable(id, dto.reason);
  }
}
