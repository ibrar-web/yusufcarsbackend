import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SupplierMessagesService } from './messages.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentUser } from '../../admin/decorators/current-user.decorator';

@Controller('supplier/chat')
@UseGuards(AuthGuard, RolesGuard)
@Roles('supplier')
export class SupplierMessagesController {
  constructor(private readonly messages: SupplierMessagesService) {}

  @Get()
  list(
    @CurrentUser() user: any,
    @Query('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messages.list(user.sub, userId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('list')
  listChats(
    @CurrentUser() user: any,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messages.listChats(user.sub, {
      userId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post()
  send(@CurrentUser() user: any, @Body() dto: SendMessageDto) {
    return this.messages.send(user.sub, dto);
  }
}
