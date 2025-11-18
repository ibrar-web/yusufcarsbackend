import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminEnquiriesService } from './enquiries.service';
import { JwtCookieGuard } from '../guards/jwt-cookie.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { AssignEnquiryDto } from './dto/assign-enquiry.dto';
import { UpdateEnquiryStatusDto } from './dto/update-enquiry-status.dto';
import { AddEnquiryNoteDto } from './dto/add-enquiry-note.dto';

@Controller('admin/enquiries')
@UseGuards(JwtCookieGuard, RolesGuard)
@Roles('admin')
export class AdminEnquiriesController {
  constructor(private readonly enquiries: AdminEnquiriesService) {}

  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: 'pending' | 'expired' | 'completed',
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sortDir') sortDir?: 'ASC' | 'DESC',
  ) {
    return this.enquiries.list({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      from,
      to,
      sortDir: sortDir || 'DESC',
    });
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.enquiries.findOne(id);
  }

  @Post(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignEnquiryDto) {
    return this.enquiries.assign(id, dto);
  }

  @Post(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateEnquiryStatusDto) {
    return this.enquiries.updateStatus(id, dto);
  }

  @Patch(':id/notes')
  addNote(@Param('id') id: string, @Body() dto: AddEnquiryNoteDto) {
    return this.enquiries.addNote(id, dto);
  }
}
