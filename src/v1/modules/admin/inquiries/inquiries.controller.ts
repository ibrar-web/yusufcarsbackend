import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminEnquiriesService } from './inquiries.service';
import { JwtCookieGuard } from '../guards/jwt-cookie.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UpdateEnquiryStatusDto } from './dto/update-enquiry-status.dto';
import {
  InquiryStatus,
  UrgencyLevel,
} from '../../../entities/inquiries.entity';

@Controller('admin/inquiries')
@UseGuards(JwtCookieGuard, RolesGuard)
@Roles('admin')
export class AdminEnquiriesController {
  constructor(private readonly enquiries: AdminEnquiriesService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: InquiryStatus,
    @Query('urgency') urgency?: UrgencyLevel,
    @Query('contact') contact?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sortDir') sortDir?: 'ASC' | 'DESC',
  ) {
    return this.enquiries.list({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      urgency,
      contact:
        contact === undefined
          ? undefined
          : contact === 'true' || contact === '1',
      from,
      to,
      sortDir: sortDir || 'DESC',
    });
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.enquiries.findOne(id);
  }

  @Post(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateEnquiryStatusDto) {
    return this.enquiries.updateStatus(id, dto);
  }
}
